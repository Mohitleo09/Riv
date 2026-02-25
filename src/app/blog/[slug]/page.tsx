'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, MessageSquare, Share2, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { IconButton } from '@/components/ui/icon-button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Blog, Comment } from '@/lib/types';
import { LikeButton } from '@/components/blog/like-button';
import { CommentItem } from '@/components/blog/comment-item';

export default function BlogDetailPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [copied, setCopied] = useState(false);

    const { data: blog, isLoading } = useQuery({
        queryKey: ['blog', slug, user?.id],
        queryFn: () => blogApi.getBlogBySlug(slug).then(res => res.data),
    });

    const { data: comments } = useQuery({
        queryKey: ['comments', blog?.id],
        queryFn: () => blogApi.getComments(blog!.id).then(res => res.data),
        enabled: !!blog?.id,
    });


    const commentMutation = useMutation({
        mutationFn: (content: string) => {
            if (!blog) throw new Error('Blog not found');
            return blogApi.addComment(blog.id, content);
        },
        onSuccess: () => {
            setCommentText('');
            if (blog) {
                queryClient.invalidateQueries({ queryKey: ['comments', blog.id] });
                queryClient.invalidateQueries({ queryKey: ['blog', slug, user?.id] });
            }
        },
    });

    const handleComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || commentMutation.isPending) return;
        commentMutation.mutate(commentText);
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    if (!blog) return <div className="text-center py-20 text-neutral-500">Post not found.</div>;

    return (
        <div className="max-w-[600px] mx-auto border-x border-neutral-900 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-900 px-4 md:px-6 py-4 flex items-center gap-6 md:gap-8">
                <IconButton
                    icon={<ArrowLeft className="w-5 h-5" />}
                    onClick={() => router.back()}
                />
                <h1 className="text-xl font-bold">Post</h1>
            </header>

            <article className="p-4 md:p-6">
                {/* Author Info */}
                <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-neutral-500">
                        {blog.user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-white leading-tight">{blog.user.email.split('@')[0]}</p>
                        <p className="text-sm text-neutral-500">@{blog.user.email.split('@')[0].toLowerCase()}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-4">{blog.title}</h1>

                    {blog.imageUrl && (
                        <div className="mb-6 rounded-2xl overflow-hidden border border-neutral-900 bg-neutral-950">
                            <img src={blog.imageUrl} alt="" className="w-full h-auto object-cover max-h-[700px]" />
                        </div>
                    )}

                    <div className="text-[19px] text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {blog.content}
                    </div>
                </div>

                {/* Metadata */}
                <div className="py-4 border-y border-neutral-900 flex gap-4 text-sm font-medium text-neutral-500 mb-4">
                    <span>{format(new Date(blog.createdAt), 'h:mm a · MMM d, yyyy')}</span>
                </div>

                {/* Interaction Row */}
                <div className="flex items-center justify-around py-1 border-b border-neutral-900 mb-6">
                    <div className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors cursor-pointer p-2">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{blog._count.comments}</span>
                    </div>

                    <LikeButton blog={blog} variant="large" />

                    <button
                        onClick={handleShare}
                        className={cn("flex items-center gap-2 transition-colors p-2 rounded-md", copied ? "text-green-500 bg-green-500/5" : "text-neutral-500 hover:text-white")}
                    >
                        <Share2 className="w-5 h-5" />
                        {copied && <span className="text-[10px] font-bold uppercase tracking-wider">Copied</span>}
                    </button>
                </div>

                {/* Comment Input */}
                {user ? (
                    <form onSubmit={handleComment} className="flex gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-neutral-500">
                            {user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <textarea
                                placeholder="Post your reply"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                className="w-full bg-transparent border-none text-lg text-white outline-none resize-none placeholder:text-neutral-600 pt-2 min-h-[60px]"
                            />
                            <div className="flex justify-end pt-2 border-t border-neutral-900 mt-2">
                                <button
                                    type="submit"
                                    disabled={!commentText.trim() || commentMutation.isPending}
                                    className="bg-white text-black px-5 py-1.5 rounded-full text-sm font-bold disabled:opacity-50"
                                >
                                    {commentMutation.isPending ? 'Posting...' : 'Reply'}
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-4 bg-neutral-950 rounded-xl text-center mb-8 border border-neutral-900">
                        <p className="text-sm text-neutral-400">
                            <Link href="/login" className="text-white font-bold hover:underline">Log in</Link> to join the conversation.
                        </p>
                    </div>
                )}

                {/* Comments List */}
                <div className="divide-y divide-neutral-900">
                    {comments?.map((c: Comment) => (
                        <CommentItem key={c.id} comment={c} />
                    ))}
                </div>
            </article>
        </div>
    );
}
