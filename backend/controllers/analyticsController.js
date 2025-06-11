// Controller for analytics endpoints
const db = require('../databasemenu');
const { parseISO, isValid } = require('date-fns');

// Helper: Validate date string (YYYY-MM-DD)
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  return isValid(d);
}

// GET /api/analytics/revenue?period=daily|weekly|monthly|yearly
exports.getRevenue = (req, res) => {
  const period = req.query.period || 'daily';
  let groupBy = 'DATE(created_at)';
  if (period === 'weekly') groupBy = 'YEAR(created_at), WEEK(created_at)';
  if (period === 'monthly') groupBy = 'YEAR(created_at), MONTH(created_at)';
  if (period === 'yearly') groupBy = 'YEAR(created_at)';
  // Only include paid orders
  db.query(`SELECT ${groupBy} as period, SUM(total) as revenue FROM orders WHERE status = 'paid' GROUP BY ${groupBy} ORDER BY period DESC LIMIT 30`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET /api/analytics/expenses?period=...
exports.getExpenses = (req, res) => {
  const period = req.query.period || 'daily';
  let groupBy = 'DATE(expense_date)';
  if (period === 'weekly') groupBy = 'YEAR(expense_date), WEEK(expense_date)';
  if (period === 'monthly') groupBy = 'YEAR(expense_date), MONTH(expense_date)';
  if (period === 'yearly') groupBy = 'YEAR(expense_date)';
  db.query(`SELECT ${groupBy} as period, SUM(amount) as expenses FROM expenses GROUP BY ${groupBy} ORDER BY period DESC LIMIT 30`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// GET /api/analytics/net?period=...
exports.getNetProfit = (req, res) => {
  // Net = revenue - expenses for the period
  // For simplicity, get both and subtract in JS
  const period = req.query.period || 'daily';
  let groupByOrders = 'DATE(created_at)';
  let groupByExpenses = 'DATE(expense_date)';
  if (period === 'weekly') { groupByOrders = 'YEAR(created_at), WEEK(created_at)'; groupByExpenses = 'YEAR(expense_date), WEEK(expense_date)'; }
  if (period === 'monthly') { groupByOrders = 'YEAR(created_at), MONTH(created_at)'; groupByExpenses = 'YEAR(expense_date), MONTH(expense_date)'; }
  if (period === 'yearly') { groupByOrders = 'YEAR(created_at)'; groupByExpenses = 'YEAR(expense_date)'; }
  db.query(`SELECT ${groupByOrders} as period, SUM(total) as revenue FROM orders WHERE status = 'paid' GROUP BY ${groupByOrders}`, (err, revRows) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(`SELECT ${groupByExpenses} as period, SUM(amount) as expenses FROM expenses GROUP BY ${groupByExpenses}`, (err, expRows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Merge by period
      const net = {};
      revRows.forEach(r => { net[r.period] = { revenue: r.revenue, expenses: 0 }; });
      expRows.forEach(e => {
        if (!net[e.period]) net[e.period] = { revenue: 0, expenses: e.expenses };
        else net[e.period].expenses = e.expenses;
      });
      const result = Object.entries(net).map(([period, vals]) => ({ period, net: (vals.revenue - vals.expenses) }));
      res.json(result);
    });
  });
};

// GET /api/analytics/popular-items?limit=5
exports.getPopularItems = (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  db.query(
    `SELECT oi.item_id, i.item_name, SUM(oi.quantity) as sold
     FROM order_items oi
     JOIN items i ON oi.item_id = i.item_id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status = 'paid'
     GROUP BY oi.item_id, i.item_name
     ORDER BY sold DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// 1. Order Trends with Net Revenue (Month-over-Month/Year-over-Year)
exports.getOrderTrends = async (req, res) => {
  try {
    const { start, end, group = 'month' } = req.query;
    if (start && !isValidDate(start)) return res.status(400).json({ error: 'Invalid start date' });
    if (end && !isValidDate(end)) return res.status(400).json({ error: 'Invalid end date' });
    if (!['month', 'year'].includes(group)) return res.status(400).json({ error: 'Invalid group param' });

    let dateFormat = group === 'year' ? '%Y' : '%Y-%m';
    let params = [];
    let where = "WHERE status = 'paid'";
    if (start) { where += ' AND created_at >= ?'; params.push(start); }
    if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

    // Net revenue, order count, grouped by month/year
    const sql = `SELECT DATE_FORMAT(created_at, '${dateFormat}') as period, COUNT(*) as order_count, SUM(total) as net_revenue
      FROM orders ${where}
      GROUP BY period ORDER BY period`;
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('OrderTrends SQL error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  } catch (e) {
    console.error('OrderTrends catch error:', e);
    res.status(500).json({ error: e.message });
  }
};

// 2. Customer Count per Day/Week/Month
exports.getCustomerCount = async (req, res) => {
  try {
    const { start, end, period = 'day' } = req.query;
    if (start && !isValidDate(start)) return res.status(400).json({ error: 'Invalid start date' });
    if (end && !isValidDate(end)) return res.status(400).json({ error: 'Invalid end date' });
    if (!['day', 'week', 'month'].includes(period)) return res.status(400).json({ error: 'Invalid period param' });

    let dateFormat = '%Y-%m-%d';
    if (period === 'week') dateFormat = '%x-W%v';
    if (period === 'month') dateFormat = '%Y-%m';
    let params = [];
    let where = "WHERE status = 'paid'";
    if (start) { where += ' AND created_at >= ?'; params.push(start); }
    if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

    // Count all paid orders per period (not distinct table_number)
    const sql = `SELECT DATE_FORMAT(created_at, '${dateFormat}') as period, COUNT(*) as customer_count
      FROM orders ${where}
      GROUP BY period ORDER BY period`;
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('CustomerCount SQL error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  } catch (e) {
    console.error('CustomerCount catch error:', e);
    res.status(500).json({ error: e.message });
  }
};

// 3. Revenue by Time Heatmaps (Hourly, Weekly)
exports.getRevenueHeatmap = async (req, res) => {
  try {
    const { start, end, type = 'hourly' } = req.query;
    if (start && !isValidDate(start)) return res.status(400).json({ error: 'Invalid start date' });
    if (end && !isValidDate(end)) return res.status(400).json({ error: 'Invalid end date' });
    if (!['hourly', 'weekly'].includes(type)) return res.status(400).json({ error: 'Invalid type param' });

    let params = [];
    let where = "WHERE status = 'paid'";
    if (start) { where += ' AND created_at >= ?'; params.push(start); }
    if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

    let sql;
    if (type === 'hourly') {
      sql = `SELECT HOUR(created_at) as hour, SUM(total) as revenue, COUNT(*) as orders
        FROM orders ${where}
        GROUP BY hour ORDER BY hour`;
    } else {
      sql = `SELECT DAYOFWEEK(created_at) as weekday, SUM(total) as revenue, COUNT(*) as orders
        FROM orders ${where}
        GROUP BY weekday ORDER BY weekday`;
    }
    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('RevenueHeatmap SQL error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  } catch (e) {
    console.error('RevenueHeatmap catch error:', e);
    res.status(500).json({ error: e.message });
  }
};
