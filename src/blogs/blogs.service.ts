import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import slugify from 'slugify';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class BlogsService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('blog-tasks') private blogQueue: Queue,
    ) { }

    async create(userId: string, createBlogDto: CreateBlogDto) {
        const slug = await this.generateUniqueSlug(createBlogDto.title);

        const blog = await this.prisma.blog.create({
            data: {
                ...createBlogDto,
                slug,
                userId,
            } as any,
        });

        if (blog.isPublished) {
            try {
                await this.blogQueue.add('generate-summary', { blogId: blog.id });
            } catch (error) {
                console.error('Failed to add blog task to queue:', error);
                // We don't throw here so the user still sees a success message
            }
        }

        return blog;
    }

    async update(id: string, userId: string, updateBlogDto: UpdateBlogDto) {
        const blog = await this.prisma.blog.findUnique({ where: { id } });

        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        if (blog.userId !== userId) {
            throw new ForbiddenException('You do not own this blog');
        }

        const updatedBlog = await this.prisma.blog.update({
            where: { id },
            data: updateBlogDto as any,
        });

        if (updateBlogDto.isPublished === true && !blog.isPublished) {
            try {
                await this.blogQueue.add('generate-summary', { blogId: blog.id });
            } catch (error) {
                console.error('Failed to add blog task to queue during update:', error);
            }
        }

        return updatedBlog;
    }

    async remove(id: string, userId: string) {
        const blog = await this.prisma.blog.findUnique({ where: { id } });

        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        if (blog.userId !== userId) {
            throw new ForbiddenException('You do not own this blog');
        }

        return this.prisma.blog.delete({ where: { id } });
    }

    async findPublicBySlug(slug: string, userId?: string) {
        const blog = await this.prisma.blog.findUnique({
            where: { slug, isPublished: true },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                likes: userId ? {
                    where: { userId },
                    select: { id: true }
                } : false,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            } as any,
        });

        if (!blog) {
            throw new NotFoundException('Blog not found');
        }

        return {
            ...blog,
            likedByMe: userId ? (blog as any).likes?.length > 0 : false,
            likes: undefined,
        };
    }

    async getFeed(page = 1, limit = 10, userId?: string, search?: string) {
        const skip = (page - 1) * limit;

        const where: any = { isPublished: true };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [blogs, total] = await Promise.all([
            this.prisma.blog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    content: true,
                    summary: true,
                    imageUrl: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    likes: userId ? {
                        where: { userId },
                        select: { id: true }
                    } : false,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
            } as any),
            this.prisma.blog.count({ where }),
        ]);

        const data = blogs.map(blog => ({
            ...blog,
            likedByMe: userId ? (blog as any).likes?.length > 0 : false,
            likes: undefined,
        }));

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOneById(id: string) {
        return this.prisma.blog.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, email: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    async findManyByUserId(userId: string) {
        return this.prisma.blog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, email: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
    }

    async likeBlog(blogId: string, userId: string) {
        await this.prisma.like.upsert({
            where: {
                userId_blogId: {
                    userId,
                    blogId,
                },
            },
            update: {},
            create: {
                userId,
                blogId,
            },
        });

        const count = await this.prisma.like.count({ where: { blogId } });
        return { likes: count };
    }

    async unlikeBlog(blogId: string, userId: string) {
        const like = await this.prisma.like.findUnique({
            where: {
                userId_blogId: {
                    userId,
                    blogId,
                },
            },
        });

        if (!like) {
            throw new NotFoundException('Like not found');
        }

        await this.prisma.like.delete({
            where: { id: like.id },
        });

        const count = await this.prisma.like.count({ where: { blogId } });
        return { likes: count };
    }

    async addComment(blogId: string, userId: string, content: string) {
        const comment = await this.prisma.comment.create({
            data: {
                blogId,
                userId,
                content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });

        return {
            ...comment,
            likedByMe: false,
            _count: {
                likes: 0,
            },
        };
    }

    async getComments(blogId: string, userId?: string) {
        const comments = await this.prisma.comment.findMany({
            where: { blogId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, email: true },
                },
                commentLikes: userId ? {
                    where: { userId },
                    select: { id: true }
                } : undefined,
                _count: {
                    select: { commentLikes: true },
                },
            } as any,
        });

        return (comments as any[]).map(c => ({
            ...c,
            likedByMe: userId ? c.commentLikes?.length > 0 : false,
            _count: {
                likes: c._count.commentLikes
            },
            commentLikes: undefined,
        }));
    }

    async likeComment(commentId: string, userId: string) {
        await (this.prisma as any).commentLike.upsert({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
            update: {},
            create: {
                userId,
                commentId,
            },
        });

        const count = await (this.prisma as any).commentLike.count({ where: { commentId } });
        return { likes: count };
    }

    async unlikeComment(commentId: string, userId: string) {
        const like = await (this.prisma as any).commentLike.findUnique({
            where: {
                userId_commentId: {
                    userId,
                    commentId,
                },
            },
        });

        if (!like) {
            throw new NotFoundException('Like not found');
        }

        await (this.prisma as any).commentLike.delete({
            where: { id: like.id },
        });

        const count = await (this.prisma as any).commentLike.count({ where: { commentId } });
        return { likes: count };
    }

    private async generateUniqueSlug(title: string): Promise<string> {
        const baseSlug = slugify(title, { lower: true, strict: true });
        let slug = baseSlug;
        let count = 1;

        while (await this.prisma.blog.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${count}`;
            count++;
        }

        return slug;
    }
}
