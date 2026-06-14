const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, authHeader } = require('../helpers');

jest.mock('../../src/db');

const token = makeToken({ id: 'emp-uuid', role: 'employer' });
const jobseekerToken = makeToken({ id: 'js-uuid', role: 'jobseeker' });

describe('GET /api/employer/candidates', () => {
  it('returns active candidates by default', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'rr-1', candidate_name: 'Alex', status: 'pending', total_referrers: 2, completed_referrers: 1 }],
    });

    const res = await request(app).get('/api/employer/candidates').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body[0].candidate_name).toBe('Alex');
  });

  it('returns archived candidates when ?archived=true', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'rr-2', candidate_name: 'Bob', archived_at: new Date().toISOString() }],
    });

    const res = await request(app).get('/api/employer/candidates?archived=true').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body[0].candidate_name).toBe('Bob');
  });

  it('returns 403 for non-employer', async () => {
    const res = await request(app).get('/api/employer/candidates').set(authHeader(jobseekerToken));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/employer/candidates/:id/archive', () => {
  it('archives an active candidate', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [{ id: 'rr-1' }] });

    const res = await request(app).patch('/api/employer/candidates/rr-1/archive').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 if candidate not found or already archived', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).patch('/api/employer/candidates/bad-id/archive').set(authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/employer/candidates/:id/unarchive', () => {
  it('restores an archived candidate', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [{ id: 'rr-1' }] });

    const res = await request(app).patch('/api/employer/candidates/rr-1/unarchive').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 if candidate not found or not archived', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).patch('/api/employer/candidates/rr-1/unarchive').set(authHeader(token));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/employer/candidates/:id', () => {
  it('deletes an archived candidate', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [{ id: 'rr-1' }] });

    const res = await request(app).delete('/api/employer/candidates/rr-1').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 if candidate is not archived', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await request(app).delete('/api/employer/candidates/rr-1').set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/only archived/i);
  });

  it('returns 403 for non-employer', async () => {
    const res = await request(app).delete('/api/employer/candidates/rr-1').set(authHeader(jobseekerToken));
    expect(res.status).toBe(403);
  });
});
