import {Controller, Get} from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('get')
  async getContent() {
    const content = await this.contentService.getContent();

    if(!content) {
      throw new Error('An error occurred while fetching content');
    }

    return content;
  }
}
