describe('Projects API End-to-End Tests', () => {
  const baseUrl = Cypress.env('apiUrl') || 'http://localhost:5000';
  let authToken;
  let testProject;

  before(() => {
    // Setup test data and get auth token
    cy.setupTestData().then((data) => {
      authToken = data.token;
    });
  });

  describe('POST /projects', () => {
    it('should create a new project successfully', () => {
      const projectData = {
        title: 'Cypress E2E Test Project',
        description: 'This is a project created during E2E testing',
      };

      cy.createProject(projectData, authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data']);
        expect(response.body.data.title).to.equal(projectData.title);
        expect(response.body.data.description).to.equal(projectData.description);
        expect(response.body.data).to.have.property('createdBy');
        
        testProject = response.body.data;
      });
    });

    it('should return error for unauthenticated user', () => {
      const projectData = {
        title: 'Unauthorized Project',
        description: 'This should fail',
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/projects`,
        body: projectData,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });

    it('should return error for missing required fields', () => {
      const invalidProjectData = {
        title: 'Incomplete Project',
        // Missing description
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/projects`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: invalidProjectData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 500]);
        expect(response.body.success).to.be.false;
      });
    });

    it('should return error for invalid token', () => {
      const projectData = {
        title: 'Invalid Token Project',
        description: 'This should fail due to invalid token',
      };

      cy.request({
        method: 'POST',
        url: `${baseUrl}/projects`,
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        body: projectData,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });
  });

  describe('GET /projects', () => {
    before(() => {
      // Create additional test projects
      const project1 = {
        title: 'First Test Project',
        description: 'First test project description',
      };

      const project2 = {
        title: 'Second Test Project',
        description: 'Second test project description',
      };

      cy.createProject(project1, authToken);
      cy.createProject(project2, authToken);
    });

    it('should return all projects for authenticated user', () => {
      cy.getProjects(authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data', 'count']);
        expect(response.body.count).to.be.greaterThan(0);
        expect(response.body.data).to.be.an('array');
        expect(response.body.data.length).to.equal(response.body.count);
        
        // Check that projects have required properties
        response.body.data.forEach((project) => {
          expect(project).to.have.property('title');
          expect(project).to.have.property('description');
          expect(project).to.have.property('createdBy');
        });
      });
    });

    it('should return error for unauthenticated user', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/projects`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });

    it('should return projects sorted by creation date (newest first)', () => {
      cy.getProjects(authToken).then((response) => {
        expect(response.body.success).to.be.true;
        
        // Check that projects are sorted by createdAt (descending)
        for (let i = 0; i < response.body.data.length - 1; i++) {
          const current = new Date(response.body.data[i].createdAt);
          const next = new Date(response.body.data[i + 1].createdAt);
          expect(current.getTime()).to.be.greaterThanOrEqual(next.getTime());
        }
      });
    });
  });

  describe('GET /projects/:id', () => {
    before(() => {
      // Ensure we have a test project
      if (!testProject) {
        const projectData = {
          title: 'Single Test Project',
          description: 'Test project for single retrieval',
        };

        cy.createProject(projectData, authToken).then((response) => {
          testProject = response.body.data;
        });
      }
    });

    it('should return single project successfully', () => {
      cy.getProject(testProject._id, authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data']);
        expect(response.body.data._id).to.equal(testProject._id);
        expect(response.body.data.title).to.equal(testProject.title);
        expect(response.body.data.description).to.equal(testProject.description);
      });
    });

    it('should return error for invalid project ID', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/projects/invalid-id`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 400, 'Invalid project ID');
      });
    });

    it('should return 404 for non-existent project', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/projects/507f1f77bcf86cd799439011`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 404, 'Project not found');
      });
    });

    it('should return error for unauthenticated user', () => {
      cy.request({
        method: 'GET',
        url: `${baseUrl}/projects/${testProject._id}`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });
  });

  describe('PUT /projects/:id', () => {
    let updateTestProject;

    before(() => {
      // Create a project specifically for update tests
      const projectData = {
        title: 'Project to Update',
        description: 'This project will be updated',
      };

      cy.createProject(projectData, authToken).then((response) => {
        updateTestProject = response.body.data;
      });
    });

    it('should update project successfully', () => {
      const updatedData = {
        title: 'Updated Project Title',
        description: 'Updated project description',
      };

      cy.updateProject(updateTestProject._id, updatedData, authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data']);
        expect(response.body.data.title).to.equal(updatedData.title);
        expect(response.body.data.description).to.equal(updatedData.description);
        expect(response.body.data._id).to.equal(updateTestProject._id);
      });
    });

    it('should update only provided fields', () => {
      const partialUpdate = {
        title: 'Only Title Updated',
        // description not provided
      };

      cy.updateProject(updateTestProject._id, partialUpdate, authToken).then((response) => {
        cy.expectSuccessResponse(response, ['data']);
        expect(response.body.data.title).to.equal(partialUpdate.title);
        expect(response.body.data.description).to.equal('This project will be updated'); // Original value
      });
    });

    it('should return error for invalid project ID', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      cy.request({
        method: 'PUT',
        url: `${baseUrl}/projects/invalid-id`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: updateData,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 400, 'Invalid project ID');
      });
    });

    it('should return 404 for non-existent project', () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      cy.request({
        method: 'PUT',
        url: `${baseUrl}/projects/507f1f77bcf86cd799439011`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: updateData,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 404, 'Project not found');
      });
    });
  });

  describe('DELETE /projects/:id', () => {
    let deleteTestProject;

    before(() => {
      // Create a project specifically for delete tests
      const projectData = {
        title: 'Project to Delete',
        description: 'This project will be deleted',
      };

      cy.createProject(projectData, authToken).then((response) => {
        deleteTestProject = response.body.data;
      });
    });

    it('should delete project successfully', () => {
      cy.deleteProject(deleteTestProject._id, authToken).then((response) => {
        cy.expectSuccessResponse(response);
        
        // Verify project is actually deleted
        cy.request({
          method: 'GET',
          url: `${baseUrl}/projects/${deleteTestProject._id}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          failOnStatusCode: false,
        }).then((getResponse) => {
          cy.expectErrorResponse(getResponse, 404, 'Project not found');
        });
      });
    });

    it('should return error for invalid project ID', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/projects/invalid-id`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 400, 'Invalid project ID');
      });
    });

    it('should return 404 for non-existent project', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/projects/507f1f77bcf86cd799439011`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 404, 'Project not found');
      });
    });

    it('should return error for unauthenticated user', () => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/projects/${deleteTestProject._id}`,
        failOnStatusCode: false,
      }).then((response) => {
        cy.expectErrorResponse(response, 401, 'Not authorized');
      });
    });
  });

  describe('General Project Tests', () => {
    it('should handle OPTIONS requests', () => {
      cy.request('OPTIONS', `${baseUrl}/projects`).then((response) => {
        expect(response.status).to.equal(204);
      });
    });

    it('should handle invalid JSON in request body', () => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/projects`,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: '{invalid json}',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.success).to.be.false;
      });
    });
  });
});