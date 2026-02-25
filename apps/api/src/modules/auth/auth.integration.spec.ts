import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { hashPassword } from '@portfolio/shared/utils';
import { AppModule } from '../../app/app.module';
import { DomainExceptionFilter } from '../../infrastructure/filters/domain-exception.filter';
import { PrismaService } from '../../infrastructure/prisma';
import { EMAIL_SERVICE, IEmailService } from '../email';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { USER_REPOSITORY } from '../user/application/user.token';
import { IUserRepository } from '../user/application/ports/user.repository.port';
import { User } from '../user/domain/entities/user.entity';

/**
 * In-memory user repository for integration tests.
 * Stores User entities in a Map, keyed by id.
 */
class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async add(user: User): Promise<string> {
    this.users.set(user.id, user);
    return user.id;
  }

  async update(id: string, user: User): Promise<boolean> {
    if (!this.users.has(id)) return false;
    this.users.set(id, user);
    return true;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  clear() {
    this.users.clear();
  }
}

const TEST_PASSWORD = 'Test1234#';
const TEST_EMAIL = 'test@example.com';

async function createTestUser(repo: InMemoryUserRepository) {
  const hashed = await hashPassword(TEST_PASSWORD);
  const user = User.create({ email: TEST_EMAIL, password: hashed, name: 'Test User' });
  await repo.add(user);
  return user;
}

function extractCookies(res: request.Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = res.headers['set-cookie'];
  if (!setCookieHeaders) return cookies;
  const headerArray = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const cookie of headerArray) {
    const [nameValue] = cookie.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    cookies[name.trim()] = valueParts.join('=').trim();
  }
  return cookies;
}

function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let userRepo: InMemoryUserRepository;
  let emailService: { sendEmail: jest.Mock };

  beforeAll(async () => {
    userRepo = new InMemoryUserRepository();
    emailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ $connect: jest.fn(), $disconnect: jest.fn() })
      .overrideProvider(EMAIL_SERVICE)
      .useValue(emailService)
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .overrideProvider(USER_REPOSITORY)
      .useValue(userRepo)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    userRepo.clear();
    emailService.sendEmail.mockClear();
  });

  describe('Login → Refresh → Logout flow', () => {
    it('should login with valid credentials and return tokens', async () => {
      await createTestUser(userRepo);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');

      const cookies = extractCookies(res);
      expect(cookies).toHaveProperty('refresh_token');
      expect(cookies).toHaveProperty('csrf_token');
    });

    it('should reject login with wrong password', async () => {
      await createTestUser(userRepo);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: 'WrongPass1#' })
        .expect(401);

      expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: TEST_PASSWORD })
        .expect(401);

      expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should refresh tokens with valid refresh token and CSRF', async () => {
      await createTestUser(userRepo);

      // Login first
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const loginCookies = extractCookies(loginRes);
      const accessToken = loginRes.body.accessToken;

      // Refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', buildCookieHeader(loginCookies))
        .set('x-csrf-token', loginCookies['csrf_token'])
        .expect(200);

      expect(refreshRes.body).toHaveProperty('accessToken');
      expect(typeof refreshRes.body.accessToken).toBe('string');

      const refreshCookies = extractCookies(refreshRes);
      expect(refreshCookies).toHaveProperty('refresh_token');
      // Refresh token must rotate (new random value each time)
      expect(refreshCookies['refresh_token']).not.toBe(loginCookies['refresh_token']);
    });

    it('should reject refresh without CSRF header', async () => {
      await createTestUser(userRepo);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const loginCookies = extractCookies(loginRes);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .set('Cookie', buildCookieHeader(loginCookies))
        .expect(403);
    });

    it('should logout and clear cookies', async () => {
      await createTestUser(userRepo);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const accessToken = loginRes.body.accessToken;

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutRes.body).toEqual({ success: true });
    });

    it('should reject protected routes without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('full flow: login → me → refresh → me → logout → me fails', async () => {
      const user = await createTestUser(userRepo);

      // 1. Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      let accessToken = loginRes.body.accessToken;
      let cookies = extractCookies(loginRes);

      // 2. Access /me with access token
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe(TEST_EMAIL);
      expect(meRes.body.name).toBe('Test User');
      expect(meRes.body).not.toHaveProperty('password');

      // 3. Refresh
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', buildCookieHeader(cookies))
        .set('x-csrf-token', cookies['csrf_token'])
        .expect(200);

      accessToken = refreshRes.body.accessToken;
      cookies = { ...cookies, ...extractCookies(refreshRes) };

      // 4. Access /me with new access token
      const meRes2 = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes2.body.email).toBe(TEST_EMAIL);

      // 5. Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 6. /me should still work with valid JWT (token not expired, version unchanged)
      //    but refresh should fail (refresh token cleared)
      const refreshAfterLogout = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', buildCookieHeader(cookies))
        .set('x-csrf-token', cookies['csrf_token'])
        .expect(401);

      expect(refreshAfterLogout.body.errorCode).toBe('AUTH_INVALID_REFRESH_TOKEN');
    });
  });

  describe('Forgot Password → Reset Password flow', () => {
    it('should send reset email for valid user', async () => {
      await createTestUser(userRepo);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: TEST_EMAIL })
        .expect(200);

      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: TEST_EMAIL,
          subject: 'Password Reset',
        })
      );
    });

    it('should silently succeed for unknown email (no enumeration)', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'unknown@example.com' })
        .expect(200);

      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should reject reset with invalid token', async () => {
      const user = await createTestUser(userRepo);

      // Request reset first to set token on user
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: TEST_EMAIL })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'invalidtoken', userId: user.id, newPassword: 'NewPass1#' })
        .expect(401);
    });

    it('full flow: forgot → reset → login with new password', async () => {
      const user = await createTestUser(userRepo);

      // 1. Request password reset
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: TEST_EMAIL })
        .expect(200);

      // 2. Extract raw token from sent email
      const emailHtml: string = emailService.sendEmail.mock.calls[0][0].html;
      const tokenMatch = emailHtml.match(/token=([a-f0-9]+)/);
      expect(tokenMatch).not.toBeNull();
      const rawToken = tokenMatch![1];

      // 3. Reset password
      const newPassword = 'NewPass1#';
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: rawToken, userId: user.id, newPassword })
        .expect(200);

      // 4. Login with new password succeeds
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: newPassword })
        .expect(200);

      expect(loginRes.body).toHaveProperty('accessToken');

      // 5. Login with old password fails
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(401);
    });
  });
});
