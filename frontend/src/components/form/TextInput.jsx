import { useState } from 'react';

const TextInput = ({ label, name, value, onChange, error, type = 'text', placeholder, required = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-transparent ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } pr-10`}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 font-medium text-gray-600 dark:text-gray-400 hover:text-brand-primary focus:outline-none"
          >
            {showPassword ? (
              // Eye icon (Hide)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              // Eye-slash icon (Show)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 0 015.11 6.524l8.367 8.367zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18.537 11.217a10.045 10.045 0 01-1.13-1.094C15.691 6.906 12.454 4 10 4c-1.328 0-2.583.504-3.618 1.341L2.735 2.115C3.391 1.637 4.147 1.258 5 1c3.15 0 6.037 2.003 7.85 4.54a10.027 10.027 0 012.721 2.378l2.942 2.942c.16.16.29.333.395.518a1 1 0 01-.144 1.378zM4.686 17.511a1 1 0 01-.144-1.378c.105-.185.235-.358.395-.518l2.942-2.942A10.027 10.027 0 0110 16c2.454 0 5.691-2.906 7.307-6.095a10.045 10.045 0 01-1.13-1.094l-1.365-1.365a10.04 10.04 0 00-4.048-2.617 1 1 0 01-.65-.65A10.082 10.082 0 0010 3a10.045 10.045 0 01-1.13-1.094L7.545 1.458A1 1 0 006.128.932a10.057 10.057 0 00-2.317.962L.458 5.751C.185 6.307.03 6.945 0 7.63c0 1.252.343 2.457 1 3.535l1.63 1.63C3.013 14.512 3.738 16.033 4.686 17.511z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default TextInput;


