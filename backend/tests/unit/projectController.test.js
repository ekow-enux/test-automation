const {
  createTestUser,
  createTestProject,
  mockRequest,
  mockResponse,
  mockNext,
  expectSuccessResponse,
  expectErrorResponse,
} = require('../utils/testUtils');

const projectController = require('../../src/controllers/projectController');

describe('Project Controller', () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser();
  });

  describe('createProject', () => {
    test('should create a new project successfully', async () => {
      const req = mockRequest(testUser);
      req.body = {
        title: 'New Project',
        description: 'Project description',
      };

      const res = mockResponse();
      const next = mockNext;

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveProperty('title', 'New Project');
      expect(responseData.data).toHaveProperty('description', 'Project description');
      expect(responseData.data).toHaveProperty('createdBy', testUser._id.toString());
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error when user is not authenticated', async () => {
      const req = mockRequest(); // No user
      req.body = {
        title: 'New Project',
        description: 'Project description',
      };

      const res = mockResponse();
      const next = mockNext;

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expectErrorResponse(res, 401, 'User not authenticated');
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing required fields', async () => {
      const req = mockRequest(testUser);
      req.body = {
        title: 'New Project',
        // Missing description
      };

      const res = mockResponse();
      const next = mockNext;

      await projectController.createProject(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getProjects', () => {
    test('should return all projects for authenticated user', async () => {
      // Create test projects
      const project1 = await createTestProject(testUser._id);
      const project2 = await createTestProject(testUser._id, {
        title: 'Project 2',
        description: 'Second project',
      });

      const req = mockRequest(testUser);
      const res = mockResponse();
      const next = mockNext;

      await projectController.getProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data', 'count']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveLength(2);
      expect(responseData.count).toBe(2);
      expect(responseData.data[0]).toHaveProperty('title');
      expect(responseData.data[0]).toHaveProperty('description');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return empty array when no projects exist', async () => {
      const req = mockRequest(testUser);
      const res = mockResponse();
      const next = mockNext;

      await projectController.getProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data', 'count']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveLength(0);
      expect(responseData.count).toBe(0);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error when user is not authenticated', async () => {
      const req = mockRequest(); // No user
      const res = mockResponse();
      const next = mockNext;

      await projectController.getProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expectErrorResponse(res, 401, 'User not authenticated');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getProject', () => {
    test('should return single project successfully', async () => {
      const project = await createTestProject(testUser._id);
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };

      const res = mockResponse();
      const next = mockNext;

      await projectController.getProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveProperty('title', 'Test Project');
      expect(responseData.data).toHaveProperty('description', 'This is a test project');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error for invalid project ID', async () => {
      const req = mockRequest(testUser);
      req.params = { id: 'invalid-id' };

      const res = mockResponse();
      const next = mockNext;

      await projectController.getProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expectErrorResponse(res, 400, 'Invalid project ID');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when project not found', async () => {
      const req = mockRequest(testUser);
      req.params = { id: '507f1f77bcf86cd799439011' }; // Valid format but non-existent

      const res = mockResponse();
      const next = mockNext;

      await projectController.getProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expectErrorResponse(res, 404, 'Project not found');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when project belongs to different user', async () => {
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      
      const project = await createTestProject(otherUser._id);
      
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };

      const res = mockResponse();
      const next = mockNext;

      await projectController.getProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expectErrorResponse(res, 404, 'Project not found');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateProject', () => {
    test('should update project successfully', async () => {
      const project = await createTestProject(testUser._id);
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };
      req.body = {
        title: 'Updated Project',
        description: 'Updated description',
      };

      const res = mockResponse();
      const next = mockNext;

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveProperty('title', 'Updated Project');
      expect(responseData.data).toHaveProperty('description', 'Updated description');
      expect(next).not.toHaveBeenCalled();
    });

    test('should update only provided fields', async () => {
      const project = await createTestProject(testUser._id);
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };
      req.body = {
        title: 'Only Title Updated',
        // description not provided
      };

      const res = mockResponse();
      const next = mockNext;

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res, ['data']);
      
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toHaveProperty('title', 'Only Title Updated');
      expect(responseData.data).toHaveProperty('description', 'This is a test project'); // Original value
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error for invalid project ID', async () => {
      const req = mockRequest(testUser);
      req.params = { id: 'invalid-id' };

      const res = mockResponse();
      const next = mockNext;

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expectErrorResponse(res, 400, 'Invalid project ID');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when project not found', async () => {
      const req = mockRequest(testUser);
      req.params = { id: '507f1f77bcf86cd799439011' };

      const res = mockResponse();
      const next = mockNext;

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expectErrorResponse(res, 404, 'Project not found');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    test('should delete project successfully', async () => {
      const project = await createTestProject(testUser._id);
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };

      const res = mockResponse();
      const next = mockNext;

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expectSuccessResponse(res);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return error for invalid project ID', async () => {
      const req = mockRequest(testUser);
      req.params = { id: 'invalid-id' };

      const res = mockResponse();
      const next = mockNext;

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expectErrorResponse(res, 400, 'Invalid project ID');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when project not found', async () => {
      const req = mockRequest(testUser);
      req.params = { id: '507f1f77bcf86cd799439011' };

      const res = mockResponse();
      const next = mockNext;

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expectErrorResponse(res, 404, 'Project not found');
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 404 when project belongs to different user', async () => {
      const otherUser = await createTestUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123',
      });
      
      const project = await createTestProject(otherUser._id);
      
      const req = mockRequest(testUser);
      req.params = { id: project._id.toString() };

      const res = mockResponse();
      const next = mockNext;

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expectErrorResponse(res, 404, 'Project not found');
      expect(next).not.toHaveBeenCalled();
    });
  });
});