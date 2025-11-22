import { useState, useEffect } from 'react';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../api/locations';
import { getWarehouses } from '../api/warehouses';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import TextInput from '../components/form/TextInput';
import SelectInput from '../components/form/SelectInput';
import toast from 'react-hot-toast';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', warehouseId: '' });

  useEffect(() => {
    fetchLocations();
    fetchWarehouses();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await getLocations();
      if (response.success) {
        setLocations(response.data.warehouses || []);
      }
    } catch (error) {
      toast.error('Failed to load locations');
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

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({ name: '', code: '', warehouseId: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      code: location.code || '',
      warehouseId: location.warehouseId || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (location) => {
    if (!window.confirm(`Are you sure you want to delete ${location.name}?`)) return;

    try {
      await deleteLocation(location._id);
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await updateLocation(editingLocation._id, formData);
        toast.success('Location updated successfully');
      } else {
        await createLocation(formData);
        toast.success('Location created successfully');
      }
      setIsModalOpen(false);
      fetchLocations();
    } catch (error) {
      toast.error('Failed to save location');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Short Code', sortable: true },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (value, row) => {
        if (typeof value === 'object' && value?.name) {
          return value.name;
        }
        const warehouse = warehouses.find((w) => w._id === value);
        return warehouse?.name || 'N/A';
      },
    },
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Location</h1>
        <p className="text-gray-600 dark:text-gray-400">
          This holds the multiple locations of warehouse, rooms etc..
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
        >
          + New Location
        </button>
      </div>

      <DataTable
        data={locations}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? 'Edit Location' : 'Create Location'}
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter location name"
          />
          <TextInput
            label="Short Code"
            name="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            placeholder="Enter short code"
          />
          <SelectInput
            label="Warehouse"
            name="warehouseId"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            placeholder="Select warehouse"
            required
          />
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
            >
              {editingLocation ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Locations;
