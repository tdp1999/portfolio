import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from '../infrastructure/prisma';
import { EMAIL_SERVICE } from '../modules/email';
import { GoogleStrategy } from '../modules/auth/infrastructure/strategies/google.strategy';

describe('AppController Integration Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Arrange: Create full application module with mocked PrismaService
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(EMAIL_SERVICE)
      .useValue({
        sendEmail: jest.fn(),
      })
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('should return 200 status code', async () => {
      // Act & Assert
      return request(app.getHttpServer()).get('/').expect(200);
    });

    it('should return JSON response', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/').expect('Content-Type', /json/);

      // Assert
      expect(response.body).toBeDefined();
    });

    it('should return message object with correct structure', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/').expect(200);

      // Assert
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('should return "Hello API" message', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/').expect(200);

      // Assert
      expect(response.body).toEqual({ message: 'Hello API' });
    });

    it('should return consistent response on multiple requests', async () => {
      // Act
      const response1 = await request(app.getHttpServer()).get('/');
      const response2 = await request(app.getHttpServer()).get('/');

      // Assert
      expect(response1.body).toEqual(response2.body);
      expect(response1.body.message).toBe('Hello API');
      expect(response2.body.message).toBe('Hello API');
    });
  });

  describe('CQRS Integration', () => {
    it('should make CommandBus injectable', async () => {
      const commandBus = app.get(CommandBus);
      expect(commandBus).toBeDefined();
    });

    it('should make QueryBus injectable', async () => {
      const queryBus = app.get(QueryBus);
      expect(queryBus).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    let corsApp: INestApplication;

    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({
          $connect: jest.fn(),
          $disconnect: jest.fn(),
        })
        .overrideProvider(EMAIL_SERVICE)
        .useValue({
          sendEmail: jest.fn(),
        })
        .overrideProvider(GoogleStrategy)
        .useValue({})
        .compile();

      corsApp = moduleFixture.createNestApplication();
      corsApp.enableCors({
        origin: ['http://localhost:4200', 'http://localhost:4300'],
        credentials: true,
      });
      await corsApp.init();
    });

    afterEach(async () => {
      await corsApp.close();
    });

    it('should include CORS headers for allowed origin', async () => {
      const response = await request(corsApp.getHttpServer())
        .get('/')
        .set('Origin', 'http://localhost:4300');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4300');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should not include CORS headers for disallowed origin', async () => {
      const response = await request(corsApp.getHttpServer())
        .get('/')
        .set('Origin', 'http://evil.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle preflight OPTIONS request', async () => {
      const response = await request(corsApp.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:4300')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4300');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Integration: Controller + Service', () => {
    it('should properly wire controller and service together', async () => {
      // Arrange & Act
      const response = await request(app.getHttpServer()).get('/');

      // Assert: Verify the full integration works
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Hello API' });
    });

    it('should handle service response correctly through controller', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/');

      // Assert: Verify data flows correctly from service through controller
      expect(response.body.message).toBe('Hello API');
      expect(response.type).toBe('application/json');
    });
  });
});
