describe('Authentication API End-to-End Tests', () => {
  const baseUrl = Cypress.env('apiUrl') || 'http://localhost:5000';

  beforeEach(() => {
    // Clean up any existing data if needed
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      const userData = {
        name: 'New Cypress User',
        email: `cypress${Date.now()}@example.com`,
        password: 'password123',
      };

      cy.request('POST', `${baseUrl}/auth/register`, userData)
        .then((response) => {
          cy.expectSuccessResponse(response, ['data']);
          expect(response.body.data.user.email).to.equal(userData.email);
          expect(response.body.data.user.name).to.equal(userData.name);
          expect(response.body.data).to.have.property('token');
          expect(response.body.data.user).to.not.have.property('password');
        });
    });

    it('should return error for duplicate email', () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // First registration should succeed
      cy.request('POST', `${baseUrl}/auth/register`, userData).then((firstResponse) => {
        expect(firstResponse.status).to.equal(201);
        
        // Second registration with same email should fail
        cy.request({
          method: 'POST',
          url: `${baseUrl}/auth/register`,
          body: userData,
          failOnStatusCode: false,
        }).then((secondResponse) => {
          cy.expectErrorResponse(secondResponse, 400, 'User already exists');
        });
      });
    });

    it('should return error for missing required fields', () => {
      const invalidUserData = {
        name: 'Incomplete User',
        // Missing email and password
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/register`,
        body: invalidUserData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 500]); // Depends on validation handling
        expect(response.body.success).to.be.false;
      });
    });

    it('should return error for invalid email format', () => {
      const invalidUserData = {
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'password123',
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/register`,
        body: invalidUserData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 500]);
        expect(response.body.success).to.be.false;
      });
    });
  });

  describe('POST /auth/login', () => {
    let testUser;
    let authToken;

    before(() => {
      // Create a test user for login tests
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123',
      };

      cy.request('POST', `${baseUrl}/auth/register`, userData).then((response) => {
        testUser = response.body.data.user;
      });
    });

    it('should login successfully with valid credentials', () => {
      const credentials = {
        email: 'logintest@example.com',
        password: 'password123',
      };

      cy.request('POST', `${baseUrl}/auth/login`, credentials)
        .then((response) => {
          cy.expectSuccessResponse(response, ['data']);
          expect(response.body.data.user.email).to.equal(credentials.email);
          expect(response.body.data).to.have.property('token');
          expect(response.headers['set-cookie']).to.exist;
          
          authToken = response.body.data.token;
        });
    });

    it('should return error for non-existent user', () => {
      const invalidCredentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/login`,
        body: invalidCredentials,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Invalid credentials');
      });
    });

    it('should return error for invalid password', () => {
      const invalidCredentials = {
        email: 'logintest@example.com',
        password: 'wrongpassword',
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/login`,
        body: invalidCredentials,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Invalid credentials');
      });
    });

    it('should return error for missing credentials', () => {
      const incompleteCredentials = {
        email: 'logintest@example.com',
        // Missing password
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/login`,
        body: incompleteCredentials,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 500]);
        expect(response.body.success).to.be.false;
      });
    });
  });

  describe('GET /auth/me', () => {
    let authToken;

    before(() => {
      // Setup test data and get auth token
      cy.setupTestData().then((data) => {
        authToken = data.token;
      });
    });

    it('should return current user successfully', () => {
      cy.getCurrentUser(authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data']);
        expect(response.body.data.user).to.have.property('email');
        expect(response.body.data.user).to.not.have.property('password');
      });
    });

    it('should return error for unauthenticated request', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/auth/me`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });

    it('should return error for invalid token', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/auth/me`,
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });
  });

  describe('POST /auth/logout', () => {
    let authToken;

    before(() => {
      cy.setupTestData().then((data) => {
        authToken = data.token;
      });
    });

    it('should logout successfully', () => {
      cy.logout(authToken).then((response) => {
        cy.expectSuccessResponse(response);
        expect(response.headers['set-cookie']).to.exist;
      });
    });

    it('should return error for unauthenticated request', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/auth/logout`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });
  });

  describe('General Auth Tests', () => {
    it('should handle OPTIONS requests', () => {
      cy.request('OPTIONS', `${baseUrl}/auth/register`).then((response) => {
        expect(response.status).to.equal(204);
      });
    });

    it('should handle health check endpoint', () => {
      cy.checkHealth().then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.success).to.be.true;
        expect(response.body).to.have.property('message');
      });
    });
  });
});