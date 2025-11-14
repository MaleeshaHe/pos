import { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', description: 'Daily, weekly, or monthly sales summary' },
    { id: 'inventory', name: 'Inventory Report', description: 'Stock levels and valuation' },
    { id: 'credit', name: 'Credit Report', description: 'Outstanding customer credits' },
    { id: 'profit', name: 'Profit & Loss', description: 'Financial performance analysis' },
    { id: 'expenses', name: 'Expense Report', description: 'Business expense tracking' },
    { id: 'customer', name: 'Customer Report', description: 'Customer purchase history' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-600">Generate business insights and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Report Types</h2>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    reportType === type.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText size={20} className={reportType === type.id ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{type.name}</p>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Configuration & Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {reportTypes.find((t) => t.id === reportType)?.name}
            </h2>

            {/* Date Range Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Today
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Yesterday
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  This Week
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  This Month
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                  Last Month
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                <FileText size={20} />
                Generate Report
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                <Download size={20} />
                Export PDF
              </button>
            </div>

            {/* Report Preview Placeholder */}
            <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Calendar size={48} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium">Report preview will appear here</p>
              <p className="text-sm text-gray-500 mt-1">
                Select date range and click "Generate Report"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
