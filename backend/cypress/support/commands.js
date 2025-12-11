// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to register a new user
Cypress.Commands.add('registerUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: '/auth/register',
    body: userData,
    failOnStatusCode: false,
  });
});

// Custom command to login a user
Cypress.Commands.add('loginUser', (credentials) => {
  return cy.request({
    method: 'POST',
    url: '/auth/login',
    body: credentials,
    failOnStatusCode: false,
  });
});

// Custom command to get authentication token
Cypress.Commands.add('getAuthToken', (credentials) => {
  return cy.request({
    method: 'POST',
    url: '/auth/login',
    body: credentials,
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.be.true;
    return response.body.data.token;
  });
});

// Custom command to create a project
Cypress.Commands.add('createProject', (projectData, authToken) => {
  return cy.request({
    method: 'POST',
    url: '/projects',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: projectData,
    failOnStatusCode: false,
  });
});

// Custom command to get all projects
Cypress.Commands.add('getProjects', (authToken) => {
  return cy.request({
    method: 'GET',
    url: '/projects',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to get a specific project
Cypress.Commands.add('getProject', (projectId, authToken) => {
  return cy.request({
    method: 'GET',
    url: `/projects/${projectId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to update a project
Cypress.Commands.add('updateProject', (projectId, projectData, authToken) => {
  return cy.request({
    method: 'PUT',
    url: `/projects/${projectId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: projectData,
    failOnStatusCode: false,
  });
});

// Custom command to delete a project
Cypress.Commands.add('deleteProject', (projectId, authToken) => {
  return cy.request({
    method: 'DELETE',
    url: `/projects/${projectId}`,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to get current user
Cypress.Commands.add('getCurrentUser', (authToken) => {
  return cy.request({
    method: 'GET',
    url: '/auth/me',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to logout
Cypress.Commands.add('logout', (authToken) => {
  return cy.request({
    method: 'POST',
    url: '/auth/logout',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    failOnStatusCode: false,
  });
});

// Custom command to check API health
Cypress.Commands.add('checkHealth', () => {
  return cy.request({
    method: 'GET',
    url: '/health',
    failOnStatusCode: false,
  });
});

// Custom assertion for successful API response
Cypress.Commands.add('expectSuccessResponse', (response, expectedKeys = []) => {
  expect(response.status).to.be.oneOf([200, 201, 204]);
  expect(response.body.success).to.be.true;
  
  expectedKeys.forEach(key => {
    expect(response.body).to.have.property(key);
  });
});

// Custom assertion for error API response
Cypress.Commands.add('expectErrorResponse', (response, statusCode, message = null) => {
  expect(response.status).to.eq(statusCode);
  expect(response.body.success).to.be.false;
  
  if (message) {
    expect(response.body.message).to.include(message);
  }
});

// Custom command to setup test data
Cypress.Commands.add('setupTestData', () => {
  const testUser = {
    name: 'Cypress Test User',
    email: `cypress${Date.now()}@example.com`,
    password: 'password123',
  };

  const testProject = {
    title: 'Cypress Test Project',
    description: 'This is a test project created by Cypress',
  };

  return cy.registerUser(testUser).then((registerResponse) => {
    if (registerResponse.status === 201) {
      return cy.getAuthToken({ email: testUser.email, password: testUser.password })
        .then((token) => {
          return {
            user: registerResponse.body.data.user,
            token,
            projectData: testProject,
          };
        });
    }
    throw new Error('Failed to register test user');
  });
});

//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })