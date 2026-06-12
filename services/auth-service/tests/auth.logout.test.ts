import request from 'supertest';
import app from '../src/app';
import redis from '../src/config/redis';

describe('POST /api/auth/logout', () => {

  const testUser = {
    name: 'Logout Test User',
    email: 'logouttest@example.com',
    password: 'Password123',
  };

  // Helper: register + login, return the accessToken
  const getAccessToken = async (): Promise<string> => {
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    return loginRes.body.data.accessToken;
  };

  // ─── Valid Token ─────────────────────────────────────────────────────
  it('should log out successfully with a valid access token', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');

    // ── The real proof: was the token actually written to Redis? ──────
    const blacklistEntry = await redis.get(`blacklist:${accessToken}`);
    expect(blacklistEntry).toBe('1');
  });

  // ─── Clears the refresh token cookie ────────────────────────────────
  it('should clear the refreshToken cookie on logout', async () => {
    const accessToken = await getAccessToken();

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    const cookies = response.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies?.find((c) => c.startsWith('refreshToken='));

    expect(refreshCookie).toBeDefined();
    // A cleared cookie has an empty value and/or an expiry date in the past
    expect(refreshCookie).toMatch(/refreshToken=;/);
  });

  // ─── Already Blacklisted Token ───────────────────────────────────────
  it('should succeed even if the token is already blacklisted (idempotent)', async () => {
    const accessToken = await getAccessToken();

    // Log out once — blacklists the token
    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    // Log out again with the SAME token
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');
  });

  // ─── Missing Token ───────────────────────────────────────────────────
  it('should still return success when no token is provided', async () => {
    const response = await request(app)
      .post('/api/auth/logout');
      // No Authorization header at all

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Logged out successfully');
  });

});