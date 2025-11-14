import { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Star,
  Bell,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalCredit: number;
  recentBills: any[];
}

interface DailySales {
  date: string;
  sales: number;
}

interface CategorySales {
  category: string;
  sales: number;
  color: string;
}

interface ProductPerformance {
  id: number;
  name: string;
  quantitySold: number;
  revenue: number;
  profit: number;
  costPrice: number;
  sellingPrice: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlySales, setMonthlySales] = useState({ current: 0, previous: 0 });
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [bestSelling, setBestSelling] = useState<ProductPerformance[]>([]);
  const [mostProfitable, setMostProfitable] = useState<ProductPerformance[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadDailySalesChart(),
        loadMonthlySalesComparison(),
        loadCategorySales(),
        loadProductPerformance(),
        loadLowStockAlerts(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    const result = await window.api.getDashboardStats();
    if (result.success) {
      setStats(result.data);
    }
  };

  const loadDailySalesChart = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const salesByDay = last7Days.map((date) => {
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const daySales = billsResult.data
        .filter((bill: any) => {
          const billDate = new Date(bill.createdAt);
          return billDate >= dayStart && billDate <= dayEnd;
        })
        .reduce((sum: number, bill: any) => sum + bill.total, 0);

      return {
        date: format(date, 'MMM dd'),
        sales: daySales,
      };
    });

    setDailySales(salesByDay);
  };

  const loadMonthlySalesComparison = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const lastMonthStart = startOfMonth(subDays(now, 30));
    const lastMonthEnd = endOfMonth(subDays(now, 30));

    const currentMonthSales = billsResult.data
      .filter((bill: any) => {
        const billDate = new Date(bill.createdAt);
        return billDate >= currentMonthStart && billDate <= currentMonthEnd;
      })
      .reduce((sum: number, bill: any) => sum + bill.total, 0);

    const lastMonthSales = billsResult.data
      .filter((bill: any) => {
        const billDate = new Date(bill.createdAt);
        return billDate >= lastMonthStart && billDate <= lastMonthEnd;
      })
      .reduce((sum: number, bill: any) => sum + bill.total, 0);

    setMonthlySales({ current: currentMonthSales, previous: lastMonthSales });
  };

  const loadCategorySales = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const categorySalesMap: Record<string, number> = {};
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    for (const bill of billsResult.data) {
      const itemsResult = await window.api.getBillItems(bill.id);
      if (itemsResult.success) {
        for (const item of itemsResult.data) {
          const productResult = await window.api.getProduct(item.productId);
          if (productResult.success && productResult.data) {
            const category = productResult.data.category || 'Uncategorized';
            categorySalesMap[category] = (categorySalesMap[category] || 0) + item.subtotal;
          }
        }
      }
    }

    const categoryData = Object.entries(categorySalesMap)
      .map(([category, sales], index) => ({
        category,
        sales,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);

    setCategorySales(categoryData);
  };

  const loadProductPerformance = async () => {
    const billsResult = await window.api.getBills();
    if (!billsResult.success) return;

    const productPerformance: Record<number, ProductPerformance> = {};

    for (const bill of billsResult.data) {
      const itemsResult = await window.api.getBillItems(bill.id);
      if (itemsResult.success) {
        for (const item of itemsResult.data) {
          const productResult = await window.api.getProduct(item.productId);
          if (productResult.success && productResult.data) {
            const product = productResult.data;

            if (!productPerformance[item.productId]) {
              productPerformance[item.productId] = {
                id: item.productId,
                name: item.productName,
                quantitySold: 0,
                revenue: 0,
                profit: 0,
                costPrice: product.costPrice,
                sellingPrice: product.sellingPrice,
              };
            }

            productPerformance[item.productId].quantitySold += item.quantity;
            productPerformance[item.productId].revenue += item.subtotal;
            productPerformance[item.productId].profit +=
              (product.sellingPrice - product.costPrice) * item.quantity;
          }
        }
      }
    }

    const products = Object.values(productPerformance);

    setBestSelling(products.sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5));
    setMostProfitable(products.sort((a, b) => b.profit - a.profit).slice(0, 5));
  };

  const loadLowStockAlerts = async () => {
    const productsResult = await window.api.getProducts();
    if (productsResult.success) {
      const lowStock = productsResult.data
        .filter((p: any) => p.currentStock <= p.reorderLevel)
        .sort((a: any, b: any) => a.currentStock - b.currentStock)
        .slice(0, 5);
      setLowStockProducts(lowStock);
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
    return `Rs. ${amount.toFixed(2)}`;
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    trend,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    trend?: { value: number; positive: boolean };
  }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.positive ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              )}
              <span
                className={`text-xs font-semibold ${trend.positive ? 'text-green-600' : 'text-red-600'}`}
              >
                {trend.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon size={28} color={color} />
        </div>
      </div>
    </div>
  );

  // Calculate monthly comparison trend
  const monthlyTrend =
    monthlySales.previous > 0
      ? ((monthlySales.current - monthlySales.previous) / monthlySales.previous) * 100
      : 0;

  // Bar Chart Component
  const BarChart = ({ data }: { data: DailySales[] }) => {
    const maxSales = Math.max(...data.map((d) => d.sales), 1);
    const chartHeight = 200;

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">Daily Sales (Last 7 Days)</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-64">
          {data.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: chartHeight }}>
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {day.sales > 0 ? formatCurrency(day.sales) : ''}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                  style={{
                    height: `${(day.sales / maxSales) * (chartHeight - 30)}px`,
                    minHeight: day.sales > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 font-medium">{day.date}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Pie Chart Component
  const PieChartComponent = ({ data }: { data: CategorySales[] }) => {
    const total = data.reduce((sum, item) => sum + item.sales, 0);
    let currentAngle = 0;

    const createArc = (startAngle: number, endAngle: number) => {
      const start = polarToCartesian(100, 100, 80, endAngle);
      const end = polarToCartesian(100, 100, 80, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return `M 100 100 L ${start.x} ${start.y} A 80 80 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="text-green-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">Category Sales Distribution</h3>
        </div>
        <div className="flex items-center gap-8">
          <svg viewBox="0 0 200 200" className="w-48 h-48">
            {data.map((item, index) => {
              const percentage = (item.sales / total) * 100;
              const angle = (percentage / 100) * 360;
              const path = createArc(currentAngle, currentAngle + angle);
              currentAngle += angle;

              return (
                <g key={index}>
                  <path d={path} fill={item.color} stroke="white" strokeWidth="2" className="hover:opacity-80 transition-opacity" />
                </g>
              );
            })}
            <circle cx="100" cy="100" r="40" fill="white" />
            <text x="100" y="100" textAnchor="middle" dy="0.3em" className="text-sm font-bold fill-gray-700">
              {formatCurrency(total)}
            </text>
          </svg>
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700">{item.category}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.sales)} ({((item.sales / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Real-time overview of your store performance</p>
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
          title="Monthly Sales"
          value={formatCurrency(monthlySales.current)}
          icon={Calendar}
          color="#3b82f6"
          trend={{
            value: monthlyTrend,
            positive: monthlyTrend >= 0,
          }}
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="#8b5cf6"
          subtitle={`${lowStockProducts.length} low stock`}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="#06b6d4"
        />
        <StatCard
          title="Outstanding Credit"
          value={formatCurrency(stats?.totalCredit || 0)}
          icon={TrendingUp}
          color="#f59e0b"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          color="#ef4444"
          subtitle="Needs attention"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart data={dailySales} />
        {categorySales.length > 0 && <PieChartComponent data={categorySales} />}
      </div>

      {/* Performance & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Best Selling Items */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="text-yellow-500" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Best Selling Items</h3>
          </div>
          <div className="space-y-3">
            {bestSelling.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantitySold} units sold</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
            {bestSelling.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Most Profitable Items */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Most Profitable</h3>
          </div>
          <div className="space-y-3">
            {mostProfitable.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    Margin: {(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(product.profit)}</p>
                </div>
              </div>
            ))}
            {mostProfitable.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No profit data yet</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-red-600" size={24} />
            <h3 className="text-lg font-bold text-gray-800">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.currentStock} / Reorder: {product.reorderLevel}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    {product.currentStock === 0 ? 'OUT' : 'LOW'}
                  </span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="text-sm text-green-600 text-center py-4">All stock levels are good!</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Last 10 Transactions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Bill Number</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Payment Method</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentBills && stats.recentBills.length > 0 ? (
                stats.recentBills.slice(0, 10).map((bill: any) => (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-blue-600">{bill.billNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(bill.createdAt), 'MMM dd, yyyy HH:mm')}
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
                    No transactions yet
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
