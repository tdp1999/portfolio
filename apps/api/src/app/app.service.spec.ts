import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getData', () => {
    it('should return the expected message', () => {
      const result = service.getData();

      expect(result).toEqual({ message: 'Hello API' });
    });
  });
});
