const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { mockDbClient } = require('../helpers');

jest.mock('../../src/db');
jest.mock('../../src/services/llm', () => ({
  generateReport: jest.fn().mockResolvedValue({}),
}));

const { generateReport } = require('../../src/services/llm');

const VALID_TOKEN = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const INVALID_TOKEN = 'not-a-uuid';

describe('GET /api/referrers/:token', () => {
  it('returns referrer form data for valid token', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'ref-1', name: 'John', token: VALID_TOKEN, target_role: 'Engineer', submitted_at: null }],
    });

    const res = await request(app).get(`/api/referrers/${VALID_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('John');
  });

  it('returns 404 for malformed UUID token', async () => {
    const res = await request(app).get(`/api/referrers/${INVALID_TOKEN}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/invalid or expired/i);
  });

  it('returns 404 for tampered UUID that looks valid but doesnt exist', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app).get(`/api/referrers/${VALID_TOKEN}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 if already submitted', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'ref-1', submitted_at: new Date().toISOString() }],
    });
    const res = await request(app).get(`/api/referrers/${VALID_TOKEN}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already submitted/i);
  });
});

describe('POST /api/referrers/:token/submit', () => {
  const answers = Array.from({ length: 10 }, (_, i) => ({
    questionNumber: i + 1,
    answerText: `Answer ${i + 1}`,
    rating: i < 4 ? 4 : null,
  }));

  it('submits answers and triggers report generation', async () => {
    const client = mockDbClient([
      { rows: [{ id: 'ref-1', referral_request_id: 'rr-1' }] }, // find referrer
      { rows: [] },                                               // BEGIN
      ...Array(10).fill({ rows: [] }),                           // INSERT responses
      { rows: [] },                                               // UPDATE submitted_at
      { rows: [] },                                               // COMMIT
      { rows: [{ count: '0' }] },                                // pending count
      { rows: [] },                                               // UPDATE rr status
    ]);
    db.connect = jest.fn().mockResolvedValue(client);

    const res = await request(app).post(`/api/referrers/${VALID_TOKEN}/submit`)
      .send({ answers });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(generateReport).toHaveBeenCalledWith('ref-1');
  });

  it('returns 404 for malformed token', async () => {
    const res = await request(app).post(`/api/referrers/${INVALID_TOKEN}/submit`)
      .send({ answers });
    expect(res.status).toBe(404);
  });

  it('returns 400 for already submitted or expired token', async () => {
    const client = mockDbClient([{ rows: [] }]);
    db.connect = jest.fn().mockResolvedValue(client);

    const res = await request(app).post(`/api/referrers/${VALID_TOKEN}/submit`)
      .send({ answers });
    expect(res.status).toBe(400);
  });
});
