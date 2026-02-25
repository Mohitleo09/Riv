'use client';

import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share2, MoreHorizontal, Send } from 'lucide-react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/icon-button';
import { Blog, Comment } from '@/lib/types';
import { LikeButton } from './like-button';
import { CommentItem } from './comment-item';
import { BlurImage } from '@/components/ui/blur-image';
import { calculateReadingTime } from '@/lib/utils';

interface BlogCardProps {
    blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: comments } = useQuery({
        queryKey: ['comments', blog.id],
        queryFn: () => blogApi.getComments(blog.id).then(res => res.data),
        enabled: showComments,
    });

    const commentMutation = useMutation({
        mutationFn: (content: string) => blogApi.addComment(blog.id, content),
        onSuccess: () => {
            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['comments', blog.id] });
        },
    });

    const handleComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || commentMutation.isPending) return;
        commentMutation.mutate(commentText);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `${window.location.origin}/blog/${blog.slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="py-6 border-b border-neutral-900 group">
            <div className="flex gap-4">
                {/* Avatar Placeholder */}
                <div className="w-10 h-10 rounded-full bg-neutral-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-neutral-500">
                    {blog.user?.email?.[0].toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-bold text-white hover:underline cursor-pointer">
                                {blog.user?.email?.split('@')[0] || 'User'}
                            </span>
                            <span className="text-neutral-500">·</span>
                            <span className="text-neutral-500">
                                {format(new Date(blog.createdAt), 'MMM d')}
                            </span>
                            <span className="text-neutral-500">·</span>
                            <span className="text-neutral-600 font-medium">
                                {calculateReadingTime(blog.content)} min read
                            </span>
                        </div>
                        <IconButton icon={<MoreHorizontal className="w-4 h-4" />} className="p-1" />
                    </div>

                    {/* Content */}
                    <Link href={`/blog/${blog.slug}`} className="block mb-3">
                        <h2 className="text-[17px] font-bold text-white mb-1.5 leading-tight">
                            {blog.title}
                        </h2>
                        <p className="text-neutral-400 text-[15px] leading-normal line-clamp-3">
                            {blog.summary || blog.content}
                        </p>
                        {blog.imageUrl && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-neutral-900 bg-neutral-950">
                                <BlurImage
                                    src={blog.imageUrl}
                                    className="max-h-[500px]"
                                />
                            </div>
                        )}
                    </Link>

                    {/* Interaction Row */}
                    <div className="flex items-center justify-between max-w-sm text-neutral-500">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 hover:text-white transition-colors group/icon"
                        >
                            <div className="p-2 rounded-full group-hover/icon:bg-neutral-950">
                                <MessageSquare className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-xs font-medium">{blog._count.comments}</span>
                        </button>

                        <LikeButton blog={blog} />

                        <button
                            onClick={handleShare}
                            className={cn("flex items-center gap-2 transition-colors group/icon px-2 py-1 rounded-md", copied ? "text-green-500 bg-green-500/5" : "hover:text-white")}
                        >
                            <div className="p-1 rounded-full group-hover/icon:bg-neutral-950">
                                <Share2 className="w-[18px] h-[18px]" />
                            </div>
                            {copied && <span className="text-[10px] font-bold uppercase tracking-wider">Copied</span>}
                        </button>
                    </div>

                    {/* Inline Comment Input */}
                    {showComments && (
                        <div className="mt-4 pt-4 border-t border-neutral-900/50">
                            {user ? (
                                <form onSubmit={handleComment} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-neutral-500">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Post your reply"
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            className="bg-transparent border-none text-sm text-white w-full outline-none placeholder:text-neutral-600"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || commentMutation.isPending}
                                            className="text-white disabled:opacity-30 p-1.5"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-xs text-neutral-500">
                                    <Link href="/login" className="text-white hover:underline">Log in</Link> to reply
                                </p>
                            )}

                            {comments && comments.length > 0 && (
                                <div className="mt-4 space-y-2 pt-4 border-t border-neutral-900/50">
                                    {comments.map((c: Comment) => (
                                        <CommentItem key={c.id} comment={c} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
