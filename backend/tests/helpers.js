const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

function makeToken(overrides = {}) {
  return jwt.sign(
    { id: 'user-uuid-123', role: 'employer', name: 'Test Employer', is_admin: false, ...overrides },
    SECRET,
    { expiresIn: '1h' }
  );
}

function makeAdminToken() {
  return makeToken({ id: 'admin-uuid-999', role: 'employer', is_admin: true, name: 'Admin' });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Reusable mock DB client for transaction tests
function mockDbClient(queryResponses = []) {
  let callIndex = 0;
  return {
    query: jest.fn(() => Promise.resolve(queryResponses[callIndex++] || { rows: [] })),
    release: jest.fn(),
  };
}

module.exports = { makeToken, makeAdminToken, authHeader, mockDbClient };
