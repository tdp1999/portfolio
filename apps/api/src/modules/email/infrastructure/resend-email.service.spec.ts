import { ResendEmailService } from './resend-email.service';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('ResendEmailService', () => {
  let service: ResendEmailService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: 'test-key',
      EMAIL_FROM: 'test@example.com',
      NODE_ENV: 'production',
    };
    service = new ResendEmailService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const emailOptions = {
    to: 'user@example.com',
    subject: 'Test Subject',
    html: '<p>Hello</p>',
  };

  it('should send email via Resend', async () => {
    mockSend.mockResolvedValue({ data: { id: '123' }, error: null });

    await service.sendEmail(emailOptions);

    expect(mockSend).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });
  });

  it('should throw when Resend returns an error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });

    await expect(service.sendEmail(emailOptions)).rejects.toThrow(
      'Email sending failed: Invalid API key'
    );
  });

  it('should log instead of sending in development mode', async () => {
    process.env['NODE_ENV'] = 'development';
    service = new ResendEmailService();

    await service.sendEmail(emailOptions);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('should throw if RESEND_API_KEY is missing in non-dev environment', () => {
    delete process.env['RESEND_API_KEY'];
    process.env['NODE_ENV'] = 'production';

    expect(() => new ResendEmailService()).toThrow(
      'RESEND_API_KEY environment variable is required'
    );
  });

  it('should allow missing RESEND_API_KEY in development mode', () => {
    delete process.env['RESEND_API_KEY'];
    process.env['NODE_ENV'] = 'development';

    expect(() => new ResendEmailService()).not.toThrow();
  });
});
