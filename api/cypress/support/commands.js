// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to check API response structure
Cypress.Commands.add('checkApiResponse', (response, expectedStatus = 200) => {
  expect(response.status).to.eq(expectedStatus);
  expect(response.headers['content-type']).to.include('application/json');
});

// Custom command to test GET requests
Cypress.Commands.add('testGetRequest', (endpoint, expectedData) => {
  cy.request(endpoint).then((response) => {
    cy.checkApiResponse(response, 200);
    if (expectedData) {
      expect(response.body).to.deep.include(expectedData);
    }
  });
});

// Custom command to test POST requests
Cypress.Commands.add('testPostRequest', (endpoint, data, expectedStatus = 201) => {
  cy.request({
    method: 'POST',
    url: endpoint,
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => {
    cy.checkApiResponse(response, expectedStatus);
  });
});

// Custom command to test validation errors
Cypress.Commands.add('testValidationError', (endpoint, data, expectedMessage) => {
  cy.request({
    method: 'POST',
    url: endpoint,
    body: data,
    headers: {
      'Content-Type': 'application/json',
    },
    failOnStatusCode: false,
  }).then((response) => {
    expect(response.status).to.eq(400);
    expect(response.body.success).to.be.false;
    expect(response.body.message).to.include(expectedMessage);
  });
});