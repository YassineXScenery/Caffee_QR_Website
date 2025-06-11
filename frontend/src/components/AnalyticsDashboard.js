import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const API_URL = 'http://localhost:3000/api';

const AnalyticsDashboard = () => {
  const { i18n } = useTranslation();
  const [orderTrends, setOrderTrends] = useState([]);
  const [customerCount, setCustomerCount] = useState([]);
  const [revenueHeatmap, setRevenueHeatmap] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [net, setNet] = useState(0);
  const [period, setPeriod] = useState('monthly');

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const [trendsRes, customerRes, heatmapRes, popularRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/order-trends`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${API_URL}/analytics/customer-count?period=month`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${API_URL}/analytics/revenue-heatmap?type=hourly`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        axios.get(`${API_URL}/analytics/popular-items?limit=5`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setOrderTrends(trendsRes.data);
      setCustomerCount(customerRes.data);
      setRevenueHeatmap(heatmapRes.data);
      setPopularItems(popularRes.data);
    } catch (err) {
      setAnalyticsError('Failed to load analytics');
    }
    setAnalyticsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/analytics/revenue?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setRevenue(res.data[0]?.revenue || 0));
    axios.get(`${API_URL}/analytics/expenses?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setExpenses(res.data[0]?.expenses || 0));
    axios.get(`${API_URL}/analytics/net?period=${period}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => setNet(res.data[0]?.net || 0));
  }, [period]);

  // Helper to format YYYY/MM or YYYY-MM as 'Juin (2025)' in French, 'June (2025)' in English, etc.
  function formatMonthLabel(label) {
    if (!label) return label;
    // Accepts '2025/06' or '2025-06' or '2025/6' or '2025-6'
    const match = label.match(/(\d{4})[\/-](\d{1,2})/);
    if (!match) return label;
    const year = match[1];
    const month = parseInt(match[2], 10);
    // Month names for supported languages
    const monthNames = {
      fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    };
    const lang = i18n.language.startsWith('fr') ? 'fr' : i18n.language.startsWith('ar') ? 'ar' : 'en';
    const monthName = monthNames[lang][month - 1] || label;
    return `${monthName} (${year})`;
  }

  // Chart Data Preparation
  const orderTrendsChartData = {
    labels: orderTrends.map(row => formatMonthLabel(row.month || row.period || row.label)),
    datasets: [
      {
        label: 'Order Count',
        data: orderTrends.map(row => row.order_count),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
      {
        label: 'Net Revenue',
        data: orderTrends.map(row => row.net_revenue),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const customerCountChartData = {
    labels: customerCount.map(row => formatMonthLabel(row.period || row.month || row.label)),
    datasets: [
      {
        label: 'Unique Customers',
        data: customerCount.map(row => row.customer_count),
        borderColor: 'rgba(251, 191, 36, 1)',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const maxRevenue = Math.max(...revenueHeatmap.map(row => row.revenue || 0), 1);
  const heatmapColors = revenueHeatmap.map(row => {
    const percent = (row.revenue || 0) / maxRevenue;
    return `rgba(59,130,246,${0.3 + percent * 0.7})`;
  });
  const revenueHeatmapChartData = {
    labels: revenueHeatmap.map(row =>
      row.hour !== undefined ? `${row.hour}:00` : row.label
    ),
    datasets: [
      {
        label: 'Revenue',
        data: revenueHeatmap.map(row => row.revenue),
        backgroundColor: heatmapColors,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(59,130,246,1)',
      },
    ],
  };

  const popularItemsChartData = {
    labels: popularItems.map(row => row.item_name),
    datasets: [
      {
        label: 'Sold',
        data: popularItems.map(row => row.sold),
        backgroundColor: 'rgba(251, 113, 133, 0.7)',
        borderColor: 'rgba(251, 113, 133, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(251, 113, 133, 1)',
      },
    ],
  };

  return (
    <div className="mb-8 p-4 border rounded bg-gray-50 shadow-lg animate-fade-in">
      <h2 className="text-lg font-bold mb-2">Analytics Dashboard</h2>
      <div className="flex gap-4 mb-4">
        <button onClick={() => setPeriod('daily')} className={period==='daily' ? 'bg-blue-600 text-white px-2 rounded' : 'bg-gray-200 px-2 rounded'}>Daily</button>
        <button onClick={() => setPeriod('weekly')} className={period==='weekly' ? 'bg-blue-600 text-white px-2 rounded' : 'bg-gray-200 px-2 rounded'}>Weekly</button>
        <button onClick={() => setPeriod('monthly')} className={period==='monthly' ? 'bg-blue-600 text-white px-2 rounded' : 'bg-gray-200 px-2 rounded'}>Monthly</button>
        <button onClick={() => setPeriod('yearly')} className={period==='yearly' ? 'bg-blue-600 text-white px-2 rounded' : 'bg-gray-200 px-2 rounded'}>Yearly</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500">Revenue</div>
          <div className="text-2xl font-bold">${revenue}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500">Expenses</div>
          <div className="text-2xl font-bold">${expenses}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-gray-500">Net Profit</div>
          <div className="text-2xl font-bold">${net}</div>
        </div>
      </div>
      {analyticsLoading && <div>Loading analytics...</div>}
      {analyticsError && <div className="text-red-600">{analyticsError}</div>}
      {/* Order Trends */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Order Trends (Month-over-Month)</h3>
        {orderTrends.length === 0 ? (
          <div className="text-center">No data</div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Line
              data={orderTrendsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: false },
                  tooltip: { mode: 'index', intersect: false },
                },
                animation: {
                  duration: 1200,
                  easing: 'easeInOutQuart',
                },
                scales: {
                  x: { grid: { color: '#e5e7eb' } },
                  y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                },
              }}
              height={220}
              width={500}
            />
          </div>
        )}
      </div>
      {/* Customer Count */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Customer Count (Monthly)</h3>
        {customerCount.length === 0 ? (
          <div className="text-center">No data</div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Line
              data={customerCountChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                  tooltip: { mode: 'index', intersect: false },
                },
                animation: {
                  duration: 1200,
                  easing: 'easeInOutQuart',
                },
                scales: {
                  x: { grid: { color: '#e5e7eb' } },
                  y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                },
              }}
              height={220}
              width={500}
            />
          </div>
        )}
      </div>
      {/* Revenue Heatmap (Hourly) */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Revenue Heatmap (Hourly)</h3>
        {revenueHeatmap.length === 0 ? (
          <div className="text-center">No data</div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Bar
              data={revenueHeatmapChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Revenue: ${context.parsed.y}`;
                      }
                    }
                  }
                },
                animation: {
                  duration: 1200,
                  easing: 'easeInOutQuart',
                },
                scales: {
                  x: { grid: { color: '#e5e7eb' } },
                  y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                },
              }}
              height={220}
              width={500}
            />
          </div>
        )}
      </div>
      {/* Top 5 Popular Items */}
      <div className="mb-8">
        <h3 className="font-semibold mb-2">Top 5 Popular Items</h3>
        {popularItems.length === 0 ? (
          <div className="text-center">No data</div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <Bar
              data={popularItemsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Sold: ${context.parsed.y}`;
                      }
                    }
                  }
                },
                animation: {
                  duration: 1200,
                  easing: 'easeInOutQuart',
                },
                scales: {
                  x: { grid: { color: '#e5e7eb' } },
                  y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
                },
              }}
              height={220}
              width={500}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
