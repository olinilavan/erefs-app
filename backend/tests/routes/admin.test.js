const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, makeAdminToken, authHeader, mockDbClient } = require('../helpers');

jest.mock('../../src/db');

const adminToken = makeAdminToken();
const nonAdminToken = makeToken({ id: 'emp-uuid', role: 'employer', is_admin: false });

describe('Admin middleware', () => {
  it('blocks non-admin users from all admin routes', async () => {
    const res = await request(app).get('/api/admin/employers').set(authHeader(nonAdminToken));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  it('blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/admin/employers');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/stats', () => {
  it('returns platform-wide statistics', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{
        total_employers: '5',
        total_jobseekers: '12',
        total_requests: '20',
        total_submissions: '35',
        total_reports: '18',
      }],
    });

    const res = await request(app).get('/api/admin/stats').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_employers');
    expect(res.body).toHaveProperty('total_reports');
  });
});

describe('GET /api/admin/employers', () => {
  it('returns all employers with stats', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [
        { id: 'emp-1', name: 'Acme HR', email: 'hr@acme.com', company: 'Acme', active_requests: '3', terms_accepted_at: new Date().toISOString() },
        { id: 'emp-2', name: 'Beta Corp', email: 'hr@beta.com', company: 'Beta', active_requests: '1', terms_accepted_at: null },
      ],
    });

    const res = await request(app).get('/api/admin/employers').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].company).toBe('Acme');
  });
});

describe('GET /api/admin/employers/:id/candidates', () => {
  it('returns pipeline for a specific employer', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'rr-1', candidate_name: 'Alex Chen', status: 'pending', total_referrers: 2, completed_referrers: 0 }],
    });

    const res = await request(app).get('/api/admin/employers/emp-1/candidates').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body[0].candidate_name).toBe('Alex Chen');
  });
});

describe('POST /api/admin/employers/:id/referrals', () => {
  it('creates a referral on behalf of employer', async () => {
    const client = mockDbClient([
      { rows: [] },                                               // BEGIN
      { rows: [{ id: 'rr-new', target_role: 'Engineer' }] },     // INSERT referral_request
      { rows: [] },                                               // INSERT referrer
      { rows: [] },                                               // COMMIT
    ]);
    db.connect = jest.fn().mockResolvedValue(client);

    const res = await request(app).post('/api/admin/employers/emp-1/referrals')
      .set(authHeader(adminToken))
      .send({
        candidateName: 'Alex Chen',
        targetRole: 'Engineer',
        referrers: [{ name: 'John', email: 'john@company.com' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.target_role).toBe('Engineer');
  });
});
