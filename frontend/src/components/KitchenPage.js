import React from 'react';
import ItemManagement from './ItemManagement';
import CategoryManagement from './CategoryManagement';
import TableManagement from './TableManagement';
import CallWaiterManagement from './CallWaiterManagement';

const KitchenPage = ({ navigate }) => (
  <div className="kitchen-page max-w-3xl mx-auto py-8">
    <button
      className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
      onClick={() => navigate('/admin')}
    >
      ← Back
    </button>
    <h2 className="text-3xl font-bold mb-6 text-blue-700">Kitchen Management</h2>
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow p-6">
        <ItemManagement />
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <CategoryManagement />
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <TableManagement />
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <CallWaiterManagement />
      </div>
    </div>
  </div>
);

export default KitchenPage;