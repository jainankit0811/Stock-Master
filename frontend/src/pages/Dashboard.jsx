import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardKPIs } from '../api/dashboard';
import { getReceipts } from '../api/receipts';
import { getDeliveryOrders } from '../api/deliveries';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    receipts: { toReceive: 0, late: 0, waiting: 0, operations: 0 },
    deliveries: { toDeliver: 0, late: 0, waiting: 0, operations: 0 },
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch receipts and deliveries to calculate stats
      const receiptsRes = await getReceipts();
      const deliveriesRes = await getDeliveryOrders();

      const receipts = receiptsRes.success ? receiptsRes.data.receipts || [] : [];
      const deliveries = deliveriesRes.success ? deliveriesRes.data.deliveryOrders || [] : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calculate receipt stats
      const receiptStats = {
        toReceive: receipts.filter((r) => r.status === 'Draft' || r.status === 'Ready').length,
        late: receipts.filter((r) => {
          if (!r.scheduleDate) return false;
          const scheduleDate = new Date(r.scheduleDate);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate < today && (r.status === 'Draft' || r.status === 'Ready');
        }).length,
        waiting: receipts.filter((r) => r.status === 'Ready').length,
        operations: receipts.filter((r) => {
          if (!r.scheduleDate) return false;
          const scheduleDate = new Date(r.scheduleDate);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate > today && (r.status === 'Draft' || r.status === 'Ready');
        }).length,
      };

      // Calculate delivery stats
      const deliveryStats = {
        toDeliver: deliveries.filter((d) => d.status === 'Draft' || d.status === 'Ready').length,
        late: deliveries.filter((d) => {
          if (!d.scheduleDate) return false;
          const scheduleDate = new Date(d.scheduleDate);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate < today && (d.status === 'Draft' || d.status === 'Ready');
        }).length,
        waiting: deliveries.filter((d) => d.status === 'Ready').length,
        operations: deliveries.filter((d) => {
          if (!d.scheduleDate) return false;
          const scheduleDate = new Date(d.scheduleDate);
          scheduleDate.setHours(0, 0, 0, 0);
          return scheduleDate > today && (d.status === 'Draft' || d.status === 'Ready');
        }).length,
      };

      setStats({
        receipts: receiptStats,
        deliveries: deliveryStats,
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Current statistics and operations</p>
      </div>

      {/* Receipt and Delivery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receipt Card */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Receipt</h2>
            <button
              onClick={() => navigate('/receipts?action=create')}
              className="text-sm text-brand-primary hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {stats.receipts.toReceive} to receive
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400 font-medium">
                {stats.receipts.late} Late
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.receipts.waiting} Waiting
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {stats.receipts.operations} operations
            </div>
          </div>
        </div>

        {/* Delivery Card */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery</h2>
            <button
              onClick={() => navigate('/deliveries?action=create')}
              className="text-sm text-brand-primary hover:underline"
            >
              View All →
            </button>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {stats.deliveries.toDeliver} to Deliver
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-red-600 dark:text-red-400 font-medium">
                {stats.deliveries.late} Late
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.deliveries.waiting} Waiting
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {stats.deliveries.operations} operations
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/receipts?action=create')}
            className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">New Receipt</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Record incoming goods</p>
          </button>
          <button
            onClick={() => navigate('/deliveries?action=create')}
            className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">🚚</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">New Delivery</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create delivery order</p>
          </button>
          <button
            onClick={() => navigate('/transfers?action=create')}
            className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">↔️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Transfer Stock</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Move between warehouses</p>
          </button>
          <button
            onClick={() => navigate('/adjustments?action=create')}
            className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-2xl mb-2">⚖️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Adjust Stock</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fix stock discrepancies</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
