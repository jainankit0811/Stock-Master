const KanbanBoard = ({ items = [], columns = [], onItemClick, renderItem }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnItems = items.filter((item) => item.status === column.key);
        return (
          <div key={column.key} className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{column.label}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {columnItems.length} {columnItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {columnItems.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                  No items
                </div>
              ) : (
                columnItems.map((item) => (
                  <div
                    key={item._id || item.id}
                    onClick={() => onItemClick && onItemClick(item)}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600"
                  >
                    {renderItem ? renderItem(item) : (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.receiptNumber || item.orderNumber || item.reference}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.warehouseId?.name || item.fromWarehouseId?.name || 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;


