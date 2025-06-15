import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Add FiTrash for the new Wastage tab icon
import { FiBarChart2, FiPackage, FiDollarSign, FiFileText, FiHome, FiArrowLeft, FiTrash } from 'react-icons/fi';

import AnalyticsDashboard from './AnalyticsDashboard';
import StockPage from './StockPage';
import ExpensePage from './ExpensePage';
import ReportGenerator from './ReportGenerator';
import Wastage from './wastage'; // <-- 1. Import the new component
import { useTranslation } from 'react-i18next';

const AnalyticsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      label: 'Analytics Dashboard',
      icon: FiBarChart2,
      component: <AnalyticsDashboard />
    },
    {
      id: 'stock',
      label: 'Stock Management',
      icon: FiPackage,
      component: <StockPage />
    },
    {
      id: 'expenses',
      label: 'Expense Management',
      icon: FiDollarSign,
      component: <ExpensePage />
    },
    // --- 2. Add the new Wastage tab here ---
    {
      id: 'wastage',
      label: 'Wastage Management',
      icon: FiTrash,
      component: <Wastage />
    },
    {
      id: 'reports',
      label: 'Report Generator',
      icon: FiFileText,
      component: <ReportGenerator />
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <FiHome className="h-5 w-5" />
                <span className="hidden sm:inline">Back to Hub</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('analyticsHub') || 'Analytics Hub'}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm min-h-96">
          {activeTabData ? (
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <activeTabData.icon className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTabData.label}
                </h2>
              </div>
              <div className="analytics-tab-content">
                {activeTabData.component}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <FiBarChart2 className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-500">Select a tab to view analytics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
