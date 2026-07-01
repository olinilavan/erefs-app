const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { makeToken, authHeader } = require('../helpers');

jest.mock('../../src/db');
jest.mock('../../src/services/email', () => ({
  sendEmployerContactRequest: jest.fn().mockResolvedValue(undefined),
  sendVendorLinkRequest: jest.fn().mockResolvedValue(undefined),
  sendVendorLinkApproved: jest.fn().mockResolvedValue(undefined),
  sendVendorLinkDeclined: jest.fn().mockResolvedValue(undefined),
  sendVendorLinkRevoked: jest.fn().mockResolvedValue(undefined),
  sendVendorSubmissionNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/services/resumeParser', () => ({
  parseResumeFile: jest.fn(),
}));

const {
  sendVendorLinkRequest, sendVendorLinkApproved, sendVendorLinkDeclined,
  sendVendorLinkRevoked, sendVendorSubmissionNotification,
} = require('../../src/services/email');

const buyerToken  = makeToken({ id: 'buyer-uuid', role: 'employer', name: 'Buyer Co' });
const vendorToken = makeToken({ id: 'vendor-uuid', role: 'employer', name: 'Vendor Co' });
const jobseekerToken = makeToken({ id: 'js-uuid', role: 'jobseeker' });

describe('GET /api/employer/vendors/directory', () => {
  it('lists other employers with link status', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'buyer-uuid', company: 'Buyer Co', link_status: null }],
    });
    const res = await request(app).get('/api/employer/vendors/directory').set(authHeader(vendorToken));
    expect(res.status).toBe(200);
    expect(res.body[0].company).toBe('Buyer Co');
  });

  it('blocks jobseekers', async () => {
    const res = await request(app).get('/api/employer/vendors/directory').set(authHeader(jobseekerToken));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/employer/vendors/request', () => {
  it('creates a pending link request', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'buyer-uuid' }] })                          // buyer check
      .mockResolvedValueOnce({ rows: [{ id: 'link-1', status: 'pending' }] })           // INSERT
      .mockResolvedValueOnce({ rows: [{ name: 'Buyer', email: 'b@co.com', company: 'Buyer Co' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendor', email: 'v@co.com', company: 'Vendor Co' }] });

    const res = await request(app).post('/api/employer/vendors/request')
      .set(authHeader(vendorToken)).send({ buyerEmployerId: 'buyer-uuid' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(sendVendorLinkRequest).toHaveBeenCalledTimes(1);
  });

  it('rejects linking to yourself', async () => {
    const res = await request(app).post('/api/employer/vendors/request')
      .set(authHeader(vendorToken)).send({ buyerEmployerId: 'vendor-uuid' });
    expect(res.status).toBe(400);
  });

  it('returns 404 if the target employer does not exist', async () => {
    db.query = jest.fn().mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/employer/vendors/request')
      .set(authHeader(vendorToken)).send({ buyerEmployerId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when a pending/approved request already exists', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'buyer-uuid' }] })
      .mockResolvedValueOnce({ rows: [] }); // ON CONFLICT WHERE guard blocked the update
    const res = await request(app).post('/api/employer/vendors/request')
      .set(authHeader(vendorToken)).send({ buyerEmployerId: 'buyer-uuid' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/employer/vendors/:id/approve', () => {
  it('approves a pending request addressed to me', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'link-1', vendor_employer_id: 'vendor-uuid', status: 'approved' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Buyer', email: 'b@co.com', company: 'Buyer Co' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendor', email: 'v@co.com', company: 'Vendor Co' }] });

    const res = await request(app).post('/api/employer/vendors/link-1/approve').set(authHeader(buyerToken));

    expect(res.status).toBe(200);
    expect(sendVendorLinkApproved).toHaveBeenCalledTimes(1);
  });

  it('404s when not mine or already actioned', async () => {
    db.query = jest.fn().mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/employer/vendors/link-1/approve').set(authHeader(buyerToken));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/employer/vendors/:id/decline', () => {
  it('declines a pending request', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'link-1', vendor_employer_id: 'vendor-uuid', status: 'declined' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Buyer', email: 'b@co.com', company: 'Buyer Co' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendor', email: 'v@co.com', company: 'Vendor Co' }] });

    const res = await request(app).post('/api/employer/vendors/link-1/decline').set(authHeader(buyerToken));

    expect(res.status).toBe(200);
    expect(sendVendorLinkDeclined).toHaveBeenCalledTimes(1);
  });
});

describe('DELETE /api/employer/vendors/links/:id', () => {
  it('revokes an active link from either side', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'link-1', buyer_employer_id: 'buyer-uuid', vendor_employer_id: 'vendor-uuid', status: 'revoked' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Buyer', email: 'b@co.com' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendor', email: 'v@co.com', company: 'Vendor Co' }] });

    const res = await request(app).delete('/api/employer/vendors/links/link-1').set(authHeader(buyerToken));

    expect(res.status).toBe(200);
    expect(sendVendorLinkRevoked).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/employer/vendors/jobs', () => {
  it('lists jobs from buyers where I am an approved vendor', async () => {
    db.query = jest.fn().mockResolvedValue({
      rows: [{ id: 'job-1', title: 'Engineer', company: 'Buyer Co', already_submitted: false }],
    });
    const res = await request(app).get('/api/employer/vendors/jobs').set(authHeader(vendorToken));
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Engineer');
  });
});

describe('POST /api/employer/vendors/jobs/:jobId/submissions', () => {
  it('submits a candidate to an approved job', async () => {
    db.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'job-1', title: 'Engineer', employer_id: 'buyer-uuid', buyer_name: 'Buyer', buyer_email: 'b@co.com', company: 'Buyer Co' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'sub-1', candidate_name: 'Alex Chen' }] })
      .mockResolvedValueOnce({ rows: [{ name: 'Vendor', email: 'v@co.com', company: 'Vendor Co' }] });

    const res = await request(app).post('/api/employer/vendors/jobs/job-1/submissions')
      .set(authHeader(vendorToken)).send({ candidateName: 'Alex Chen', candidateEmail: 'alex@candidate.com' });

    expect(res.status).toBe(200);
    expect(res.body.candidate_name).toBe('Alex Chen');
    expect(sendVendorSubmissionNotification).toHaveBeenCalledTimes(1);
  });

  it('404s when not an approved vendor for that job', async () => {
    db.query = jest.fn().mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/employer/vendors/jobs/job-1/submissions')
      .set(authHeader(vendorToken)).send({ candidateName: 'Alex Chen', candidateEmail: 'alex@candidate.com' });
    expect(res.status).toBe(404);
  });

  it('400s when required fields are missing', async () => {
    const res = await request(app).post('/api/employer/vendors/jobs/job-1/submissions')
      .set(authHeader(vendorToken)).send({});
    expect(res.status).toBe(400);
  });
});
