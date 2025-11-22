import React, { useState, useEffect } from 'react';
import { getActiveStockAlerts, resolveStockAlert, triggerStockCheck } from '../api/stockAlerts'; // Will create this API file
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const StockAlerts = () => {
  const { isManager } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await getActiveStockAlerts();
      if (response.success) {
        setAlerts(response.data.alerts || []);
      }
    } catch (error) {
      toast.error('Failed to load stock alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId) => {
    if (!isManager) {
      toast.error('Only managers can resolve stock alerts');
      return;
    }
    if (!window.confirm('Are you sure you want to resolve this alert?')) return;

    try {
      const response = await resolveStockAlert(alertId);
      if (response.success) {
        toast.success('Alert resolved successfully');
        fetchAlerts(); // Refresh alerts
      } else {
        toast.error(response.message || 'Failed to resolve alert');
      }
    } catch (error) {
      toast.error('Error resolving alert');
    }
  };

  const handleTriggerCheck = async () => {
    if (!isManager) {
      toast.error('Only managers can trigger stock checks');
      return;
    }
    try {
      const response = await triggerStockCheck();
      if (response.success) {
        toast.success(response.message || 'Stock check triggered');
        fetchAlerts(); // Refresh alerts after check
      } else {
        toast.error(response.message || 'Failed to trigger stock check');
      }
    } catch (error) {
      toast.error('Error triggering stock check');
    }
  };

  const columns = [
    {
      key: 'productId',
      label: 'Product',
      render: (value, row) => row.productId?.name || 'N/A',
      sortable: true
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (value, row) => row.warehouseId?.name || 'N/A',
      sortable: true
    },
    {
      key: 'currentStock',
      label: 'Current Stock',
      sortable: true
    },
    {
      key: 'minStockLevel',
      label: 'Min Level',
      render: (value, row) => row.minStockLevel || 0,
      sortable: true
    },
    {
      key: 'alertDate',
      label: 'Alert Date',
      render: (value) => value ? new Date(value).toLocaleString() : 'N/A',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, row) => (
        <StatusBadge status={row.isResolved ? 'Resolved' : 'Active'} />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) =>
        !row.isResolved && isManager ? (
          <button
            onClick={() => handleResolveAlert(row._id)}
            className="text-green-600 hover:text-green-900 text-sm"
          >
            Resolve
          </button>
        ) : null
    }
  ];

  if (loading) {
    return <div className="text-center py-8">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage low stock notifications</p>
        </div>
        {isManager && (
          <button
            onClick={handleTriggerCheck}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
          >
            Trigger Stock Check
          </button>
        )}
      </div>

      <DataTable
        data={alerts}
        columns={columns}
        noDataMessage="No active stock alerts found."
      />
    </div>
  );
};

export default StockAlerts;
