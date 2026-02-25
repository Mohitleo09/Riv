'use client';

import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Blog, FeedResponse } from '@/lib/types';

export function useLikeBlog(blog: Blog, contextPath?: string) {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => blog.likedByMe ? blogApi.unlikeBlog(blog.id) : blogApi.likeBlog(blog.id),
        onMutate: async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            // Update specific query keys based on where this is used
            const queries = [
                ['feed', user?.id],
                ['blog', blog.slug, user?.id],
                ['myBlogs']
            ];

            for (const key of queries) {
                await queryClient.cancelQueries({ queryKey: key });
                const previousData = queryClient.getQueryData(key);

                if (key[0] === 'feed') {
                    queryClient.setQueryData<InfiniteData<FeedResponse>>(key, (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            pages: old.pages.map((page) => ({
                                ...page,
                                data: page.data.map((b) => {
                                    if (b.id === blog.id) {
                                        return {
                                            ...b,
                                            likedByMe: !b.likedByMe,
                                            _count: {
                                                ...b._count,
                                                likes: b._count.likes + (b.likedByMe ? -1 : 1)
                                            }
                                        };
                                    }
                                    return b;
                                })
                            }))
                        };
                    });
                } else if (key[0] === 'blog') {
                    queryClient.setQueryData<Blog>(key, (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            likedByMe: !old.likedByMe,
                            _count: {
                                ...old._count,
                                likes: old._count.likes + (old.likedByMe ? -1 : 1)
                            }
                        };
                    });
                } else if (key[0] === 'myBlogs') {
                    queryClient.setQueryData<Blog[]>(key, (old) => {
                        if (!old) return old;
                        return old.map(b => b.id === blog.id ? {
                            ...b,
                            likedByMe: !b.likedByMe,
                            _count: {
                                ...b._count,
                                likes: b._count.likes + (b.likedByMe ? -1 : 1)
                            }
                        } : b);
                    });
                }
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['blog', blog.slug, user?.id] });
            queryClient.invalidateQueries({ queryKey: ['myBlogs'] });
        },
    });
}
