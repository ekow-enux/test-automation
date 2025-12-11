const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Project = require('../../src/models/Project');

// Test user data
const testUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

const testUserData2 = {
  name: 'Test User 2',
  email: 'test2@example.com',
  password: 'password123',
};

// Test project data
const testProjectData = {
  title: 'Test Project',
  description: 'This is a test project',
};

const testProjectData2 = {
  title: 'Test Project 2',
  description: 'This is another test project',
};

// Create a test user
const createTestUser = async (userData = testUserData) => {
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  
  const user = new User({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
  });
  
  return await user.save();
};

// Create a test project
const createTestProject = async (userId, projectData = testProjectData) => {
  const project = new Project({
    title: projectData.title,
    description: projectData.description,
    createdBy: userId,
  });
  
  return await project.save();
};

// Generate a valid JWT token for a user
const generateAuthToken = (user) => {
  const payload = {
    _id: user._id,
    email: user.email,
    name: user.name,
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '7d',
  });
};

// Create authenticated request object
const createAuthenticatedRequest = (user) => {
  return {
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    body: {},
    params: {},
    query: {},
  };
};

// Mock Express request and response
const mockRequest = (user = null) => ({
  body: {},
  params: {},
  query: {},
  user: user ? {
    _id: user._id,
    email: user.email,
    name: user.name,
  } : null,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Helper to expect response structure
const expectSuccessResponse = (res, expectedKeys = []) => {
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: true,
    })
  );
  
  expectedKeys.forEach(key => {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        [key]: expect.anything(),
      })
    );
  });
};

// Helper to expect error response
const expectErrorResponse = (res, statusCode, message = null) => {
  expect(res.status).toHaveBeenCalledWith(statusCode);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
    })
  );
  
  if (message) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(message),
      })
    );
  }
};

module.exports = {
  testUserData,
  testUserData2,
  testProjectData,
  testProjectData2,
  createTestUser,
  createTestProject,
  generateAuthToken,
  createAuthenticatedRequest,
  mockRequest,
  mockResponse,
  mockNext,
  expectSuccessResponse,
  expectErrorResponse,
};