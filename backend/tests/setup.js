// Test setup file
const mongoose = require('mongoose');

// Determine which database to use based on environment
const getTestDatabaseUrl = () => {
  // Use MongoDB Atlas if MONGODB_TEST_URI is provided
  if (process.env.MONGODB_TEST_URI) {
    return process.env.MONGODB_TEST_URI;
  }
  
  // Fall back to in-memory MongoDB for local testing
  const { MongoMemoryServer } = require('mongodb-memory-server');
  return MongoMemoryServer.create().then(server => server.getUri());
};

// Global setup for Jest
beforeAll(async () => {
  let mongoUri;
  
  if (process.env.MONGODB_TEST_URI) {
    // Using MongoDB Atlas
    mongoUri = process.env.MONGODB_TEST_URI;
    console.log('🔗 Connecting to MongoDB Atlas for testing...');
  } else {
    // Using in-memory MongoDB
    console.log('🧠 Using in-memory MongoDB for testing...');
    const mongoServer = await getTestDatabaseUrl();
    mongoUri = mongoServer;
  }
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Connected to test database');
});

// Clean up database and close connection after all tests
afterAll(async () => {
  try {
    if (process.env.MONGODB_TEST_URI) {
      // For MongoDB Atlas, clean up test data
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      console.log('🧹 Cleaned up test data from MongoDB Atlas');
    } else {
      // For in-memory MongoDB, the database will be destroyed
      console.log('💾 In-memory database will be destroyed');
    }
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test database');
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
  }
});

// Clean up database between tests
afterEach(async () => {
  if (!process.env.MONGODB_TEST_URI) {
    // Only clean collections for in-memory database
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Global test utilities
global.mockRequest = () => ({
  body: {},
  params: {},
  query: {},
  user: null,
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

global.mockNext = jest.fn();