# Simple API with Testing Setup

A simple Express.js API with 3 routes, featuring comprehensive Jest unit tests and Cypress end-to-end tests.

## 🚀 Features

- **Express.js API** with 3 routes
- **Jest Unit Tests** with 8 comprehensive test cases
- **Cypress End-to-End Tests** for API validation
- **ES6 Modules** support
- **Port 4000** configuration
- **CORS** enabled for cross-origin requests

## 📋 API Routes

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns API health status and timestamp
- **Response**:
  ```json
  {
    "status": "OK",
    "message": "API is running successfully",
    "timestamp": "2025-12-11T18:17:06.973Z"
  }
  ```

### 2. Get All Users
- **Endpoint**: `GET /api/users`
- **Description**: Returns array of mock users
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "age": 30
      }
    ],
    "count": 3
  }
  ```

### 3. Create New User
- **Endpoint**: `POST /api/users`
- **Description**: Creates a new user with validation
- **Request Body**:
  ```json
  {
    "name": "Alice Brown",
    "email": "alice@example.com",
    "age": 32
  }
  ```
- **Success Response** (201):
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "id": 456,
      "name": "Alice Brown",
      "email": "alice@example.com",
      "age": 32
    }
  }
  ```
- **Error Response** (400):
  ```json
  {
    "success": false,
    "message": "Please provide name, email, and age"
  }
  ```

## 🧪 Testing

### Jest Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Cypress End-to-End Tests
```bash
# Open Cypress test runner
npm run cypress:open

# Run Cypress tests headless
npm run cypress:run
```

## 🏃‍♂️ Running the API

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:4000`

## 📁 Project Structure

```
api/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── jest.config.js         # Jest configuration
├── babel.config.js        # Babel configuration
├── cypress.config.js      # Cypress configuration
├── README.md              # This file
├── tests/
│   ├── api.test.js        # Jest unit tests
│   └── setup.js           # Test setup
└── cypress/
    ├── e2e/
    │   └── api.cy.js      # Cypress E2E tests
    └── support/
        ├── e2e.js         # Cypress support file
        └── commands.js    # Custom Cypress commands
```

## 🧪 Test Coverage

The Jest tests cover:

- ✅ Health check endpoint functionality
- ✅ GET /api/users response structure and data
- ✅ POST /api/users with valid data
- ✅ POST /api/users validation errors (missing fields)
- ✅ 404 error handling for non-existent routes
- ✅ JSON response headers
- ✅ Response status codes

## 🔧 Dependencies

### Production
- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management

### Development
- **jest**: Testing framework
- **cypress**: End-to-end testing
- **supertest**: HTTP assertion library
- **nodemon**: Development server
- **@babel/core, @babel/preset-env, babel-jest**: ES6 module support

## 🎯 Usage Examples

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Get Users
```bash
curl http://localhost:4000/api/users
```

### Create User
```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","age":25}'
```

## 🚦 Test Results

**Jest Tests**: ✅ 8/8 passed
- Health check endpoint: ✅
- GET /api/users: ✅
- POST /api/users (valid): ✅
- POST /api/users (validation): ✅
- 404 handling: ✅

**Cypress E2E Tests**: Comprehensive API validation with custom commands