import { useState, useEffect } from 'react';
import { getLedgerEntries } from '../api/ledger';
import { getReceipts } from '../api/receipts';
import { getDeliveryOrders } from '../api/deliveries';
import { getTransfers } from '../api/transfers';
import DataTable from '../components/DataTable';
import KanbanBoard from '../components/KanbanBoard';
import SelectInput from '../components/form/SelectInput';
import { getProducts } from '../api/products';
import { getWarehouses } from '../api/warehouses';
import toast from 'react-hot-toast';

const MoveHistory = () => {
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [viewMode, setViewMode] = useState('list');
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
      // Fetch all document types and combine
      const [receiptsRes, deliveriesRes, transfersRes, ledgerRes] = await Promise.all([
        getReceipts(),
        getDeliveryOrders(),
        getTransfers(),
        getLedgerEntries(filters),
      ]);

      const receipts = receiptsRes.success ? receiptsRes.data.receipts || [] : [];
      const deliveries = deliveriesRes.success ? deliveriesRes.data.deliveryOrders || [] : [];
      const transfers = transfersRes.success ? transfersRes.data.transfers || [] : [];
      const ledgerEntries = ledgerRes.success ? ledgerRes.data.entries || [] : [];

      // Transform to move history format
      const moves = [];

      // Process receipts (IN moves - green)
      receipts.forEach((receipt) => {
        receipt.lines?.forEach((line) => {
          moves.push({
            _id: `${receipt._id}-${line._id}`,
            reference: receipt.receiptNumber,
            date: receipt.createdAt,
            contact: receipt.receiveFrom || 'N/A',
            from: 'vendor',
            to: receipt.warehouseId?.name || receipt.warehouseId || 'N/A',
            quantity: line.quantity,
            status: receipt.status,
            type: 'Receipt',
            isIn: true, // IN move - green
          });
        });
      });

      // Process deliveries (OUT moves - red)
      deliveries.forEach((delivery) => {
        delivery.lines?.forEach((line) => {
          moves.push({
            _id: `${delivery._id}-${line._id}`,
            reference: delivery.orderNumber,
            date: delivery.createdAt,
            contact: delivery.deliveryAddress || 'N/A',
            from: delivery.warehouseId?.name || delivery.warehouseId || 'N/A',
            to: 'vendor',
            quantity: line.quantity,
            status: delivery.status,
            type: 'Delivery',
            isIn: false, // OUT move - red
          });
        });
      });

      // Process transfers
      transfers.forEach((transfer) => {
        transfer.lines?.forEach((line) => {
          moves.push({
            _id: `${transfer._id}-${line._id}`,
            reference: transfer.transferNumber,
            date: transfer.createdAt,
            contact: 'Internal',
            from: transfer.fromWarehouseId?.name || transfer.fromWarehouseId || 'N/A',
            to: transfer.toWarehouseId?.name || transfer.toWarehouseId || 'N/A',
            quantity: line.quantity,
            status: transfer.status,
            type: 'Transfer',
            isIn: null, // Neutral
          });
        });
      });

      // Apply filters
      let filtered = moves;
      if (filters.startDate) {
        filtered = filtered.filter((m) => new Date(m.date) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        filtered = filtered.filter((m) => new Date(m.date) <= new Date(filters.endDate));
      }
      if (filters.documentType) {
        filtered = filtered.filter((m) => m.type === filters.documentType);
      }

      setEntries(filtered);
    } catch (error) {
      toast.error('Failed to load move history');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'contact',
      label: 'Contact',
      sortable: true,
    },
    {
      key: 'from',
      label: 'From',
      sortable: true,
    },
    {
      key: 'to',
      label: 'To',
      sortable: true,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          value === 'Validated' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          value === 'Ready' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  const kanbanColumns = [
    { key: 'Draft', label: 'Draft' },
    { key: 'Ready', label: 'Ready' },
    { key: 'Validated', label: 'Done' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Move History</h1>
          <p className="text-gray-600 dark:text-gray-400">All moves between from-to locations</p>
        </div>
        <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-brand-primary text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
        </div>
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
              { value: 'Delivery', label: 'Delivery Order' },
              { value: 'Transfer', label: 'Transfer' },
            ]}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="End Date"
          />
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No moves found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr
                      key={entry._id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        entry.isIn === true ? 'bg-green-50 dark:bg-green-900/20' :
                        entry.isIn === false ? 'bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {col.render ? col.render(entry[col.key], entry) : entry[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <KanbanBoard
          items={entries}
          columns={kanbanColumns}
          renderItem={(item) => (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.reference}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.from} → {item.to}
              </p>
              <p className={`text-xs mt-1 ${item.isIn === true ? 'text-green-600' : item.isIn === false ? 'text-red-600' : 'text-gray-400'}`}>
                {item.isIn === true ? 'IN' : item.isIn === false ? 'OUT' : 'TRANSFER'}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
};

export default MoveHistory;
