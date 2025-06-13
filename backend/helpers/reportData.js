const db = require('../databasemenu');
const { parseISO, isValid } = require('date-fns');

function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  return isValid(d);
}

// Helper to build GROUP BY clause and date filtering SQL + params
function buildGroupByAndFilter(period, date, dateField) {
  let groupBy;
  let whereClauses = [];
  let params = [];

  switch (period) {
    case 'weekly':
      groupBy = `YEAR(${dateField}), WEEK(${dateField})`;
      break;
    case 'monthly':
      groupBy = `YEAR(${dateField}), MONTH(${dateField})`;
      break;
    case 'yearly':
      groupBy = `YEAR(${dateField})`;
      break;
    case 'daily':
    default:
      groupBy = `DATE(${dateField})`;
  }

  if (date) {
    if (period === 'daily') {
      if (!isValidDate(date)) throw new Error('Invalid date for daily period');
      whereClauses.push(`DATE(${dateField}) = ?`);
      params.push(date);
    } else if (period === 'monthly') {
      if (!/^\d{4}-\d{2}$/.test(date)) throw new Error('Invalid date for monthly period');
      whereClauses.push(`DATE_FORMAT(${dateField}, '%Y-%m') = ?`);
      params.push(date);
    } else if (period === 'yearly') {
      if (!/^\d{4}$/.test(date)) throw new Error('Invalid date for yearly period');
      whereClauses.push(`YEAR(${dateField}) = ?`);
      params.push(date);
    } else if (period === 'weekly') {
      throw new Error('Filtering by date not supported for weekly period');
    }
  }

  return { groupBy, whereClauses, params };
}

