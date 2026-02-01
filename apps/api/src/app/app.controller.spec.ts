import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    // Arrange: Create testing module with mocked service
    const mockService = {
      getData: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('should return data from service', () => {
      // Arrange
      const expectedData = { message: 'Hello API' };
      jest.spyOn(service, 'getData').mockReturnValue(expectedData);

      // Act
      const result = controller.getData();

      // Assert
      expect(result).toEqual(expectedData);
      expect(service.getData).toHaveBeenCalledTimes(1);
    });

    it('should call service getData method', () => {
      // Arrange
      const mockData = { message: 'Test Message' };
      jest.spyOn(service, 'getData').mockReturnValue(mockData);

      // Act
      controller.getData();

      // Assert
      expect(service.getData).toHaveBeenCalled();
    });

    it('should return the exact response from service without modification', () => {
      // Arrange
      const serviceResponse = { message: 'Original Response' };
      jest.spyOn(service, 'getData').mockReturnValue(serviceResponse);

      // Act
      const result = controller.getData();

      // Assert
      expect(result).toBe(serviceResponse);
    });
  });
});
