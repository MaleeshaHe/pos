import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalCredit: number;
  recentBills: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const result = await window.api.getDashboardStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon size={28} color={color} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of your store performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats?.todaySales || 0)}
          icon={DollarSign}
          color="#10b981"
          subtitle={`${stats?.todayTransactions || 0} transactions`}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="#3b82f6"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockCount || 0}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle="Needs restock"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="#8b5cf6"
        />
        <StatCard
          title="Outstanding Credit"
          value={formatCurrency(stats?.totalCredit || 0)}
          icon={TrendingUp}
          color="#f59e0b"
        />
        <StatCard
          title="Transactions Today"
          value={stats?.todayTransactions || 0}
          icon={ShoppingBag}
          color="#06b6d4"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  Bill Number
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  Date & Time
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                  Payment Method
                </th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentBills && stats.recentBills.length > 0 ? (
                stats.recentBills.map((bill: any) => (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-blue-600">
                      {bill.billNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(bill.createdAt).toLocaleString('en-LK')}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(bill.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No transactions yet today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
