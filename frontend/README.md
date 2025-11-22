# Smart Modular Inventory OS - Frontend

A modern, responsive inventory management system built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and set your API URL
# VITE_API_URL=http://localhost:5000
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── api/                 # API service layer
│   ├── axiosInstance.js
│   ├── auth.js
│   ├── products.js
│   ├── warehouses.js
│   └── ...
├── components/         # Reusable components
│   ├── Layout.jsx
│   ├── Sidebar.jsx
│   ├── Header.jsx
│   ├── DataTable.jsx
│   ├── Modal.jsx
│   └── form/
├── context/            # React Context
│   └── AuthContext.jsx
├── hooks/              # Custom hooks
│   └── useAuth.js
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   └── ...
├── App.jsx             # Main app component with routing
└── main.jsx           # Entry point
```

## 🎨 Features

### Authentication
- JWT-based authentication
- Protected routes
- Role-based access control (Manager/Staff)
- Auto token refresh

### Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/` | Dashboard | KPIs and quick actions |
| `/stock` | Stock Overview | View stock levels by warehouse |
| `/products` | Products | CRUD for products |
| `/warehouses` | Warehouses | Manage warehouse locations |
| `/locations` | Locations | Manage storage locations |
| `/receipts` | Receipts | Incoming goods (Draft → Validated) |
| `/deliveries` | Delivery Orders | Outgoing goods |
| `/transfers` | Internal Transfers | Move stock between warehouses |
| `/adjustments` | Stock Adjustments | Fix stock discrepancies |
| `/move-history` | Move History | Track all movements |
| `/ledger` | Ledger | Immutable movement logs |
| `/settings` | Settings | User preferences & theme |

### Components

- **DataTable**: Sortable, searchable, paginated tables
- **Modal**: Reusable modal dialogs
- **KPICard**: Dashboard metric cards
- **StatusBadge**: Status indicators
- **Form Inputs**: TextInput, NumberInput, SelectInput

### UI Features

- 🌙 Dark mode support
- 📱 Fully responsive design
- 🔍 Search and filtering
- 📊 Dashboard with KPIs
- 🎨 Modern industrial design
- ⚡ Fast and optimized

## 🔐 Authentication Flow

1. User logs in via `/login`
2. JWT token stored in localStorage
3. Axios interceptor adds token to all requests
4. Protected routes check authentication
5. Auto-redirect to login if token invalid

## 🎯 Role-Based Access

- **Manager**: Full access, can validate documents
- **Staff**: Limited access, cannot validate

## 📦 API Integration

All API calls are centralized in the `api/` directory:

```javascript
import { getProducts, createProduct } from './api/products';

// Get all products
const products = await getProducts();

// Create product
await createProduct({ name: 'Product', sku: 'SKU001' });
```

## 🛠️ Technologies

- **React 19** - UI library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 📝 Environment Variables

```env
VITE_API_URL=http://localhost:5000
```

## 🎨 Tailwind Configuration

The project uses a custom Tailwind config with:
- Brand colors (Primary: #2563EB)
- Custom border radius (card: 1.25rem)
- Dark mode support

## 🚦 Development Workflow

1. Start backend server (port 5000)
2. Start frontend dev server (`npm run dev`)
3. Open browser to `http://localhost:5173`
4. Login with test credentials

## 📄 License

MIT
