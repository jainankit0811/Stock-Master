# Smart Modular Inventory OS - Backend

A comprehensive inventory management system backend built with Node.js, Express, MongoDB, and Mongoose. Features JWT authentication, role-based access control, and full CRUD operations for inventory management.

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login with JWT tokens
  - Password hashing using bcrypt
  - Role-based access control (Manager, Staff)
  - Protected routes with JWT middleware

- **Inventory Management**
  - **Products**: Full CRUD with SKU, category, and unit management
  - **Warehouses**: Multi-location warehouse support
  - **Stock Balance**: Real-time stock tracking per product-warehouse
  - **Receipts**: Incoming goods with Draft → Validated workflow
  - **Delivery Orders**: Outgoing goods with validation workflow
  - **Internal Transfers**: Move stock between warehouses (transaction-based)
  - **Stock Adjustments**: Fix stock mismatches
  - **Ledger**: Immutable movement history with advanced filtering

- **Dashboard KPIs**
  - Total products count
  - Low stock alerts
  - Pending receipts, deliveries, and transfers

- **Security**
  - Helmet.js for security headers
  - CORS configuration
  - Input validation with express-validator
  - MongoDB transactions for data integrity

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   MONGO_URI=mongodb://localhost:27017/inventory-os
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   # Make sure MongoDB is running on your system
   # For macOS with Homebrew:
   brew services start mongodb-community
   
   # For Linux:
   sudo systemctl start mongod
   ```

5. **Run the server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

   The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controllers/
│   ├── auth.controller.js    # Authentication logic
│   ├── product.controller.js # Product CRUD operations
│   ├── warehouse.controller.js
│   ├── receipt.controller.js
│   ├── deliveryOrder.controller.js
│   ├── transfer.controller.js
│   ├── adjustment.controller.js
│   ├── ledger.controller.js
│   └── dashboard.controller.js
├── middleware/
│   └── auth.middleware.js    # JWT verification & role checking
├── models/
│   ├── User.model.js
│   ├── Product.model.js
│   ├── Warehouse.model.js
│   ├── StockBalance.model.js
│   ├── Receipt.model.js
│   ├── DeliveryOrder.model.js
│   ├── Transfer.model.js
│   ├── Adjustment.model.js
│   └── LedgerEntry.model.js
├── routes/
│   ├── auth.routes.js
│   ├── product.routes.js
│   ├── warehouse.routes.js
│   ├── receipt.routes.js
│   ├── deliveryOrder.routes.js
│   ├── transfer.routes.js
│   ├── adjustment.routes.js
│   ├── ledger.routes.js
│   └── dashboard.routes.js
├── services/
│   └── stockService.js       # Stock operations with transactions
├── server.js                 # Express app entry point
├── package.json
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "manager"  // optional: "manager" or "staff" (default: "staff")
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Products

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "sku": "LAP-001",
  "category": "Electronics",
  "unit": "pcs"
}
```

#### Get Products (with filters)
```http
GET /api/products?sku=LAP&category=Electronics&lowStock=true&warehouseId=<id>
Authorization: Bearer <token>
```

#### Update Product
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Gaming Laptop",
  "category": "Gaming"
}
```

#### Delete Product
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

### Warehouses

#### Create Warehouse
```http
POST /api/warehouses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Main Warehouse",
  "code": "WH-001",
  "address": "123 Main St"
}
```

#### Get Warehouses
```http
GET /api/warehouses
Authorization: Bearer <token>
```

### Receipts

#### Create Receipt
```http
POST /api/receipts
Authorization: Bearer <token>
Content-Type: application/json

{
  "warehouseId": "<warehouse_id>",
  "lines": [
    {
      "productId": "<product_id>",
      "quantity": 100,
      "unitPrice": 50.00
    }
  ],
  "notes": "Received from supplier"
}
```

#### Validate Receipt (Manager only)
```http
POST /api/receipts/:id/validate
Authorization: Bearer <manager_token>
```

**Note:** Validation increases stock and creates ledger entries. Only managers can validate.

#### Get Receipts
```http
GET /api/receipts?status=Draft&warehouseId=<id>
Authorization: Bearer <token>
```

### Delivery Orders

#### Create Delivery Order
```http
POST /api/delivery-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "warehouseId": "<warehouse_id>",
  "lines": [
    {
      "productId": "<product_id>",
      "quantity": 50,
      "unitPrice": 50.00
    }
  ],
  "notes": "Delivery to customer"
}
```

#### Validate Delivery Order (Manager only)
```http
POST /api/delivery-orders/:id/validate
Authorization: Bearer <manager_token>
```

**Note:** Validation decreases stock and creates ledger entries. Only managers can validate.

### Transfers

#### Create Transfer
```http
POST /api/transfers
Authorization: Bearer <token>
Content-Type: application/json

