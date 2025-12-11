import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());

// Use express.json() with explicit options for better compatibility
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

// Route 1: GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Route 2: GET /api/users - Get all users (mock data)
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 }
  ];
  
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// Route 3: POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;
  
  // Basic validation
  if (!name || !email || !age) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and age'
    });
  }
  
  // Create new user (mock)
  const newUser = {
    id: Math.floor(Math.random() * 1000) + 4, // Generate random ID
    name,
    email,
    age
  };
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler - use regex pattern instead of '*'
app.use(/.*/, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server only if not in test environment
let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📋 Available routes:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/users`);
    console.log(`   POST /api/users`);
  });
}

export default app;
export { server };