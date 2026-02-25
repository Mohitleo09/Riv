'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment } from '@/lib/types';
import { useLikeComment } from '@/hooks/use-like-comment';

interface CommentLikeButtonProps {
    comment: Comment;
}

export function CommentLikeButton({ comment }: CommentLikeButtonProps) {
    const { mutate, isPending } = useLikeComment(comment, comment.blogId);

    return (
        <button
            onClick={() => mutate()}
            disabled={isPending}
            className={cn(
                "flex items-center gap-1 transition-all active:scale-95 group/like",
                comment.likedByMe
                    ? "text-rose-500"
                    : "text-neutral-600 hover:text-rose-500"
            )}
        >
            <div className={cn(
                "p-1.5 rounded-full transition-colors",
                comment.likedByMe ? "bg-rose-500/10" : "group-hover/like:bg-rose-500/5"
            )}>
                <Heart
                    className={cn(
                        "w-3.5 h-3.5 transition-all duration-300",
                        comment.likedByMe && "fill-current"
                    )}
                />
            </div>
            <span className="text-[11px] font-bold tracking-tight">
                {comment._count.likes}
            </span>
        </button>
    );
}