{
  "fromWarehouseId": "<warehouse_id>",
  "toWarehouseId": "<warehouse_id>",
  "lines": [
    {
      "productId": "<product_id>",
      "quantity": 25
    }
  ],
  "notes": "Transfer between warehouses"
}
```

#### Validate Transfer (Manager only)
```http
POST /api/transfers/:id/validate
Authorization: Bearer <manager_token>
```

**Note:** Validation updates stock in both warehouses atomically using MongoDB transactions.

### Adjustments

#### Create Adjustment
```http
POST /api/adjustments
Authorization: Bearer <token>
Content-Type: application/json

{
  "warehouseId": "<warehouse_id>",
  "lines": [
    {
      "productId": "<product_id>",
      "quantity": -5,  // Can be positive or negative
      "reason": "Stock count correction"
    }
  ],
  "notes": "Physical count adjustment"
}
```

#### Validate Adjustment (Manager only)
```http
POST /api/adjustments/:id/validate
Authorization: Bearer <manager_token>
```

### Ledger

#### Get Ledger Entries
```http
GET /api/ledger?productId=<id>&warehouseId=<id>&documentType=Receipt&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `productId`: Filter by product
- `warehouseId`: Filter by warehouse
- `documentType`: Filter by document type (Receipt, DeliveryOrder, Transfer, Adjustment)
- `documentId`: Filter by specific document ID
- `userId`: Filter by user
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

### Dashboard

#### Get Dashboard KPIs
```http
GET /api/dashboard
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "lowStockCount": 12,
    "pendingReceipts": 5,
    "pendingDeliveries": 3,
    "pendingTransfers": 2
  }
}
```

## 🔐 Authentication

All API endpoints (except `/api/auth/register` and `/api/auth/login`) require authentication.

Include the JWT token in the request header:
```http
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

- **Manager**: Can validate receipts, delivery orders, transfers, and adjustments
- **Staff**: Can create and view documents, but cannot validate them

## 🔄 Workflow

### Receipt Workflow
1. Create receipt (Draft status)
2. Manager validates → Stock increases + Ledger entry created

### Delivery Order Workflow
1. Create delivery order (Draft status)
2. Manager validates → Stock decreases + Ledger entry created

### Transfer Workflow
1. Create transfer (Draft status)
2. Manager validates → Stock decreases in source warehouse, increases in destination warehouse (atomic transaction) + Ledger entries created

### Adjustment Workflow
1. Create adjustment (Draft status)
2. Manager validates → Stock adjusted (positive or negative) + Ledger entry created

## 🗄️ Database Models

### User
- `name`, `email`, `hashedPassword`, `role` (manager/staff), `timestamps`

### Product
- `name`, `sku` (unique), `category`, `unit`, `timestamps`

### Warehouse
- `name`, `code` (unique), `address`, `timestamps`

### StockBalance
- `productId`, `warehouseId`, `quantity`, `reservedQty`, `timestamps`
- Unique index on `(productId, warehouseId)`

### Receipt/DeliveryOrder/Transfer/Adjustment
- Document header with `status` (Draft/Validated)
- `lines[]` array with product and quantity
- `createdBy`, `validatedBy`, `validatedAt`

### LedgerEntry
- Immutable log of all stock movements
- `productId`, `warehouseId`, `documentType`, `documentId`
- `quantity`, `balanceBefore`, `balanceAfter`
- `userId`, `notes`, `timestamps`

## 🧪 Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "manager"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Product (with token):**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Laptop",
    "sku": "LAP-001",
    "category": "Electronics",
    "unit": "pcs"
  }'
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Helmet.js**: Security headers
- **Input Validation**: express-validator for request validation
- **MongoDB Transactions**: Atomic operations for data integrity
- **Role-Based Access**: Manager vs Staff permissions

## 📝 Notes

- All stock operations use MongoDB transactions to ensure data consistency
- Ledger entries are immutable and created automatically on validation
- Document numbers are auto-generated (REC-000001, DO-000001, etc.)
- Low stock threshold is set to 10 units (configurable in dashboard controller)
- All timestamps are automatically managed by Mongoose

## 🐛 Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## 📦 Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation
- **cors**: Cross-origin resource sharing
- **helmet**: Security headers
- **express-validator**: Input validation
- **dotenv**: Environment variables

## 🚀 Production Deployment

1. Set strong `JWT_SECRET` in production
2. Use MongoDB Atlas or secure MongoDB instance
3. Set `NODE_ENV=production`
4. Use process manager (PM2, systemd)
5. Enable HTTPS
6. Set up proper CORS origins
7. Configure rate limiting
8. Set up logging and monitoring

## 📄 License

ISC

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Node.js, Express, and MongoDB**

