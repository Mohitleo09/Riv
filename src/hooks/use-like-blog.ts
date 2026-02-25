'use client';

import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Blog, FeedResponse } from '@/lib/types';

export function useLikeBlog(blog: Blog) {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const updateBlog = (b: Blog): Blog => ({
        ...b,
        likedByMe: !b.likedByMe,
        _count: {
            ...b._count,
            likes: b._count.likes + (b.likedByMe ? -1 : 1),
        },
    });

    return useMutation({
        mutationFn: () => blog.likedByMe ? blogApi.unlikeBlog(blog.id) : blogApi.likeBlog(blog.id),
        onMutate: async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            const feedKey = ['feed', user?.id];
            const blogKey = ['blog', blog.slug, user?.id];
            const myBlogsKey = ['myBlogs'];

            await queryClient.cancelQueries({ queryKey: feedKey });
            await queryClient.cancelQueries({ queryKey: blogKey });
            await queryClient.cancelQueries({ queryKey: myBlogsKey });

            // Update the infinite feed query
            queryClient.setQueryData<InfiniteData<FeedResponse>>(feedKey, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: page.data.map((b) => b.id === blog.id ? updateBlog(b) : b),
                    })),
                };
            });

            // Update the single blog detail query
            queryClient.setQueryData<Blog>(blogKey, (old) => {
                if (!old) return old;
                return updateBlog(old);
            });

            // Update the myBlogs flat array query (used on profile page)
            queryClient.setQueryData<Blog[]>(myBlogsKey, (old) => {
                if (!old) return old;
                return old.map(b => b.id === blog.id ? updateBlog(b) : b);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['blog', blog.slug, user?.id] });
            queryClient.invalidateQueries({ queryKey: ['myBlogs'] });
        },
    });
}
