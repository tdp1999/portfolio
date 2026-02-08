import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';

describe('AppController Integration Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Arrange: Create full application module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
