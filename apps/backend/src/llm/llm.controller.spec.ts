import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller.js';
import { LlmService } from './llm.service.js';

describe('LlmController', () => {
  let controller: LlmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [LlmService],
    }).compile();

    controller = module.get<LlmController>(LlmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
