const referrer = { name: 'John Doe', email: 'john@company.com', token: 'tok-uuid-123' };
const referralRequest = { candidate_name: 'Alex Chen', target_role: 'Engineer' };
const requester = { name: 'HR Manager' };

describe('sendReferrerInvite — dev mode (no API key)', () => {
  let sendReferrerInvite;

  beforeAll(() => {
    jest.isolateModules(() => {
      delete process.env.RESEND_API_KEY;
      ({ sendReferrerInvite } = require('../../src/services/email'));
    });
  });

  afterAll(() => {
    process.env.RESEND_API_KEY = 'test_resend_key';
  });

  it('logs invite URL to console without throwing', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(sendReferrerInvite(referrer, referralRequest, requester)).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DEV]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('tok-uuid-123'));

    consoleSpy.mockRestore();
  });
});

describe('sendReferrerInvite — prod mode', () => {
  let sendReferrerInvite;
  let mockSend;

  beforeAll(() => {
    mockSend = jest.fn();
    jest.isolateModules(() => {
      process.env.RESEND_API_KEY = 're_test_key_123';
      jest.doMock('resend', () => ({
        Resend: jest.fn().mockImplementation(() => ({
          emails: { send: mockSend },
        })),
      }));
      ({ sendReferrerInvite } = require('../../src/services/email'));
    });
  });

  it('calls Resend with correct to address and subject', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-id-1' }, error: null });

    await sendReferrerInvite(referrer, referralRequest, requester);

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'john@company.com',
      subject: expect.stringContaining('Alex Chen'),
    }));
  });

  it('throws if Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'API limit reached' } });

    await expect(sendReferrerInvite(referrer, referralRequest, requester))
      .rejects.toThrow('API limit reached');
  });
});
