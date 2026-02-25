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
import { useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Search } from 'lucide-react';
import { TrendingTags } from '@/components/blog/trending-tags';

export default function FeedPage() {
    const { user } = useAuth();
    const observerTarget = useRef(null);

    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const effectiveSearch = activeTag || search;
    const debouncedSearch = useDebounce(effectiveSearch, 400);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['feed', user?.id, debouncedSearch],
        queryFn: ({ pageParam = 1 }) => blogApi.getFeed(pageParam as number, 10, debouncedSearch).then(res => res.data),
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

    const handleTagClick = (tag: string) => {
        setActiveTag(tag);
        if (tag) setSearch('');
    };

    return (
        <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-8">
                {/* Main Feed Column */}
                <div className="flex-1 min-w-0 border-x border-neutral-900 min-h-screen">
                    {/* Search Header */}
                    <div className="sticky top-16 bg-black/80 backdrop-blur-md z-40 border-b border-neutral-900 px-4 py-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setActiveTag(''); }}
                                className="w-full bg-neutral-900 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:ring-1 focus:ring-neutral-800 transition-all"
                            />
                        </div>
                        {activeTag && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-neutral-500">Filtering by:</span>
                                <button
                                    onClick={() => setActiveTag('')}
                                    className="flex items-center gap-1 bg-white text-black text-xs font-bold px-2.5 py-1 rounded-full hover:bg-neutral-200 transition-colors"
                                >
                                    #{activeTag} ✕
                                </button>
                            </div>
                        )}
                    </div>

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

                    {allBlogs.length === 0 && !isLoading && (
                        <div className="py-20 text-center px-4">
                            <p className="text-neutral-500">
                                {debouncedSearch ? `No posts found for "${debouncedSearch}".` : 'No posts yet. Be the first to share something.'}
                            </p>
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

                {/* Right Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0 pt-6 space-y-4 sticky top-16 self-start">
                    {!isLoading && allBlogs.length > 0 && (
                        <TrendingTags
                            blogs={allBlogs}
                            onTagClick={handleTagClick}
                            activeTag={activeTag}
                        />
                    )}
                </aside>
            </div>
        </div>
    );
}
