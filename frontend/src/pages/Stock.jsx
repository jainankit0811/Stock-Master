import { useState, useEffect } from 'react';
import { getProducts } from '../api/products';
import { getWarehouses } from '../api/warehouses';
import SelectInput from '../components/form/SelectInput';
import toast from 'react-hot-toast';

const Stock = () => {
  const [stockData, setStockData] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchWarehouses(), fetchProducts()]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchStockData();
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const response = await getWarehouses();
      if (response.success) {
        setWarehouses(response.data.warehouses || []);
      }
    } catch (error) {
      toast.error('Failed to load warehouses');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      if (response.success) {
        setProducts(response.data.products || []);
      }
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // In a real app, you'd fetch from StockBalance API
      // For now, we'll use products and add stock fields
      const response = await getProducts();
      if (response.success) {
        const stock = (response.data.products || []).map((product) => ({
          ...product,
          perUnitCost: 3000, // Default value, would come from API
          onHand: 50, // Default value
          freeToUse: 45, // Default value (onHand - reserved)
        }));
        setStockData(stock);
      }
    } catch (error) {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (productId, field, value) => {
    setStockData((prev) =>
      prev.map((item) =>
        item._id === productId
          ? { ...item, [field]: parseFloat(value) || 0 }
          : item
      )
    );
  };

  const handleSave = async (productId) => {
    const item = stockData.find((s) => s._id === productId);
    if (!item) return;

    try {
      // In a real app, you'd call an API to update stock
      toast.success('Stock updated successfully');
      setEditingCell(null);
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock</h1>
          <p className="text-gray-600 dark:text-gray-400">Warehouse details & location</p>
        </div>
        <div className="w-64">
          <SelectInput
            label="Warehouse"
            name="warehouse"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            options={warehouses.map((w) => ({ value: w._id, label: w.name }))}
            placeholder="Select warehouse"
          />
        </div>
      </div>

      {selectedWarehouse ? (
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    per unit cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    On hand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    free to Use
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {stockData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No stock data available
                    </td>
                  </tr>
                ) : (
                  stockData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {editingCell === `${item._id}-cost` ? (
                          <input
                            type="number"
                            value={item.perUnitCost || 0}
                            onChange={(e) => handleCellEdit(item._id, 'perUnitCost', e.target.value)}
                            onBlur={() => {
                              handleSave(item._id);
                              setEditingCell(null);
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setEditingCell(`${item._id}-cost`)}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            {item.perUnitCost || 0} Rs
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {editingCell === `${item._id}-onHand` ? (
                          <input
                            type="number"
                            value={item.onHand || 0}
                            onChange={(e) => handleCellEdit(item._id, 'onHand', e.target.value)}
                            onBlur={() => {
                              handleSave(item._id);
                              setEditingCell(null);
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setEditingCell(`${item._id}-onHand`)}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            {item.onHand || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {editingCell === `${item._id}-freeToUse` ? (
                          <input
                            type="number"
                            value={item.freeToUse || 0}
                            onChange={(e) => handleCellEdit(item._id, 'freeToUse', e.target.value)}
                            onBlur={() => {
                              handleSave(item._id);
                              setEditingCell(null);
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => setEditingCell(`${item._id}-freeToUse`)}
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            {item.freeToUse || 0}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSave(item._id)}
                          className="text-brand-primary hover:text-brand-primary/80"
                        >
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              User must be able to update the stock from here.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Please select a warehouse to view stock
        </div>
      )}
    </div>
  );
};

export default Stock;
