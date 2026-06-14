const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, authHeader, mockDbClient } = require('../helpers');

jest.mock('../../src/db');
jest.mock('../../src/services/email', () => ({
  sendReferrerInvite: jest.fn().mockResolvedValue(undefined),
}));

const { sendReferrerInvite } = require('../../src/services/email');

const token = makeToken({ id: 'emp-uuid', role: 'employer', name: 'Test Employer' });

describe('POST /api/referrals', () => {
  const body = {
    targetRole: 'Engineer',
    candidateName: 'Alex Chen',
    referrers: [{ name: 'John Doe', email: 'john@company.com' }],
  };

  it('creates a referral request and sends invites', async () => {
    const client = mockDbClient([
      { rows: [] },                                                        // BEGIN
      { rows: [{ id: 'rr-uuid', target_role: 'Engineer' }] },             // INSERT referral_request
      { rows: [{ id: 'ref-uuid', token: 'tok-uuid' }] },                  // INSERT referrer
      { rows: [] },                                                        // COMMIT
    ]);
    db.connect = jest.fn().mockResolvedValue(client);
    db.query = jest.fn().mockResolvedValue({ rows: [{ require_work_email: false }] });

    const res = await request(app).post('/api/referrals')
      .set(authHeader(token)).send(body);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('referralRequest');
    expect(sendReferrerInvite).toHaveBeenCalledTimes(1);
  });

  it('blocks personal email when work email policy is on', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [{ require_work_email: true }] });

    const res = await request(app).post('/api/referrals')
      .set(authHeader(token))
      .send({ ...body, referrers: [{ name: 'John', email: 'john@gmail.com' }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/work email/i);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/referrals').send(body);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/referrals', () => {
  it('returns list of referral requests for the user', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'rr-1', target_role: 'Engineer', status: 'pending', total_referrers: 2, completed_referrers: 1 }],
    });

    const res = await request(app).get('/api/referrals').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].target_role).toBe('Engineer');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/referrals');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/referrals/:id', () => {
  it('returns referral with referrer rows including token', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [
        { id: 'rr-1', target_role: 'Engineer', referrer_id: 'ref-1', referrer_name: 'John', token: 'tok-1', submitted_at: null, report_id: null },
      ],
    });

    const res = await request(app).get('/api/referrals/rr-1').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('token');
    expect(res.body[0].referrer_name).toBe('John');
  });

  it('returns 404 for unknown id', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/referrals/bad-id').set(authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/referrals/:id/referrers', () => {
  it('adds a new referrer to an existing request', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'rr-1' }] })           // owner check
      .mockResolvedValueOnce({ rows: [{ require_work_email: false }] }) // policy
      .mockResolvedValueOnce({ rows: [{ id: 'ref-2', token: 'tok-2', name: 'Jane', email: 'jane@company.com' }] }) // insert referrer
      .mockResolvedValueOnce({ rows: [{ id: 'rr-1', target_role: 'Engineer' }] }) // fetch rr
      .mockResolvedValueOnce({ rows: [{ id: 'emp-uuid', name: 'Test Employer' }] }); // fetch requester

    const res = await request(app).post('/api/referrals/rr-1/referrers')
      .set(authHeader(token)).send({ name: 'Jane', email: 'jane@company.com' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Jane');
    expect(sendReferrerInvite).toHaveBeenCalled();
  });

  it('blocks personal email when policy is on', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'rr-1' }] })
      .mockResolvedValueOnce({ rows: [{ require_work_email: true }] });

    const res = await request(app).post('/api/referrals/rr-1/referrers')
      .set(authHeader(token)).send({ name: 'Jane', email: 'jane@gmail.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/work email/i);
  });

  it('returns 400 if name or email missing', async () => {
    const res = await request(app).post('/api/referrals/rr-1/referrers')
      .set(authHeader(token)).send({ name: 'Jane' });
    expect(res.status).toBe(400);
  });
});
