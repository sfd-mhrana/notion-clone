import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export type AIAction =
  | 'write'
  | 'summarize'
  | 'expand'
  | 'improve'
  | 'fix_grammar'
  | 'translate'
  | 'explain'
  | 'brainstorm';

interface AIRequest {
  action: AIAction;
  content: string;
  context?: string;
  language?: string;
}

interface AIResponse {
  result: string;
  tokensUsed: number;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly client: Anthropic | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set - AI features disabled');
    }
  }

  async process(request: AIRequest): Promise<AIResponse> {
    if (!this.client) {
      throw new BadRequestException('AI service not configured');
    }

    const prompt = this.buildPrompt(request);
    this.logger.debug(`Processing AI request: ${request.action}`);

    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textBlock = message.content.find((block: { type: string }) => block.type === 'text');
      const result = textBlock && 'text' in textBlock ? textBlock.text : '';

      return {
        result,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      };
    } catch (error) {
      this.logger.error('AI request failed:', error);
      throw new BadRequestException('AI processing failed');
    }
  }

  async write(topic: string, context?: string): Promise<AIResponse> {
    return this.process({ action: 'write', content: topic, context });
  }

  async summarize(content: string): Promise<AIResponse> {
    return this.process({ action: 'summarize', content });
  }

  async expand(content: string): Promise<AIResponse> {
    return this.process({ action: 'expand', content });
  }

  async improve(content: string): Promise<AIResponse> {
    return this.process({ action: 'improve', content });
  }

  async fixGrammar(content: string): Promise<AIResponse> {
    return this.process({ action: 'fix_grammar', content });
  }

  async translate(content: string, targetLanguage: string): Promise<AIResponse> {
    return this.process({ action: 'translate', content, language: targetLanguage });
  }

  async explain(content: string): Promise<AIResponse> {
    return this.process({ action: 'explain', content });
  }

  async brainstorm(topic: string): Promise<AIResponse> {
    return this.process({ action: 'brainstorm', content: topic });
  }

  private buildPrompt(request: AIRequest): string {
    switch (request.action) {
      case 'write':
        return `Write content about the following topic. ${request.context ? `Context: ${request.context}` : ''}\n\nTopic: ${request.content}\n\nProvide well-structured, engaging content.`;

      case 'summarize':
        return `Summarize the following text concisely while keeping the key points:\n\n${request.content}`;

      case 'expand':
        return `Expand on the following text with more details, examples, and explanations:\n\n${request.content}`;

      case 'improve':
        return `Improve the following text to make it clearer, more engaging, and better structured. Maintain the original meaning:\n\n${request.content}`;

      case 'fix_grammar':
        return `Fix any grammar, spelling, and punctuation errors in the following text. Only make necessary corrections:\n\n${request.content}`;

      case 'translate':
        return `Translate the following text to ${request.language}. Maintain the original meaning and tone:\n\n${request.content}`;

      case 'explain':
        return `Explain the following text or concept in simple terms:\n\n${request.content}`;

      case 'brainstorm':
        return `Generate creative ideas and suggestions about the following topic. Provide a diverse list of 5-10 ideas:\n\nTopic: ${request.content}`;

      default:
        return request.content;
    }
  }
}
