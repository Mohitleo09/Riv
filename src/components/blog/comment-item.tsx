'use client';

import { formatDistanceToNow } from 'date-fns';
import { Comment } from '@/lib/types';
import { CommentLikeButton } from './comment-like-button';

interface CommentItemProps {
    comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
    return (
        <div className="py-4 flex gap-3 group">
            <div className="w-10 h-10 rounded-full bg-neutral-900 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-neutral-500 ring-1 ring-neutral-800">
                {comment.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm mb-1">
                    <span className="font-bold text-white hover:underline cursor-pointer">
                        {comment.user.email.split('@')[0]}
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-500">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-neutral-200 text-[15px] leading-normal">
                    {comment.content}
                </p>
                <div className="flex items-center gap-8 mt-2 text-neutral-500">
                    <CommentLikeButton comment={comment} />
                </div>
            </div>
        </div>
    );
}
