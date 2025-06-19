import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { authService } from '../auth/authService';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'viewer');
      
      // Check that refresh token is set as cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should fail with empty credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('GET /api/auth/me', () => {
    let validToken: string;

    beforeAll(async () => {
      // Get a valid token by logging in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      validToken = loginResponse.body.accessToken;
    });

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('role', 'viewer');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid or expired token');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser123',
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('username', 'newuser123');
      expect(response.body.user).toHaveProperty('role', 'viewer');
      
      // Check that refresh token is set as cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('should fail with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com', // Already exists
          username: 'anotheruser',
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already registered');
    });

    it('should fail with existing username', async () => {
      // First register a user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'unique@example.com',
          username: 'uniqueuser',
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'another@example.com',
          username: 'uniqueuser', // Already taken
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already taken');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'validuser',
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should fail with invalid username format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          username: 'ab', // Too short
          password: 'ValidPass123',
          confirmPassword: 'ValidPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          username: 'validuser',
          password: 'weak', // Too weak
          confirmPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Password must/);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          username: 'validuser',
          password: 'ValidPass123',
          confirmPassword: 'DifferentPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Passwords do not match');
    });

    it('should fail with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          // Missing username, password, confirmPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'All fields are required');
    });

    it('should enforce password complexity requirements', async () => {
      const testCases = [
        { password: 'short1A', error: 'Password must be at least 8 characters long' },
        { password: 'alllowercase123', error: 'Password must contain at least one uppercase letter' },
        { password: 'ALLUPPERCASE123', error: 'Password must contain at least one lowercase letter' },
        { password: 'NoNumbersHere', error: 'Password must contain at least one number' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'passwordtest@example.com',
            username: 'passwordtest',
            password: testCase.password,
            confirmPassword: testCase.password
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain(testCase.error);
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    let validToken: string;

    beforeAll(async () => {
      // Get a valid token by logging in
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      validToken = loginResponse.body.accessToken;
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
      
      // Check that refresh token cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=;/);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });
});