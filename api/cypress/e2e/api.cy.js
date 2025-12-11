describe('API E2E Tests', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('GET /api/health', () => {
    it('should return health status and timestamp', () => {
      cy.testGetRequest('/api/health');
      
      cy.request('/api/health').then((response) => {
        expect(response.body.status).to.eq('OK');
        expect(response.body.message).to.be.a('string');
        expect(response.body.timestamp).to.be.a('string');
        
        // Check if timestamp is valid ISO format
        expect(new Date(response.body.timestamp).toISOString()).to.eq(response.body.timestamp);
      });
    });
  });

  describe('GET /api/users', () => {
    it('should return all users with correct structure', () => {
      cy.request('/api/users').then((response) => {
        cy.checkApiResponse(response, 200);
        expect(response.body.success).to.be.true;
        expect(response.body.data).to.be.an('array');
        expect(response.body.count).to.eq(3);
        
        // Check each user has required properties
        response.body.data.forEach(user => {
          expect(user).to.have.property('id');
          expect(user).to.have.property('name');
          expect(user).to.have.property('email');
          expect(user).to.have.property('age');
        });
        
        // Check specific user data
        const users = response.body.data;
        expect(users[0].name).to.eq('John Doe');
        expect(users[0].email).to.eq('john@example.com');
        expect(users[0].age).to.eq(30);
        
        expect(users[1].name).to.eq('Jane Smith');
        expect(users[1].email).to.eq('jane@example.com');
        expect(users[1].age).to.eq(25);
        
        expect(users[2].name).to.eq('Bob Johnson');
        expect(users[2].email).to.eq('bob@example.com');
        expect(users[2].age).to.eq(35);
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user with valid data', () => {
      const newUser = {
        name: 'Alice Brown',
        email: 'alice@example.com',
        age: 32
      };

      cy.testPostRequest('/api/users', newUser, 201);
      
      cy.request({
        method: 'POST',
        url: '/api/users',
        body: newUser,
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.eq('User created successfully');
        expect(response.body.data).to.have.property('id');
        expect(response.body.data.name).to.eq(newUser.name);
        expect(response.body.data.email).to.eq(newUser.email);
        expect(response.body.data.age).to.eq(newUser.age);
      });
    });

    it('should return 400 when name is missing', () => {
      cy.testValidationError('/api/users', {
        email: 'test@example.com',
        age: 25
      }, 'Please provide name, email, and age');
    });

    it('should return 400 when email is missing', () => {
      cy.testValidationError('/api/users', {
        name: 'Test User',
        age: 25
      }, 'Please provide name, email, and age');
    });

    it('should return 400 when age is missing', () => {
      cy.testValidationError('/api/users', {
        name: 'Test User',
        email: 'test@example.com'
      }, 'Please provide name, email, and age');
    });

    it('should return 400 when all fields are missing', () => {
      cy.testValidationError('/api/users', {}, 'Please provide name, email, and age');
    });

    it('should create user with edge case age values', () => {
      const edgeCaseUser = {
        name: 'Edge Case User',
        email: 'edge@example.com',
        age: 1
      };

      cy.testPostRequest('/api/users', edgeCaseUser, 201);
    });

    it('should handle special characters in user data', () => {
      const specialCharUser = {
        name: 'José María O\'Connor',
        email: 'jose.maria@example.com',
        age: 28
      };

      cy.testPostRequest('/api/users', specialCharUser, 201);
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for non-existent GET routes', () => {
      cy.request({
        url: '/api/nonexistent',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.eq('Route not found');
      });
    });

    it('should return 404 for non-existent POST routes', () => {
      cy.request({
        method: 'POST',
        url: '/api/nonexistent',
        body: { test: 'data' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.eq('Route not found');
      });
    });
  });

  describe('Content-Type Headers', () => {
    it('should return JSON content-type for all responses', () => {
      const endpoints = ['/api/health', '/api/users'];
      
      endpoints.forEach(endpoint => {
        cy.request(endpoint).then((response) => {
          expect(response.headers['content-type']).to.include('application/json');
        });
      });
    });
  });
});