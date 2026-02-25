'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Blog } from '@/lib/types';
import { useLikeBlog } from '@/hooks/use-like-blog';

interface LikeButtonProps {
    blog: Blog;
    variant?: 'default' | 'large';
}

export function LikeButton({ blog, variant = 'default' }: LikeButtonProps) {
    const likeMutation = useLikeBlog(blog);

    const isLarge = variant === 'large';

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                likeMutation.mutate();
            }}
            className={cn(
                "flex items-center gap-2 transition-colors rounded-full transition-all active:scale-90",
                blog.likedByMe
                    ? "text-like bg-like/10"
                    : "text-neutral-500 hover:text-like hover:bg-neutral-900",
                isLarge ? "p-2.5" : "p-2"
            )}
        >
            <Heart
                className={cn(
                    "transition-all duration-300",
                    isLarge ? "w-5 h-5" : "w-4 h-4",
                    blog.likedByMe ? "scale-110" : ""
                )}
                fill={blog.likedByMe ? "currentColor" : "none"}
                stroke="currentColor"
            />
            <span className={cn("font-bold", isLarge ? "text-sm" : "text-xs")}>
                {blog._count.likes}
            </span>
        </button>
    );
}
