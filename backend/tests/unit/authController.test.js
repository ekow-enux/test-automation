const {
  createTestUser,
  mockRequest,
  mockResponse,
  mockNext,
  expectSuccessResponse,
  expectErrorResponse,
} = require('../utils/testUtils');

const authController = require('../../src/controllers/authController');

describe('Auth Controller', () => {
  describe('register', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should register a new user successfully', async () => {
      const req = mockRequest();
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.user).toHaveProperty('name', 'Test User');
      expect(responseData.data.user).toHaveProperty('email', 'test@example.com');
      expect(responseData.data.user).not.toHaveProperty('password');
      expect(responseData.data).toHaveProperty('token');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error if user already exists', async () => {
      // First create a user
      await createTestUser();

      const req = mockRequest();
      req.body = {
        name: 'Test User',
        email: 'test@example.com', // Same email
        password: 'password123',
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expectErrorResponse(res, 400, 'User already exists');
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing required fields', async () => {
      const req = mockRequest();
      req.body = {
        name: 'Test User',
        // Missing email and password
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      const req = mockRequest();
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock mongoose save to throw an error
      const originalSave = require('mongoose').Model.prototype.save;
      require('mongoose').Model.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

      const res = mockResponse();
      const next = mockNext;

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      
      // Restore original save method
      require('mongoose').Model.prototype.save = originalSave;
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      // Create a test user for login tests
      await createTestUser();
    });

    test('should login successfully with valid credentials', async () => {
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data']);
      expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.user).toHaveProperty('email', 'test@example.com');
      expect(responseData.data).toHaveProperty('token');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error for non-existent user', async () => {
      const req = mockRequest();
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expectErrorResponse(res, 401, 'Invalid credentials');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error for invalid password', async () => {
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expectErrorResponse(res, 401, 'Invalid credentials');
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing email or password', async () => {
      const req = mockRequest();
      req.body = {
        email: 'test@example.com',
        // Missing password
      };

      const res = mockResponse();
      const next = mockNext;

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should clear cookie and return success', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      await authController.logout(req, res, next);

      expect(res.clearCookie).toHaveBeenCalledWith('token');
      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    test('should return current user successfully', async () => {
      const user = await createTestUser();
      const req = mockRequest(user);
      const res = mockResponse();
      const next = mockNext;

      await authController.getMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.user).toHaveProperty('name', 'Test User');
      expect(responseData.data.user).toHaveProperty('email', 'test@example.com');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error when user not found', async () => {
      const req = mockRequest(); // No user in request
      const res = mockResponse();
      const next = mockNext;

      await authController.getMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expectErrorResponse(res, 401, 'User not found');
      expect(next).not.toHaveBeenCalled();
    });
  });
});