import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './search.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { SearchQueryDto, SearchResponseDto } from './dto/index.js';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search pages and blocks' })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  async search(
    @Query() dto: SearchQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<SearchResponseDto> {
    return this.searchService.search(dto, userId);
  }
}
