import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardKPIs, getInventoryOperations } from '../api/dashboard';
import { getProducts } from '../api/products';
import { getWarehouses } from '../api/warehouses';
import SelectInput from '../components/form/SelectInput';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [kpis, setKpis] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });
  const [operations, setOperations] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    warehouseId: '',
    category: '',
  });
  const [loading, setLoading] = useState(true);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardKPIs();
      if (response.success) {
        setKpis(response.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard KPIs');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response.success) {
        const productsList = response.data.products || [];
        setProducts(productsList);
        // Extract unique categories
        const uniqueCategories = [...new Set(productsList.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await getWarehouses();
      if (response.success) {
        setWarehouses(response.data.warehouses || []);
      }
    } catch (error) {
      console.error('Failed to load warehouses');
    }
  };

  const fetchOperations = async () => {
    setOperationsLoading(true);
    try {
      const params = {};
      if (filters.documentType) params.documentType = filters.documentType;
      if (filters.status) params.status = filters.status;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      if (filters.category) params.category = filters.category;

      const response = await getInventoryOperations(params);
      if (response.success) {
        setOperations(response.data.operations || []);
      }
    } catch (error) {
      toast.error('Failed to load inventory operations');
    } finally {
      setOperationsLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      documentType: '',
      status: '',
      warehouseId: '',
      category: '',
    });
  };

  const operationColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString(),
      sortable: true,
    },
    {
      key: 'documentType',
      label: 'Type',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'Receipt' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          value === 'Delivery' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
          value === 'Transfer' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'documentNumber',
      label: 'Document #',
      sortable: true,
    },
    {
      key: 'product',
      label: 'Product',
      render: (value) => value?.name || 'N/A',
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value, row) => (
        <span className={row.documentType === 'Delivery' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
          {row.documentType === 'Delivery' ? '-' : '+'}{value}
        </span>
      ),
    },
    {
      key: 'warehouse',
      label: 'Warehouse/Location',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value === 'Validated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'createdBy',
      label: 'Created By',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <p className="text-gray-600 dark:text-gray-400">
          Snapshot of inventory operations and key performance indicators
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Products in Stock */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products in Stock</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{kpis.totalProducts}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        {/* Low Stock / Out of Stock */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{kpis.lowStockCount}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {kpis.outOfStockCount} Out of Stock
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>

        {/* Pending Receipts */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Receipts</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{kpis.pendingReceipts}</p>
            </div>
            <div className="text-4xl">📥</div>
          </div>
          <button
            onClick={() => navigate('/receipts')}
            className="text-xs text-brand-primary hover:underline mt-2"
          >
            View All →
          </button>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Deliveries</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{kpis.pendingDeliveries}</p>
            </div>
            <div className="text-4xl">📤</div>
          </div>
          <button
            onClick={() => navigate('/deliveries')}
            className="text-xs text-brand-primary hover:underline mt-2"
          >
            View All →
          </button>
        </div>

        {/* Internal Transfers Scheduled */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Internal Transfers Scheduled</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{kpis.pendingTransfers}</p>
            </div>
            <div className="text-4xl">↔️</div>
          </div>
          <button
            onClick={() => navigate('/transfers')}
            className="text-xs text-brand-primary hover:underline mt-2"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Inventory Operations Snapshot */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Inventory Operations Snapshot</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recent inventory movements and transactions
            </p>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SelectInput
            label="Document Type"
            name="documentType"
            value={filters.documentType}
            onChange={(e) => handleFilterChange('documentType', e.target.value)}
            options={[
              { value: '', label: 'All Types' },
              { value: 'Receipt', label: 'Receipts' },
              { value: 'Delivery', label: 'Deliveries' },
              { value: 'Transfer', label: 'Internal Transfers' },
              { value: 'Adjustment', label: 'Adjustments' },
            ]}
          />
          <SelectInput
            label="Status"
            name="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Validated', label: 'Done' },
            ]}
          />
          <SelectInput
            label="Warehouse/Location"
            name="warehouseId"
            value={filters.warehouseId}
            onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w._id, label: w.name })),
            ]}
          />
          <SelectInput
            label="Product Category"
            name="category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat, label: cat })),
            ]}
          />
        </div>

        {/* Clear Filters Button */}
        {(filters.documentType || filters.status || filters.warehouseId || filters.category) && (
          <div className="mb-4">
            <button
              onClick={clearFilters}
              className="text-sm text-brand-primary hover:underline"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Operations Table */}
        {operationsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading operations...</p>
          </div>
        ) : operations.length > 0 ? (
          <DataTable
            data={operations}
            columns={operationColumns}
          />
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No operations found matching the selected filters.
          </div>
        )}
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
