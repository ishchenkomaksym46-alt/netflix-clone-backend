import {Inject, Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma.service";

@Injectable()
export class ContentService {
    constructor(private readonly prisma: PrismaService) {}

    async getContent() {
        try {
            const content = await this.prisma.content.findMany();

            if(!content) {
                return { status: 404, message: 'No content found' };
            }

            return {status: 200, content };
        } catch (e) {
            console.error('Error fetching content:', e);
            throw new Error('An error occurred while fetching content');
        }
    }
}
