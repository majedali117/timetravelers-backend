const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
};

// Connect to test database before tests
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/timetravelers_test';
  await mongoose.connect(testDbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up database after tests
afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

// Clean up between tests
afterEach(async () => {
  await User.deleteMany({});
});

describe('Authentication API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('userId');
    });

    it('should not register a user with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not register a user with short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...testUser,
          password: 'short',
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not register a user with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not register a user with an existing email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      
      // Second registration with same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register and verify a test user
      const user = new User({
        ...testUser,
        isEmailVerified: true,
        authMethod: 'local',
      });
      await user.save();
    });

    it('should login a verified user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should not login an unverified user', async () => {
      // Create an unverified user
      await User.findOneAndUpdate(
        { email: testUser.email },
        { isEmailVerified: false }
      );

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('verify your email');
    });
  });

  // Additional tests for other authentication endpoints would go here
});
