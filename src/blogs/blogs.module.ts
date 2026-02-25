import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { BlogProcessor } from './blog.processor';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'blog-tasks',
        }),
    ],
    controllers: [BlogsController],
    providers: [BlogsService, BlogProcessor],
})
export class BlogsModule { }
