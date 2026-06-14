const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const bcrypt = require('bcryptjs');

jest.mock('../../src/db');
jest.mock('bcryptjs');

describe('POST /api/auth/register', () => {
  const validBody = {
    name: 'Jane Smith', email: 'jane@company.com',
    password: 'password123', role: 'employer',
    company: 'Acme', termsAccepted: true,
  };

  beforeEach(() => {
    bcrypt.hash = jest.fn().mockResolvedValue('hashed_password');
  });

  it('registers a new user and returns a token', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 'uuid-1', email: 'jane@company.com', name: 'Jane Smith', role: 'employer', is_admin: false }],
    });

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('jane@company.com');
  });

  it('returns 400 if terms not accepted', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ ...validBody, termsAccepted: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/terms/i);
  });

  it('returns 400 on duplicate email', async () => {
    db.query.mockRejectedValue({ code: '23505' });

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already in use/i);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 'uuid-1', email: 'jane@company.com', name: 'Jane Smith', role: 'employer', password_hash: 'hashed', is_admin: false }],
    });
    bcrypt.compare = jest.fn().mockResolvedValue(true);

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'jane@company.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('returns 401 for wrong password', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 'uuid-1', password_hash: 'hashed' }],
    });
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'jane@company.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@company.com', password: 'password123' });

    expect(res.status).toBe(401);
  });
});
