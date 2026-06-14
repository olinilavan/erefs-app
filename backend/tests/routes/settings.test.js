const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, authHeader } = require('../helpers');

jest.mock('../../src/db');

const token = makeToken({ id: 'emp-uuid', role: 'employer' });

const mockSettings = {
  id: 'emp-uuid',
  email: 'emp@company.com',
  name: 'Test Employer',
  role: 'employer',
  company: 'Acme',
  headline: null,
  require_work_email: false,
  reminder_days: 7,
  wants_custom_questions: false,
  subscription_plan: 'beta',
  subscription_started_at: new Date().toISOString(),
  terms_accepted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

describe('GET /api/settings', () => {
  it('returns settings for authenticated user', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [mockSettings] });

    const res = await request(app).get('/api/settings').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('emp@company.com');
    expect(res.body).toHaveProperty('require_work_email');
    expect(res.body).toHaveProperty('wants_custom_questions');
    expect(res.body).toHaveProperty('terms_accepted_at');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  it('returns 404 if user not found', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/settings').set(authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/settings', () => {
  it('updates profile and preferences', async () => {
    const updated = { ...mockSettings, company: 'NewCo', require_work_email: true, wants_custom_questions: true };
    db.query = jest.fn().mockResolvedValue({ rows: [updated] });

    const res = await request(app).put('/api/settings')
      .set(authHeader(token))
      .send({ company: 'NewCo', require_work_email: true, wants_custom_questions: true });

    expect(res.status).toBe(200);
    expect(res.body.company).toBe('NewCo');
    expect(res.body.require_work_email).toBe(true);
    expect(res.body.wants_custom_questions).toBe(true);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/settings').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});
