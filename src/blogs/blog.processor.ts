import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('blog-tasks')
export class BlogProcessor extends WorkerHost {
    private readonly logger = new Logger(BlogProcessor.name);

    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        switch (job.name) {
            case 'generate-summary': {
                const { blogId } = job.data;
                this.logger.log({ blogId, msg: 'Generating summary for blog' });

                const blog = await this.prisma.blog.findUnique({ where: { id: blogId } });
                if (!blog) {
                    this.logger.warn({ blogId, msg: 'Blog not found during summary generation' });
                    return;
                }

                // Smarter summary: remove extra whitespace and newlines, then truncate
                const cleanContent = blog.content
                    .replace(/\s+/g, ' ')
                    .trim();

                const summary = cleanContent.length > 160
                    ? cleanContent.substring(0, 157) + '...'
                    : cleanContent;

                await this.prisma.blog.update({
                    where: { id: blogId },
                    data: { summary },
                });

                this.logger.log({ blogId, msg: 'Summary generated successfully' });
                return { summary };
            }
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }
}
