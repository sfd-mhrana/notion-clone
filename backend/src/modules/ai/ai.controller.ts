import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service.js';
import type { AIAction } from './ai.service.js';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AIRequestDto {
  @ApiProperty({ enum: ['write', 'summarize', 'expand', 'improve', 'fix_grammar', 'translate', 'explain', 'brainstorm'] })
  @IsIn(['write', 'summarize', 'expand', 'improve', 'fix_grammar', 'translate', 'explain', 'brainstorm'])
  action!: AIAction;

  @ApiProperty({ description: 'Content to process' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({ description: 'Target language for translation' })
  @IsOptional()
  @IsString()
  language?: string;
}

class AIResponseDto {
  @ApiProperty()
  result!: string;

  @ApiProperty()
  tokensUsed!: number;
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('api/ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process AI request' })
  @ApiResponse({ status: 200, description: 'AI processing completed' })
  @ApiResponse({ status: 400, description: 'AI service not configured or request failed' })
  async process(@Body() dto: AIRequestDto): Promise<AIResponseDto> {
    return this.aiService.process({
      action: dto.action,
      content: dto.content,
      context: dto.context,
      language: dto.language,
    });
  }

  @Post('write')
  @ApiOperation({ summary: 'Generate content on a topic' })
  async write(
    @Body() dto: { topic: string; context?: string },
  ): Promise<AIResponseDto> {
    return this.aiService.write(dto.topic, dto.context);
  }

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize content' })
  async summarize(@Body() dto: { content: string }): Promise<AIResponseDto> {
    return this.aiService.summarize(dto.content);
  }

  @Post('expand')
  @ApiOperation({ summary: 'Expand on content' })
  async expand(@Body() dto: { content: string }): Promise<AIResponseDto> {
    return this.aiService.expand(dto.content);
  }

  @Post('improve')
  @ApiOperation({ summary: 'Improve writing' })
  async improve(@Body() dto: { content: string }): Promise<AIResponseDto> {
    return this.aiService.improve(dto.content);
  }

  @Post('fix-grammar')
  @ApiOperation({ summary: 'Fix grammar and spelling' })
  async fixGrammar(@Body() dto: { content: string }): Promise<AIResponseDto> {
    return this.aiService.fixGrammar(dto.content);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate content' })
  async translate(
    @Body() dto: { content: string; language: string },
  ): Promise<AIResponseDto> {
    return this.aiService.translate(dto.content, dto.language);
  }

  @Post('explain')
  @ApiOperation({ summary: 'Explain content' })
  async explain(@Body() dto: { content: string }): Promise<AIResponseDto> {
    return this.aiService.explain(dto.content);
  }

  @Post('brainstorm')
  @ApiOperation({ summary: 'Brainstorm ideas' })
  async brainstorm(@Body() dto: { topic: string }): Promise<AIResponseDto> {
    return this.aiService.brainstorm(dto.topic);
  }
}
