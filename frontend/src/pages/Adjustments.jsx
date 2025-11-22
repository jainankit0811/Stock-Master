import { useState, useEffect } from 'react';
import { getAdjustments, createAdjustment, validateAdjustment, deleteAdjustment } from '../api/adjustments';
import { getWarehouses } from '../api/warehouses';
import { getProducts } from '../api/products';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import SelectInput from '../components/form/SelectInput';
import NumberInput from '../components/form/NumberInput';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Adjustments = () => {
  const { isManager } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    warehouseId: '',
    lines: [{ productId: '', quantity: 0, reason: '' }],
    notes: '',
  });

  useEffect(() => {
    fetchAdjustments();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchAdjustments = async () => {
    try {
      const response = await getAdjustments();
      if (response.success) {
        setAdjustments(response.data.adjustments || []);
      }
    } catch (error) {
      toast.error('Failed to load adjustments');
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
      warehouseId: '',
      lines: [{ productId: '', quantity: 0, reason: '' }],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleValidate = async (adjustment) => {
    if (!isManager) {
      toast.error('Only managers can validate adjustments');
      return;
    }
    try {
      await validateAdjustment(adjustment._id);
      toast.success('Adjustment validated successfully');
      fetchAdjustments();
    } catch (error) {
      toast.error('Failed to validate adjustment');
    }
  };

  const handleDelete = async (adjustment) => {
    if (adjustment.status === 'Validated') {
      toast.error('Cannot delete validated adjustment');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this adjustment?')) return;
    try {
      await deleteAdjustment(adjustment._id);
      toast.success('Adjustment deleted successfully');
      fetchAdjustments();
    } catch (error) {
      toast.error('Failed to delete adjustment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdjustment(formData);
      toast.success('Adjustment created successfully');
      setIsModalOpen(false);
      fetchAdjustments();
    } catch (error) {
      toast.error('Failed to create adjustment');
    }
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', quantity: 0, reason: '' }],
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
    { key: 'adjustmentNumber', label: 'Adjustment #', sortable: true },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (value, row) => (row.warehouseId?.name || 'N/A'),
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Adjustments</h1>
          <p className="text-gray-600 dark:text-gray-400">Fix stock discrepancies</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
        >
          + New Adjustment
        </button>
      </div>

      <DataTable
        data={adjustments}
        columns={columns}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Adjustment" size="lg">
        <form onSubmit={handleSubmit}>
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
                  step={0.01}
                  placeholder="Adjustment qty"
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={line.reason}
                  onChange={(e) => updateLine(index, 'reason', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
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

export default Adjustments;


