import request from 'supertest';
import app from '../src/app';
import User from '../src/models/user.model';

describe('POST /api/auth/register', () => {

  // ─── Happy Path ──────────────────────────────────────────────────────
  it('should register a new user successfully with valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Account Created Successfully');

    // Check the user object inside the (misnamed) "date" field
    expect(response.body.date.user).toHaveProperty('id');
    expect(response.body.date.user.email).toBe('testuser@example.com');
    expect(response.body.date.user.name).toBe('Test User');
    expect(response.body.date.user.role).toBe('candidate'); // default role

    // Check tokens are present
    expect(response.body.date).toHaveProperty('accessToken');
    expect(response.body.date).toHaveProperty('refreshToken');
    expect(typeof response.body.date.accessToken).toBe('string');

    // Confirm the password is NEVER returned in the response
    expect(response.body.date.user.password).toBeUndefined();
  });

  // ─── Database Verification ──────────────────────────────────────────
  it('should actually save the user to the database with a hashed password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'DB Check User',
        email: 'dbcheck@example.com',
        password: 'Password123',
      });

    const userInDb = await User.findOne({ email: 'dbcheck@example.com' });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.name).toBe('DB Check User');

    // The stored password should be a bcrypt hash, NOT the plain text
    expect(userInDb?.password).not.toBe('Password123');
    expect(userInDb?.password.startsWith('$2')).toBe(true); // bcrypt hashes start with $2a$, $2b$, etc.
  });

  // ─── Duplicate Email ───────────────────────────────────────────────────
  it('should reject registration with an email that already exists', async () => {
    // First registration — should succeed
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'Password123',
      });

    // Second registration with same email — should fail
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'Password456',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('An Account with this email already exist');
  });

  // ─── Missing Fields ────────────────────────────────────────────────────
  it('should reject registration when required fields are missing', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'incomplete@example.com',
        // name and password missing
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation Failed');
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors.length).toBeGreaterThan(0);

    // Should contain errors about both missing name and missing password
    expect(response.body.errors).toContain('Name is required');
    expect(response.body.errors).toContain('Password is Required');
  });

  // ─── Weak Password ─────────────────────────────────────────────────────
  it('should reject registration with a weak password (no uppercase/number)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Password User',
        email: 'weakpass@example.com',
        password: 'weakpassword', // all lowercase, no number
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation Failed');
    expect(response.body.errors).toContain(
      'Password must contain atleast one uppercase letter , one lowercase letter and one number'
    );
  });

  // ─── Short Password ─────────────────────────────────────────────────────
  it('should reject registration with a password shorter than 8 characters', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Short Password User',
        email: 'shortpass@example.com',
        password: 'Pass1', // only 5 characters
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Password Must be 8 characters');
  });

  // ─── Invalid Email Format ───────────────────────────────────────────────
  it('should reject registration with an invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bad Email User',
        email: 'not-an-email',
        password: 'Password123',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toContain('Please Provide a valid Email Address');
  });

});