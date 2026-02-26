import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIController } from './ai.controller.js';
import { AIService } from './ai.service.js';

@Module({
  imports: [ConfigModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
