import request from 'supertest';
import app from '../src/app';

describe('POST /api/auth/login', () => {

  // Before testing login, we need a real user in the database to log in as.
  // We create one user before all tests in this file run.
  const testUser = {
    name: 'Login Test User',
    email: 'logintest@example.com',
    password: 'Password123',
  };

  beforeEach(async () => {
    // Register a user via the real API — this also confirms register still works
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
  });

  // ─── Happy Path ──────────────────────────────────────────────────────
  it('should log in successfully with correct email and password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login successful');

    // Login uses "data" (correctly spelled), unlike register's "date" typo
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');

    // Password should never be returned
    expect(response.body.data.user.password).toBeUndefined();
  });

  // ─── Cookie Check ────────────────────────────────────────────────────
  it('should set a refreshToken cookie on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    // Supertest exposes raw Set-Cookie headers as an array of strings
    const cookies = response.headers['set-cookie'] as unknown as string[];

    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });

  // ─── Wrong Password ──────────────────────────────────────────────────
  it('should reject login with an incorrect password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password');
  });

  // ─── Non-existent Email ──────────────────────────────────────────────
  it('should reject login with an email that does not exist', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'doesnotexist@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password');
  });

  // ─── Missing Fields ──────────────────────────────────────────────────
  it('should reject login when email and password are missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation Failed');
    expect(response.body.errors).toContain('Email is required');
    expect(response.body.errors).toContain('Password is Required');
  });

  // ─── Invalid Email Format ────────────────────────────────────────────
  it('should reject login with an invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Enter Valid Email Address');
  });

});