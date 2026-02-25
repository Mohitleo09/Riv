'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import BlogCard from '@/components/blog/blog-card';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Blog } from '@/lib/types';
import { CreatePost } from '@/components/blog/create-post';

export default function FeedPage() {
    const { user } = useAuth();
    const observerTarget = useRef(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['feed', user?.id],
        queryFn: ({ pageParam = 1 }) => blogApi.getFeed(pageParam as number, 10).then(res => res.data),
        getNextPageParam: (lastPage) => {
            if (lastPage.meta.page < lastPage.meta.totalPages) {
                return lastPage.meta.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });

    useEffect(() => {
        const target = observerTarget.current;
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) {
                observer.unobserve(target);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const allBlogs = data?.pages.flatMap(page => page.data) || [];

    return (
        <div className="max-w-3xl mx-auto border-x border-neutral-900 min-h-screen">
            {/* Create Post Area */}
            <CreatePost />

            {/* Feed List */}
            <div className="divide-y divide-neutral-900">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 flex gap-4 border-b border-neutral-900">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-6 w-3/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                                <div className="flex justify-between pt-4">
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    allBlogs.map((blog: Blog) => (
                        <div key={blog.id} className="px-4 md:px-6">
                            <BlogCard blog={blog} />
                        </div>
                    ))
                )}
            </div>

            {allBlogs.length === 0 && (
                <div className="py-20 text-center px-4">
                    <p className="text-neutral-500">No posts yet. Be the first to share something.</p>
                </div>
            )}

            {/* Load More Trigger */}
            <div ref={observerTarget} className="py-10 flex justify-center min-h-[100px]">
                {isFetchingNextPage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                ) : hasNextPage ? (
                    <div className="h-4" />
                ) : allBlogs.length > 0 && (
                    <p className="text-neutral-600 text-sm font-medium">You've reached the end.</p>
                )}
            </div>
        </div>
    );
}


