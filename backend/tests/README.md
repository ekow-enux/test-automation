# Backend Test Suite

This directory contains comprehensive test suites for the backend API using Jest (unit and integration tests) and Cypress (end-to-end tests).

## Test Structure

```
tests/
├── setup.js                 # Jest test setup with in-memory MongoDB
├── README.md               # This file
├── utils/
│   └── testUtils.js        # Test utilities and mock data
├── unit/                   # Unit tests
│   ├── authController.test.js
│   ├── projectController.test.js
│   └── authMiddleware.test.js
└── integration/            # Integration tests
    ├── authRoutes.test.js
    └── projectRoutes.test.js

cypress/
├── config/
│   └── cypress.config.js   # Cypress configuration
├── e2e/                    # End-to-end tests
│   ├── auth.cy.js
│   └── projects.cy.js
└── support/                # Cypress support files
    ├── commands.js         # Custom Cypress commands
    └── e2e.js             # Cypress setup
```

## Prerequisites

Before running tests, ensure you have all dependencies installed:

```bash
npm install
```

## Running Tests

### Jest Tests

#### Run all tests
```bash
npm test
```

#### Run tests in watch mode (auto-rerun on changes)
```bash
npm run test:watch
```

#### Run tests with coverage report
```bash
npm run test:coverage
```

#### Run only unit tests
```bash
npm run test:unit
```

#### Run only integration tests
```bash
npm run test:integration
```

### Cypress Tests

#### Open Cypress Test Runner (GUI)
```bash
npm run cypress:open
```

#### Run Cypress tests headlessly
```bash
npm run cypress:run
```

## Test Coverage

### Unit Tests (`tests/unit/`)

#### Auth Controller Tests (`authController.test.js`)
- User registration with validation
- User login with credential verification
- User logout functionality
- Get current user information
- Error handling for invalid inputs
- Database error handling

#### Project Controller Tests (`projectController.test.js`)
- Create new project
- Get all projects for user
- Get single project by ID
- Update project (full and partial updates)
- Delete project
- Authorization and ownership validation

#### Auth Middleware Tests (`authMiddleware.test.js`)
- Valid token verification
- Token extraction from headers and cookies
- Invalid token handling
- Expired token handling
- Missing token handling
- Token format validation

### Integration Tests (`tests/integration/`)

#### Auth Routes Integration Tests (`authRoutes.test.js`)
- Complete user registration flow
- User login with cookie setting
- Protected route access control
- Logout with cookie clearing
- Current user retrieval
- Error responses for invalid requests

#### Project Routes Integration Tests (`projectRoutes.test.js`)
- Full CRUD operations for projects
- Project ownership enforcement
- Data validation on API level
- Sorting and pagination behavior
- Error handling for malformed requests

### Cypress E2E Tests (`cypress/e2e/`)

#### Authentication E2E Tests (`auth.cy.js`)
- Complete user registration workflow
- Login process with session management
- Protected route access
- Logout functionality
- Token validation across requests

#### Projects E2E Tests (`projects.cy.js`)
- End-to-end project management workflow
- Project CRUD operations through API
- Authentication flow integration
- Real-world user scenarios

## Test Utilities

### Mock Data (`tests/utils/testUtils.js`)

The test utilities provide:
- `testUserData` - Standard test user credentials
- `testProjectData` - Standard test project data
- `createTestUser()` - Creates a test user in the database
- `createTestProject()` - Creates a test project
- `generateAuthToken()` - Generates JWT tokens for testing
- Response assertion helpers

### Custom Cypress Commands (`cypress/support/commands.js`)

Custom commands for API testing:
- `cy.registerUser()` - Register a new user
- `cy.loginUser()` - Login a user
- `cy.getAuthToken()` - Get authentication token
- `cy.createProject()` - Create a project
- `cy.getProjects()` - Get all projects
- `cy.getProject()` - Get single project
- `cy.updateProject()` - Update a project
- `cy.deleteProject()` - Delete a project
- `cy.setupTestData()` - Setup complete test environment

## Environment Configuration

### Test Environment Variables

Create a `.env.test` file for test-specific environment variables:

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing
CLIENT_URL=http://localhost:3000
```

### MongoDB Configuration

The test suite supports both **MongoDB Atlas** and **in-memory MongoDB**:

#### Option 1: MongoDB Atlas (Recommended for Production)

1. **Create a test database** in your MongoDB Atlas cluster
2. **Set up environment variable**:
   ```env
   MONGODB_TEST_URI=mongodb+srv://username:password@cluster.mongodb.net/testdb?retryWrites=true&w=majority
   ```
3. **Copy the example file**:
   ```bash
   cp .env.test.example .env.test
   ```
4. **Update with your Atlas connection string**

#### Option 2: In-Memory MongoDB (Default)

If `MONGODB_TEST_URI` is not set, tests will automatically use an in-memory MongoDB instance. This is great for:
- Local development
- CI/CD pipelines
- Quick test execution

**Benefits of MongoDB Atlas:**
- Real database environment
- Better testing accuracy
- Production-like conditions
- Persistent test data (if needed)

**Benefits of In-Memory MongoDB:**
- Faster execution
- No external dependencies
- Perfect isolation
- No data pollution

## Coverage Reports

Coverage reports are generated in the `coverage/` directory when running:
```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` in your browser to view detailed coverage information.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017
    
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - run: npm install
    
    - run: npm run test:coverage
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        MONGODB_TEST_URI: ${{ secrets.MONGODB_TEST_URI }}
    
    - run: npm run cypress:run
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        MONGODB_TEST_URI: ${{ secrets.MONGODB_TEST_URI }}
```

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain what is being tested
2. **Test both success and failure scenarios**
3. **Keep tests isolated** - each test should be independent
4. **Use test utilities** for common operations
5. **Mock external dependencies** when appropriate
6. **Clean up test data** after each test

### Test Organization

- Place unit tests in `tests/unit/`
- Place integration tests in `tests/integration/`
- Place E2E tests in `cypress/e2e/`
- Use descriptive file names that match the tested modules
- Group related tests using `describe` blocks

### Assertions

Use the custom assertion helpers:
- `expectSuccessResponse(response, expectedKeys)` - For successful API responses
- `expectErrorResponse(response, statusCode, message)` - For error responses

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in Jest config
   - Check for slow database operations
   - Ensure proper cleanup in `afterEach`

2. **Flaky tests**
   - Check for race conditions
   - Ensure proper test isolation
   - Verify async operations are properly awaited

3. **Cypress tests failing**
   - Ensure backend server is running
   - Check API base URL configuration
   - Verify test data setup

4. **Coverage reports not generating**
   - Check Jest configuration
   - Ensure source files are properly included
   - Verify no syntax errors in source code

### Debugging

#### Jest Tests
```bash
npm test -- --verbose --detectOpenHandles
```

#### Cypress Tests
```bash
npm run cypress:open
```

Use browser developer tools to debug Cypress tests.

## Contributing

When adding new features:

1. Write corresponding unit tests
2. Add integration tests for API endpoints
3. Update E2E tests if needed
4. Ensure all tests pass
5. Maintain test coverage above 80%

When fixing bugs:

1. Add a test case that reproduces the bug
2. Fix the bug
3. Verify the test passes
4. Run all tests to ensure no regressions