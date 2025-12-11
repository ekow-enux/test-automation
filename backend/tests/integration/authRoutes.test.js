const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, generateAuthToken, testUserData } = require('../utils/testUtils');

describe('Auth Routes Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.user.email).toBe('newuser@example.com');
    });

    test('should return error for duplicate email', async () => {
      // First create a user
      await createTestUser();

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com', // Same email
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User already exists');
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          // Missing email and password
        })
        .expect(500); // Will be handled by error middleware

      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(500); // Mongoose validation error

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(testUserData.email);
      
      // Check that cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=');
    });

    test('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return error for invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserData.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserData.email,
          // Missing password
        })
        .expect(500); // Will be handled by error middleware

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateAuthToken(testUser);
    });

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User logged out successfully');
      
      // Check that cookie is cleared
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('token=;');
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      testUser = await createTestUser();
      authToken = generateAuthToken(testUser);
    });

    test('should return current user successfully', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(testUserData.email);
      expect(response.body.data.user.name).toBe(testUserData.name);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    test('should work with token in cookie', async () => {
      // First login to get cookie
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password,
        });

      const cookie = loginResponse.headers['set-cookie'][0];

      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', cookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUserData.email);
    });
  });

  describe('General route tests', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/auth/register')
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/auth/register')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});