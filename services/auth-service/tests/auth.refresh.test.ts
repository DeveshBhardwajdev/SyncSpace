import request from 'supertest';
import app from '../src/app';
import redis from '../src/config/redis';
import jwt from 'jsonwebtoken';

describe('POST /api/auth/refresh', () => {

  const testUser = {
    name: 'Refresh Test User',
    email: 'refreshtest@example.com',
    password: 'Password123',
  };

  // Helper: register + login, return the refreshToken cookie string
  // ready to be attached via .set('Cookie', ...)
  const getRefreshCookie = async (): Promise<string> => {
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));

    // Extract just "refreshToken=<value>" — strip the HttpOnly/Path/etc attributes
    return refreshCookie!.split(';')[0];
  };

  // ─── Valid Rotation ──────────────────────────────────────────────────
  it('should issue a new access token and blacklist the old refresh token', async () => {
    const oldCookie = await getRefreshCookie();
    const oldToken = oldCookie.split('=')[1];

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Token refreshed successfully');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(typeof response.body.data.accessToken).toBe('string');

    // A new refreshToken cookie should be set
    const newCookies = response.headers['set-cookie'] as unknown as string[];
    const newRefreshCookie = newCookies.find((c) => c.startsWith('refreshToken='));
    expect(newRefreshCookie).toBeDefined();

    // THE REAL PROOF OF ROTATION: the OLD token is now blacklisted in Redis,
    // regardless of whether the new token string happens to differ
    const blacklistEntry = await redis.get(`blacklist:${oldToken}`);
    expect(blacklistEntry).toBe('1');
  });;

  // ─── No Token Provided ───────────────────────────────────────────────
  it('should reject when no refresh token cookie is provided', async () => {
    const response = await request(app)
      .post('/api/auth/refresh');
      // No Cookie header at all

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No refresh token provided');
  });

  // ─── Invalid / Garbage Token ─────────────────────────────────────────
  it('should reject an invalid or malformed refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=this-is-not-a-real-jwt');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid or expired refresh token. Please login again.');
  });

  // ─── Stolen Token Detection (Reuse) ──────────────────────────────────
  it('should detect and reject reuse of an old (already rotated) refresh token', async () => {
    const oldCookie = await getRefreshCookie();

    // First refresh — this rotates the token, blacklisting `oldCookie`'s token
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);

    // Now try to reuse the SAME old cookie — simulating a stolen/replayed token
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Refresh token reuse detected. Please login again.');
  });

});