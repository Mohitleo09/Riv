import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Throttle } from '@nestjs/throttler';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
    };
}

@Controller()
export class BlogsController {
    constructor(private readonly blogsService: BlogsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('blogs/me')
    findMyBlogs(@Request() req: AuthenticatedRequest) {
        return this.blogsService.findManyByUserId(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('blogs/:id')
    async getOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        const blog = await this.blogsService.findOneById(id);
        if (!blog) throw new NotFoundException('Blog not found');
        if (blog.userId !== req.user.id) throw new ForbiddenException('You do not own this blog');
        return blog;
    }

    // Private Routes
    @UseGuards(JwtAuthGuard)
    @Post('blogs')
    create(@Body() createBlogDto: CreateBlogDto, @Request() req: AuthenticatedRequest) {
        return this.blogsService.create(req.user.id, createBlogDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('blogs/:id')
    update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto, @Request() req: AuthenticatedRequest) {
        return this.blogsService.update(id, req.user.id, updateBlogDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('blogs/:id')
    remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.remove(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('blogs/:id/like')
    like(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.likeBlog(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('blogs/:id/like')
    unlike(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.unlikeBlog(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('blogs/:id/comments')
    addComment(
        @Param('id') id: string,
        @Body() createCommentDto: CreateCommentDto,
        @Request() req: AuthenticatedRequest
    ) {
        return this.blogsService.addComment(id, req.user.id, createCommentDto.content);
    }

    // Public Routes
    @Throttle({ default: { limit: 60, ttl: 60000 } })
    @UseGuards(OptionalJwtGuard)
    @Get('public/blogs/:slug')
    findOne(@Param('slug') slug: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.findPublicBySlug(slug, req.user?.id);
    }

    @Throttle({ default: { limit: 30, ttl: 60000 } })
    @UseGuards(OptionalJwtGuard)
    @Get('public/feed')
    getFeed(
        @Request() req: AuthenticatedRequest,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.blogsService.getFeed(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            req.user?.id
        );
    }

    @UseGuards(OptionalJwtGuard)
    @Get('blogs/:id/comments')
    getComments(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.getComments(id, req.user?.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('comments/:id/like')
    likeComment(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.likeComment(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('comments/:id/like')
    unlikeComment(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.blogsService.unlikeComment(id, req.user.id);
    }
}
