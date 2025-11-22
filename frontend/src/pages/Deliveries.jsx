import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDeliveryOrders, createDeliveryOrder, validateDeliveryOrder, deleteDeliveryOrder } from '../api/deliveries';
import { getWarehouses } from '../api/warehouses';
import { getProducts } from '../api/products';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import KanbanBoard from '../components/KanbanBoard';
import StatusBadge from '../components/StatusBadge';
import SelectInput from '../components/form/SelectInput';
import NumberInput from '../components/form/NumberInput';
import TextInput from '../components/form/TextInput';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Deliveries = () => {
  const { isManager, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [formData, setFormData] = useState({
    warehouseId: '',
    deliveryAddress: '',
    responsible: user?.name || '',
    scheduleDate: '',
    operationType: '',
    lines: [{ productId: '', quantity: 0 }],
    notes: '',
  });

  useEffect(() => {
    fetchDeliveries();
    fetchWarehouses();
    fetchProducts();
    if (searchParams.get('action') === 'create') {
      handleCreate();
    }
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await getDeliveryOrders();
      if (response.success) {
        setDeliveries(response.data.deliveryOrders || []);
      }
    } catch (error) {
      toast.error('Failed to load delivery orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    const response = await getWarehouses();
    if (response.success) {
      setWarehouses(response.data.warehouses || []);
    }
  };

  const fetchProducts = async () => {
    const response = await getProducts();
    if (response.success) {
      setProducts(response.data.products || []);
    }
  };

  const handleCreate = () => {
    setEditingDelivery(null);
    setFormData({
      warehouseId: '',
      deliveryAddress: '',
      responsible: user?.name || '',
      scheduleDate: '',
      operationType: '',
      lines: [{ productId: '', quantity: 0 }],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (delivery) => {
    if (delivery.status === 'Validated') {
      toast.error('Cannot edit validated delivery order');
      return;
    }
    setEditingDelivery(delivery);
    setFormData({
      warehouseId: delivery.warehouseId?._id || delivery.warehouseId || '',
      deliveryAddress: delivery.deliveryAddress || '',
      responsible: delivery.responsible || user?.name || '',
      scheduleDate: delivery.scheduleDate || '',
      operationType: delivery.operationType || '',
      lines: delivery.lines || [{ productId: '', quantity: 0 }],
      notes: delivery.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleValidate = async (delivery) => {
    if (!isManager) {
      toast.error('Only managers can validate delivery orders');
      return;
    }
    if (delivery.status !== 'Draft') {
      toast.error('Only Draft delivery orders can be validated');
      return;
    }
    try {
      await validateDeliveryOrder(delivery._id);
      toast.success('Delivery order validated successfully');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to validate delivery order');
    }
  };

  const handleDelete = async (delivery) => {
    if (delivery.status === 'Validated') {
      toast.error('Cannot delete validated delivery order');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this delivery order?')) return;
    try {
      await deleteDeliveryOrder(delivery._id);
      toast.success('Delivery order deleted successfully');
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to delete delivery order');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDelivery) {
        // Update logic would go here
        toast.success('Delivery order updated successfully');
      } else {
        await createDeliveryOrder(formData);
        toast.success('Delivery order created successfully');
      }
      setIsModalOpen(false);
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to save delivery order');
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', quantity: 0 }],
    });
  };

  const updateLine = (index, field, value) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const removeLine = (index) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      delivery.orderNumber?.toLowerCase().includes(searchLower) ||
      delivery.warehouseId?.name?.toLowerCase().includes(searchLower) ||
      delivery.deliveryAddress?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { key: 'orderNumber', label: 'Reference', sortable: true },
    {
      key: 'warehouseId',
      label: 'From',
      render: (value, row) => row.warehouseId?.name || row.warehouseId || 'N/A',
    },
    {
      key: 'deliveryAddress',
      label: 'To',
      render: (value) => value || 'vendor',
    },
    {
      key: 'deliveryAddress',
      label: 'Contact',
      render: (value) => value || 'N/A',
    },
    {
      key: 'scheduleDate',
      label: 'Schedule date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  const kanbanColumns = [
    { key: 'Draft', label: 'Draft' },
    { key: 'Waiting', label: 'Waiting' },
    { key: 'Ready', label: 'Ready' },
    { key: 'Validated', label: 'Done' },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
          >
            NEW
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by reference or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
      </div>

      {viewMode === 'list' ? (
        <DataTable
          data={filteredDeliveries}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      ) : (
        <KanbanBoard
          items={filteredDeliveries}
          columns={kanbanColumns}
          onItemClick={handleEdit}
          renderItem={(item) => (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.orderNumber}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.warehouseId?.name || 'N/A'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {item.deliveryAddress || 'N/A'}
              </p>
            </div>
          )}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDelivery ? 'Edit Delivery' : 'New Delivery'} size="lg">
        <form onSubmit={handleSubmit}>
          {editingDelivery && (
            <div className="mb-4 flex items-center justify-end space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Draft</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Waiting</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Ready</span>
              <span className="text-gray-400">→</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Done</span>
            </div>
          )}

          <div className="mb-4">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {editingDelivery?.orderNumber || 'WH/OUT/0001'}
            </p>
          </div>

          <TextInput
            label="Delivery Address"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
            placeholder="Enter delivery address"
          />

          <TextInput
            label="Responsible"
            name="responsible"
            value={formData.responsible}
            onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
            placeholder="Auto-filled with current user"
          />

          <TextInput
            label="Schedule Date"
            name="scheduleDate"
            type="date"
            value={formData.scheduleDate}
            onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
          />

          <SelectInput
            label="Operation type"
            name="operationType"
            value={formData.operationType}
            onChange={(e) => setFormData({ ...formData, operationType: e.target.value })}
            options={[
              { value: 'OUT', label: 'OUT' },
              { value: 'TRANSFER', label: 'TRANSFER' },
            ]}
            placeholder="Select operation type"
          />

          <SelectInput
            label="Warehouse"
            name="warehouseId"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            required
          />

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
              <button type="button" onClick={addLine} className="text-sm text-brand-primary">
                + Add New product
              </button>
            </div>
            {formData.lines.map((line, index) => (
              <div key={index} className="flex gap-2 mb-2 items-end">
                <div className="flex-1">
                  <SelectInput
                    name={`product-${index}`}
                    value={line.productId}
                    onChange={(e) => updateLine(index, 'productId', e.target.value)}
                    options={products.map((p) => ({ value: p._id, label: `[${p.sku}] ${p.name}` }))}
                    placeholder="Select product"
                  />
                </div>
                <div className="w-32">
                  <NumberInput
                    name={`quantity-${index}`}
                    label="Quantity"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                    min={0.01}
                    step={0.01}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            {editingDelivery && editingDelivery.status === 'Draft' && isManager && (
              <button
                type="button"
                onClick={() => handleValidate(editingDelivery)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Validate
              </button>
            )}
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-lg">
              {editingDelivery ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Deliveries;
