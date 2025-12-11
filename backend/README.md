# Backend Setup Instructions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

> **Note**: If you encounter any npm version issues, ensure you're using Node.js 16+ and npm 8+.

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# - Set MONGO_URI to your MongoDB connection string
# - Set JWT_SECRET to a secure random string
# - Set COOKIE_SECRET to another secure random string
# - Update CLIENT_URL if needed
```

### 3. Development Mode
```bash
# Run with auto-reload (using nodemon)
npm run dev
```

### 4. Production Mode
```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

## 📁 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # Database connection
│   │   └── cookieOptions.ts   # Cookie configuration
│   ├── controllers/
│   │   ├── authController.ts  # Authentication logic
│   │   └── projectController.ts # Project CRUD logic
│   ├── middleware/
│   │   ├── authMiddleware.ts  # JWT authentication
│   │   └── errorMiddleware.ts # Global error handling
│   ├── models/
│   │   ├── User.ts           # User model
│   │   └── Project.ts        # Project model
│   ├── routes/
│   │   ├── authRoutes.ts     # Authentication routes
│   │   └── projectRoutes.ts  # Project CRUD routes
│   ├── types/
│   │   └── express/
│   │       └── index.d.ts    # TypeScript type extensions
│   ├── utils/
│   │   └── generateToken.ts  # JWT utilities
│   ├── app.ts                # Express app configuration
│   └── server.ts             # Server bootstrap
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔐 API Endpoints

### Authentication Routes
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Project Routes (Protected)
- `POST /projects` - Create new project
- `GET /projects` - Get all projects
- `GET /projects/:id` - Get single project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

## 🛡️ Security Features

- **HttpOnly Cookies**: JWT tokens stored securely in HttpOnly cookies
- **Secure Cookies**: Cookies are secure in production
- **CORS Protection**: Configured for specific frontend domain
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: MongoDB schema validation
- **Error Handling**: Global error handler with proper HTTP status codes

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | `mongodb://localhost:27017/myapp` |
| JWT_SECRET | JWT signing secret | `your-super-secret-jwt-key` |
| COOKIE_SECRET | Cookie signing secret | `your-cookie-secret` |
| CLIENT_URL | Frontend URL | `https://ui.ekowlabs.space` |
| NODE_ENV | Environment | `production` or `development` |
| PORT | Server port | `4000` |

## 🧪 Testing the API

### Register a User
```bash
curl -X POST https://serve.ekowlabs.space/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST https://serve.ekowlabs.space/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Project (requires authentication)
```bash
curl -X POST https://serve.ekowlabs.space/projects \
  -H "Content-Type: application/json" \
  -b "token=your-jwt-token" \
  -d '{
    "title": "My Project",
    "description": "Project description"
  }'
```

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Production mode (sets NODE_ENV=production)
npm run start:prod
```

## 📝 Notes

- The backend uses TypeScript with strict mode enabled
- All routes return JSON responses with consistent structure
- Authentication is required for all project operations
- Cookies are configured to work across subdomains (`.ekowlabs.space`)
- The server includes health check endpoint at `/health`
- Error responses include proper HTTP status codes and messages

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check your MONGO_URI in .env
   - Ensure MongoDB is running
   - Verify network connectivity

2. **TypeScript Errors**
   - Run `npm install` to install all dependencies
   - Check tsconfig.json settings

3. **Package Version Issues**
   - Ensure Node.js 16+ and npm 8+
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

4. **Cookie Issues**
   - Ensure CLIENT_URL matches your frontend domain
   - Check cookie settings in production

5. **CORS Errors**
   - Verify CLIENT_URL is correct
   - Ensure frontend is making requests with credentials

## 🎯 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT_SECRET and COOKIE_SECRET
3. Use MongoDB Atlas or production MongoDB instance
4. Configure proper SSL certificates
5. Set up proper logging and monitoring
6. Use environment variables for all configuration