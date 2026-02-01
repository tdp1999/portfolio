import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    // Arrange: Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return a message object', () => {
      // Act
      const result = service.getData();

      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveProperty('message');
    });

    it('should return "Hello API" message', () => {
      // Act
      const result = service.getData();

      // Assert
      expect(result).toEqual({ message: 'Hello API' });
    });

    it('should return a string message', () => {
      // Act
      const result = service.getData();

      // Assert
      expect(typeof result.message).toBe('string');
    });

    it('should return the same result on multiple calls', () => {
      // Act
      const result1 = service.getData();
      const result2 = service.getData();

      // Assert
      expect(result1).toEqual(result2);
      expect(result1.message).toBe('Hello API');
      expect(result2.message).toBe('Hello API');
    });

    it('should not return null or undefined', () => {
      // Act
      const result = service.getData();

      // Assert
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
      expect(result.message).not.toBeNull();
      expect(result.message).not.toBeUndefined();
    });
  });
});
