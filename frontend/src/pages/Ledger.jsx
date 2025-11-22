import { useState, useEffect } from 'react';
import { getLedgerEntries } from '../api/ledger';
import DataTable from '../components/DataTable';
import SelectInput from '../components/form/SelectInput';
import { getProducts } from '../api/products';
import { getWarehouses } from '../api/warehouses';
import toast from 'react-hot-toast';

const Ledger = () => {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [filters, setFilters] = useState({
    productId: '',
    warehouseId: '',
    documentType: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
    fetchEntries();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  const fetchProducts = async () => {
    const response = await getProducts();
    if (response.success) {
      setProducts(response.data.products || []);
    }
  };

  const fetchWarehouses = async () => {
    const response = await getWarehouses();
    if (response.success) {
      setWarehouses(response.data.warehouses || []);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.productId) params.productId = filters.productId;
      if (filters.warehouseId) params.warehouseId = filters.warehouseId;
      if (filters.documentType) params.documentType = filters.documentType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await getLedgerEntries(params);
      if (response.success) {
        setEntries(response.data.entries || []);
      }
    } catch (error) {
      toast.error('Failed to load ledger entries');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: 'documentType',
      label: 'Document Type',
      sortable: true,
    },
    {
      key: 'productId',
      label: 'Product',
      render: (value, row) => (row.productId?.name || 'N/A'),
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (value, row) => (row.warehouseId?.name || 'N/A'),
    },
    {
      key: 'quantity',
      label: 'Quantity Change',
      render: (value) => (
        <span className={value > 0 ? 'text-green-600' : 'text-red-600'}>
          {value > 0 ? '+' : ''}{value}
        </span>
      ),
    },
    {
      key: 'balanceBefore',
      label: 'Balance Before',
      sortable: true,
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      sortable: true,
    },
    {
      key: 'userId',
      label: 'User',
      render: (value, row) => (row.userId?.name || 'N/A'),
    },
    {
      key: 'notes',
      label: 'Notes',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ledger</h1>
        <p className="text-gray-600 dark:text-gray-400">Immutable stock movement history</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <SelectInput
            label="Product"
            name="productId"
            value={filters.productId}
            onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
            options={products.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="All Products"
          />
          <SelectInput
            label="Warehouse"
            name="warehouseId"
            value={filters.warehouseId}
            onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            placeholder="All Warehouses"
          />
          <SelectInput
            label="Document Type"
            name="documentType"
            value={filters.documentType}
            onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
            options={[
              { value: '', label: 'All Types' },
              { value: 'Receipt', label: 'Receipt' },
              { value: 'DeliveryOrder', label: 'Delivery Order' },
              { value: 'Transfer', label: 'Transfer' },
              { value: 'Adjustment', label: 'Adjustment' },
            ]}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            placeholder="End Date"
          />
        </div>
      </div>

      <DataTable data={entries} columns={columns} loading={loading} />
    </div>
  );
};

export default Ledger;

