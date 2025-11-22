const QuickActionButtons = ({ actions = [] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className="bg-white dark:bg-gray-800 rounded-card shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">{action.icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{action.label}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
        </button>
      ))}
    </div>
  );
};

export default QuickActionButtons;


