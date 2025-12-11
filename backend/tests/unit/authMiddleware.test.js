const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../../src/middleware/authMiddleware');
const { createTestUser, generateAuthToken } = require('../utils/testUtils');

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser();
    validToken = generateAuthToken(testUser);
  });

  test('should allow request with valid token', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user._id).toBe(testUser._id.toString());
    expect(req.user.email).toBe(testUser.email);
    expect(req.user.name).toBe(testUser.name);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should allow request with valid token in cookie', async () => {
    const req = {
      headers: {},
      cookies: {
        token: validToken,
      },
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user._id).toBe(testUser._id.toString());
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should reject request with no token', async () => {
    const req = {
      headers: {},
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, no token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with invalid token format', async () => {
    const req = {
      headers: {
        authorization: 'InvalidTokenFormat',
      },
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with malformed token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer malformed.token.here',
      },
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, token failed',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should reject request with expired token', async () => {
    const expiredToken = jwt.sign(
      {
        _id: testUser._id,
        email: testUser.email,
        name: testUser.name,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Expired 1 hour ago
    );

    const req = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not authorized, token expired',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should prioritize authorization header over cookie', async () => {
    const cookieToken = generateAuthToken(testUser);
    const headerToken = generateAuthToken(testUser);
    
    // Create a user with different email to distinguish
    const otherUser = await createTestUser({
      name: 'Other User',
      email: 'other@example.com',
      password: 'password123',
    });
    const otherToken = generateAuthToken(otherUser);

    const req = {
      headers: {
        authorization: `Bearer ${otherToken}`,
      },
      cookies: {
        token: cookieToken,
      },
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    // Should use the header token (otherUser), not the cookie token (testUser)
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe('other@example.com');
    expect(req.user.email).not.toBe(testUser.email);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('should handle missing JWT_SECRET gracefully', async () => {
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
      cookies: {},
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    const next = jest.fn();

    await authMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    
    // Restore JWT_SECRET
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    } else {
      process.env.JWT_SECRET = 'test-secret';
    }
  });
});