function queryPromise(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Revenue report
async function getRevenue(period = 'daily', date = null) {
  try {
    const { groupBy, whereClauses, params } = buildGroupByAndFilter(period, date, 'created_at');

    let where = "WHERE status = 'paid'";
    if (whereClauses.length) where += ' AND ' + whereClauses.join(' AND ');

    const limit = date ? '' : 'LIMIT 30';

    const sql = `
      SELECT ${groupBy} as period, SUM(total) as revenue 
      FROM orders 
      ${where}
      GROUP BY ${groupBy}
      ORDER BY period DESC
      ${limit}
    `;
    return await queryPromise(sql, params);
  } catch (e) {
    throw e;
  }
}

// Expenses report
async function getExpenses(period = 'daily', date = null) {
  try {
    const { groupBy, whereClauses, params } = buildGroupByAndFilter(period, date, 'expense_date');

    let where = '';
    if (whereClauses.length) where = 'WHERE ' + whereClauses.join(' AND ');

    const limit = date ? '' : 'LIMIT 30';

    const sql = `
      SELECT ${groupBy} as period, SUM(amount) as expenses
      FROM expenses
      ${where}
      GROUP BY ${groupBy}
      ORDER BY period DESC
      ${limit}
    `;
    return await queryPromise(sql, params);
  } catch (e) {
    throw e;
  }
}

// Net profit = revenue - expenses (merged by period)
async function getNetProfit(period = 'daily', date = null) {
  try {
    const { groupBy: groupByOrders, whereClauses: ordersWhereClauses, params: ordersParams } = buildGroupByAndFilter(period, date, 'created_at');
    const { groupBy: groupByExpenses, whereClauses: expensesWhereClauses, params: expensesParams } = buildGroupByAndFilter(period, date, 'expense_date');

    let ordersWhere = "WHERE status = 'paid'";
    if (ordersWhereClauses.length) ordersWhere += ' AND ' + ordersWhereClauses.join(' AND ');

    let expensesWhere = '';
    if (expensesWhereClauses.length) expensesWhere = 'WHERE ' + expensesWhereClauses.join(' AND ');

    const sqlOrders = `
      SELECT ${groupByOrders} as period, SUM(total) as revenue
      FROM orders
      ${ordersWhere}
      GROUP BY ${groupByOrders}
    `;

    const sqlExpenses = `
      SELECT ${groupByExpenses} as period, SUM(amount) as expenses
      FROM expenses
      ${expensesWhere}
      GROUP BY ${groupByExpenses}
    `;

    const [revRows, expRows] = await Promise.all([
      queryPromise(sqlOrders, ordersParams),
      queryPromise(sqlExpenses, expensesParams),
    ]);

    const net = {};
    revRows.forEach(r => { net[r.period] = { revenue: r.revenue, expenses: 0 }; });
    expRows.forEach(e => {
      if (!net[e.period]) net[e.period] = { revenue: 0, expenses: e.expenses };
      else net[e.period].expenses = e.expenses;
    });

    return Object.entries(net).map(([period, vals]) => ({
      period,
      net_profit: vals.revenue - vals.expenses
    }));
  } catch (e) {
    throw e;
  }
}

// Popular items
async function getPopularItems(limit = 5) {
  const sql = `
    SELECT oi.item_id, i.item_name, SUM(oi.quantity) as sold
    FROM order_items oi
    JOIN items i ON oi.item_id = i.item_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'paid'
    GROUP BY oi.item_id, i.item_name
    ORDER BY sold DESC
    LIMIT ?
  `;
  return await queryPromise(sql, [limit]);
}

// Order trends (month/year) with optional start/end date
async function getOrderTrends({ start = null, end = null, group = 'month' } = {}) {
  if (start && !isValidDate(start)) throw new Error('Invalid start date');
  if (end && !isValidDate(end)) throw new Error('Invalid end date');
  if (!['month', 'year'].includes(group)) throw new Error('Invalid group param');

  const dateFormat = group === 'year' ? '%Y' : '%Y-%m';
  const params = [];
  let where = "WHERE status = 'paid'";
  if (start) { where += ' AND created_at >= ?'; params.push(start); }
  if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

  const sql = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') as period, COUNT(*) as order_count, SUM(total) as net_revenue
    FROM orders
    ${where}
    GROUP BY period
    ORDER BY period
  `;

  return await queryPromise(sql, params);
}

// Customer count per period
async function getCustomerCount({ start = null, end = null, period = 'day' } = {}) {
  if (start && !isValidDate(start)) throw new Error('Invalid start date');
  if (end && !isValidDate(end)) throw new Error('Invalid end date');
  if (!['day', 'week', 'month'].includes(period)) throw new Error('Invalid period param');

  let dateFormat = '%Y-%m-%d';
  if (period === 'week') dateFormat = '%x-W%v';
  else if (period === 'month') dateFormat = '%Y-%m';

  const params = [];
  let where = "WHERE status = 'paid'";
  if (start) { where += ' AND created_at >= ?'; params.push(start); }
  if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

  const sql = `
    SELECT DATE_FORMAT(created_at, '${dateFormat}') as period, COUNT(*) as customer_count
    FROM orders
    ${where}
    GROUP BY period
    ORDER BY period
  `;

  return await queryPromise(sql, params);
}

// Revenue heatmap hourly or weekly
async function getRevenueHeatmap({ start = null, end = null, type = 'hourly' } = {}) {
  if (start && !isValidDate(start)) throw new Error('Invalid start date');
  if (end && !isValidDate(end)) throw new Error('Invalid end date');
  if (!['hourly', 'weekly'].includes(type)) throw new Error('Invalid type param');

  const params = [];
  let where = "WHERE status = 'paid'";
  if (start) { where += ' AND created_at >= ?'; params.push(start); }
  if (end) { where += ' AND created_at <= ?'; params.push(end + ' 23:59:59'); }

  let sql;
  if (type === 'hourly') {
    sql = `
      SELECT HOUR(created_at) as hour, SUM(total) as revenue, COUNT(*) as orders
      FROM orders
      ${where}
      GROUP BY hour
      ORDER BY hour
    `;
  } else {
    sql = `
      SELECT DAYOFWEEK(created_at) as weekday, SUM(total) as revenue, COUNT(*) as orders
      FROM orders
      ${where}
      GROUP BY weekday
      ORDER BY weekday
    `;
  }

  return await queryPromise(sql, params);
}

// General report for daily, monthly, or yearly periods
async function getReport(period, date) {
  if (!['daily', 'monthly', 'yearly'].includes(period)) throw new Error('Invalid period');
  if (period === 'daily' && !isValidDate(date)) throw new Error('Invalid date for daily period');
  if (period === 'monthly' && !/^\d{4}-\d{2}$/.test(date)) throw new Error('Invalid date for monthly period');
  if (period === 'yearly' && !/^\d{4}$/.test(date)) throw new Error('Invalid date for yearly period');

  const revenuePromise = getRevenue(period, date);
  const expensesPromise = getExpenses(period, date);
  let itemsSql;
  let itemsParams = [];

  if (period === 'daily') {
    itemsSql = `
      SELECT i.item_name as name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.price) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN items i ON oi.item_id = i.item_id
      WHERE o.status = 'paid' AND DATE(o.created_at) = ?
      GROUP BY i.item_id, i.item_name
    `;
    itemsParams = [date];
  } else if (period === 'monthly') {
    itemsSql = `
      SELECT i.item_name as name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.price) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN items i ON oi.item_id = i.item_id
      WHERE o.status = 'paid' AND DATE_FORMAT(o.created_at, '%Y-%m') = ?
      GROUP BY i.item_id, i.item_name
    `;
    itemsParams = [date];
  } else if (period === 'yearly') {
    itemsSql = `
      SELECT i.item_name as name, SUM(oi.quantity) as quantity, SUM(oi.quantity * oi.price) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN items i ON oi.item_id = i.item_id
      WHERE o.status = 'paid' AND YEAR(o.created_at) = ?
      GROUP BY i.item_id, i.item_name
    `;
    itemsParams = [date];
  }

  const itemsPromise = queryPromise(itemsSql, itemsParams);

  const [revenueRows, expensesRows, items] = await Promise.all([revenuePromise, expensesPromise, itemsPromise]);

  const revenue = revenueRows[0] ? revenueRows[0].revenue : 0;
  const expenses = expensesRows[0] ? expensesRows[0].expenses : 0;

  return {
    period,
    date,
    items,
    revenue,
    expenses
  };
}

module.exports = {
  getRevenue,
  getExpenses,
  getNetProfit,
  getPopularItems,
  getOrderTrends,
  getCustomerCount,
  getRevenueHeatmap,
  getReport
};