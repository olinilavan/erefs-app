const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, authHeader } = require('../helpers');

jest.mock('../../src/db');

const token = makeToken({ id: 'emp-uuid', role: 'employer' });

const sampleReport = {
  id: 'report-1',
  referrer_name: 'John',
  target_role: 'Engineer',
  requester_id: 'emp-uuid',
  share_token: 'share-token-abc',
  llm_output_json: { executiveSummary: 'Great candidate', scores: {}, confidenceScore: 90 },
  created_at: new Date().toISOString(),
};

describe('GET /api/reports/:id', () => {
  it('returns report for authenticated owner', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [sampleReport] });

    const res = await request(app).get('/api/reports/report-1').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.referrer_name).toBe('John');
    expect(res.body.llm_output_json.confidenceScore).toBe(90);
  });

  it('returns 404 for report belonging to another user', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/reports/report-1').set(authHeader(token));
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/reports/report-1');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/reports/share/:shareToken', () => {
  it('returns public report data without auth', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ llm_output_json: sampleReport.llm_output_json, referrer_name: 'John', target_role: 'Engineer', created_at: new Date().toISOString() }],
    });

    const res = await request(app).get('/api/reports/share/share-token-abc');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('llm_output_json');
    expect(res.body.referrer_name).toBe('John');
  });

  it('returns 404 for unknown share token', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/reports/share/bad-token');
    expect(res.status).toBe(404);
  });
});
