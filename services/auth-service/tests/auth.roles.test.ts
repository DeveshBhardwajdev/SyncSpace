import request from 'supertest';
import app from '../src/app';
import User, { UserRole } from '../src/models/user.model';
import { generateAccessToken } from '../src/utils/jwt.utils';
import { hashPassword } from '../src/utils/jwt.utils';

describe('Role Guard Middleware', () => {

  // Helper: creates a user directly in MongoDB with a specific role,
  // then generates a valid access token for them — bypassing the
  // register API, which always defaults to 'candidate'
  const createUserWithRole = async (role: UserRole, email: string) => {
    const hashedPassword = await hashPassword('Password123');

    const user = await User.create({
      name: `${role} Test User`,
      email,
      password: hashedPassword,
      role,
    });

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    return accessToken;
  };

  // ─── Interviewer accessing interviewer-only route ───────────────────
  it('should allow an INTERVIEWER to access /test/interviewer-only', async () => {
    const token = await createUserWithRole(UserRole.INTERVIEWER, 'interviewer1@example.com');

    const response = await request(app)
      .get('/api/auth/test/interviewer-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Welcome Interviewer! You have access to this route.');
    expect(response.body.data.user.role).toBe(UserRole.INTERVIEWER);
  });

  // ─── Candidate blocked from interviewer-only route ──────────────────
  it('should block a CANDIDATE from accessing /test/interviewer-only', async () => {
    const token = await createUserWithRole(UserRole.CANDIDATE, 'candidate1@example.com');

    const response = await request(app)
      .get('/api/auth/test/interviewer-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      `Access denied. Required role: ${UserRole.INTERVIEWER}. Your role: ${UserRole.CANDIDATE}.`
    );
  });

  // ─── Candidate accessing candidate-only route ───────────────────────
  it('should allow a CANDIDATE to access /test/candidate-only', async () => {
    const token = await createUserWithRole(UserRole.CANDIDATE, 'candidate2@example.com');

    const response = await request(app)
      .get('/api/auth/test/candidate-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Welcome Candidate! You have access to this route.');
  });

  // ─── Interviewer blocked from candidate-only route ──────────────────
  it('should block an INTERVIEWER from accessing /test/candidate-only', async () => {
    const token = await createUserWithRole(UserRole.INTERVIEWER, 'interviewer2@example.com');

    const response = await request(app)
      .get('/api/auth/test/candidate-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      `Access denied. Required role: ${UserRole.CANDIDATE}. Your role: ${UserRole.INTERVIEWER}.`
    );
  });

  // ─── Both roles allowed on shared route ─────────────────────────────
  it('should allow both INTERVIEWER and CANDIDATE on /test/both-roles', async () => {
    const interviewerToken = await createUserWithRole(UserRole.INTERVIEWER, 'interviewer3@example.com');
    const candidateToken = await createUserWithRole(UserRole.CANDIDATE, 'candidate3@example.com');

    const res1 = await request(app)
      .get('/api/auth/test/both-roles')
      .set('Authorization', `Bearer ${interviewerToken}`);
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get('/api/auth/test/both-roles')
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(res2.status).toBe(200);
  });

  // ─── No token provided ───────────────────────────────────────────────
  it('should block access to a protected route when no token is provided', async () => {
    const response = await request(app)
      .get('/api/auth/test/interviewer-only');
      // No Authorization header

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Access denied. No token provided.');
  });

  // ─── Admin blocked from candidate-only route ────────────────────────
  it('should block an ADMIN from accessing /test/candidate-only (not in allowed list)', async () => {
    const token = await createUserWithRole(UserRole.ADMIN, 'admin1@example.com');

    const response = await request(app)
      .get('/api/auth/test/candidate-only')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      `Access denied. Required role: ${UserRole.CANDIDATE}. Your role: ${UserRole.ADMIN}.`
    );
  });

});