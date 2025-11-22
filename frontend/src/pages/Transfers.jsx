import { useState, useEffect } from 'react';
import { getTransfers, createTransfer, validateTransfer, deleteTransfer } from '../api/transfers';
import { getWarehouses } from '../api/warehouses';
import { getProducts } from '../api/products';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import SelectInput from '../components/form/SelectInput';
import NumberInput from '../components/form/NumberInput';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Transfers = () => {
  const { isManager } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    lines: [{ productId: '', quantity: 0 }],
    notes: '',
  });

  useEffect(() => {
    fetchTransfers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchTransfers = async () => {
    try {
      const response = await getTransfers();
      if (response.success) {
        setTransfers(response.data.transfers || []);
      }
    } catch (error) {
      toast.error('Failed to load transfers');
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
    setFormData({
      fromWarehouseId: '',
      toWarehouseId: '',
      lines: [{ productId: '', quantity: 0 }],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleValidate = async (transfer) => {
    if (!isManager) {
      toast.error('Only managers can validate transfers');
      return;
    }
    try {
      await validateTransfer(transfer._id);
      toast.success('Transfer validated successfully');
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to validate transfer');
    }
  };

  const handleDelete = async (transfer) => {
    if (transfer.status === 'Validated') {
      toast.error('Cannot delete validated transfer');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this transfer?')) return;
    try {
      await deleteTransfer(transfer._id);
      toast.success('Transfer deleted successfully');
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to delete transfer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.error('From and To warehouses must be different');
      return;
    }
    try {
      await createTransfer(formData);
      toast.success('Transfer created successfully');
      setIsModalOpen(false);
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to create transfer');
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

  const columns = [
    { key: 'transferNumber', label: 'Transfer #', sortable: true },
    {
      key: 'fromWarehouseId',
      label: 'From',
      render: (value, row) => (row.fromWarehouseId?.name || 'N/A'),
    },
    {
      key: 'toWarehouseId',
      label: 'To',
      render: (value, row) => (row.toWarehouseId?.name || 'N/A'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    { key: 'lines', label: 'Items', render: (value) => value?.length || 0 },
    { key: 'createdAt', label: 'Created', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Internal Transfers</h1>
          <p className="text-gray-600 dark:text-gray-400">Move stock between warehouses</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
        >
          + New Transfer
        </button>
      </div>

      <DataTable
        data={transfers}
        columns={columns}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Transfer" size="lg">
        <form onSubmit={handleSubmit}>
          <SelectInput
            label="From Warehouse"
            name="fromWarehouseId"
            value={formData.fromWarehouseId}
            onChange={(e) => setFormData({ ...formData, fromWarehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            required
          />
          <SelectInput
            label="To Warehouse"
            name="toWarehouseId"
            value={formData.toWarehouseId}
            onChange={(e) => setFormData({ ...formData, toWarehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            required
          />
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
              <button type="button" onClick={addLine} className="text-sm text-brand-primary">
                + Add Item
              </button>
            </div>
            {formData.lines.map((line, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <SelectInput
                  name={`product-${index}`}
                  value={line.productId}
                  onChange={(e) => updateLine(index, 'productId', e.target.value)}
                  options={products.map((p) => ({ value: p._id, label: `${p.name} (${p.sku})` }))}
                  placeholder="Select product"
                />
                <NumberInput
                  name={`quantity-${index}`}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                  min={0.01}
                  step={0.01}
                />
                <button type="button" onClick={() => removeLine(index)} className="text-red-600">
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
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-lg">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transfers;

