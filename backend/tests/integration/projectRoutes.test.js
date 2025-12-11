const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestProject, generateAuthToken, testProjectData } = require('../utils/testUtils');

describe('Project Routes Integration Tests', () => {
  let testUser;
  let authToken;
  let testProject;

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser();
    authToken = generateAuthToken(testUser);
  });

  describe('POST /projects', () => {
    test('should create a new project successfully', async () => {
      const response = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Test Project',
          description: 'This is a new test project',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project created successfully');
      expect(response.body.data).toHaveProperty('title', 'New Test Project');
      expect(response.body.data).toHaveProperty('description', 'This is a new test project');
      expect(response.body.data).toHaveProperty('createdBy', testUser._id.toString());
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .post('/projects')
        .send({
          title: 'New Test Project',
          description: 'This is a new test project',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    test('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Test Project',
          // Missing description
        })
        .expect(500); // Mongoose validation error

      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/projects')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'New Test Project',
          description: 'This is a new test project',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('GET /projects', () => {
    beforeEach(async () => {
      // Create some test projects
      testProject = await createTestProject(testUser._id);
      await createTestProject(testUser._id, {
        title: 'Project 2',
        description: 'Second test project',
      });
    });

    test('should return all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('description');
      expect(response.body.data[0]).toHaveProperty('createdBy');
    });

    test('should return empty array when no projects exist', async () => {
      // Delete all projects first
      const Project = require('../../src/models/Project');
      await Project.deleteMany({});

      const response = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .get('/projects')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    test('should return projects sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check that projects are sorted by createdAt (descending)
      for (let i = 0; i < response.body.data.length - 1; i++) {
        const current = new Date(response.body.data[i].createdAt);
        const next = new Date(response.body.data[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe('GET /projects/:id', () => {
    beforeEach(async () => {
      testProject = await createTestProject(testUser._id);
    });

    test('should return single project successfully', async () => {
      const response = await request(app)
        .get(`/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', testProjectData.title);
      expect(response.body.data).toHaveProperty('description', testProjectData.description);
      expect(response.body.data).toHaveProperty('_id', testProject._id.toString());
    });

    test('should return error for invalid project ID', async () => {
      const response = await request(app)
        .get('/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid project ID');
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    test('should return 404 when project belongs to different user', async () => {
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      
      const otherProject = await createTestProject(otherUser._id);
      
      const response = await request(app)
        .get(`/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .get(`/projects/${testProject._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('PUT /projects/:id', () => {
    beforeEach(async () => {
      testProject = await createTestProject(testUser._id);
    });

    test('should update project successfully', async () => {
      const response = await request(app)
        .put(`/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Project Title',
          description: 'Updated project description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.data).toHaveProperty('title', 'Updated Project Title');
      expect(response.body.data).toHaveProperty('description', 'Updated project description');
    });

    test('should update only provided fields', async () => {
      const response = await request(app)
        .put(`/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Only Title Updated',
          // description not provided
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title', 'Only Title Updated');
      expect(response.body.data).toHaveProperty('description', testProjectData.description); // Original value
    });

    test('should return error for invalid project ID', async () => {
      const response = await request(app)
        .put('/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid project ID');
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    test('should return 404 when project belongs to different user', async () => {
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      
      const otherProject = await createTestProject(otherUser._id);
      
      const response = await request(app)
        .put(`/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });
  });

  describe('DELETE /projects/:id', () => {
    beforeEach(async () => {
      testProject = await createTestProject(testUser._id);
    });

    test('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is actually deleted
      const Project = require('../../src/models/Project');
      const deletedProject = await Project.findById(testProject._id);
      expect(deletedProject).toBeNull();
    });

    test('should return error for invalid project ID', async () => {
      const response = await request(app)
        .delete('/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid project ID');
    });

    test('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/projects/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    test('should return 404 when project belongs to different user', async () => {
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      
      const otherProject = await createTestProject(otherUser._id);
      
      const response = await request(app)
        .delete(`/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Project not found');
    });

    test('should return error for unauthenticated user', async () => {
      const response = await request(app)
        .delete(`/projects/${testProject._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });
  });

  describe('General project route tests', () => {
    test('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/projects')
        .expect(204);

      expect(response.body).toEqual({});
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});