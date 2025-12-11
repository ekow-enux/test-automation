// Jest setup file
import app, { server } from '../server.js';

// Close server after all tests
afterAll((done) => {
  if (server && server.close) {
    server.close(done);
  } else {
    done();
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});