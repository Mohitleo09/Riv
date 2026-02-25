'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Comment } from '@/lib/types';

export function useLikeComment(comment: Comment, blogId: string) {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => comment.likedByMe ? blogApi.unlikeComment(comment.id) : blogApi.likeComment(comment.id),
        onMutate: async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            const queryKey = ['comments', blogId];
            await queryClient.cancelQueries({ queryKey });
            const previousComments = queryClient.getQueryData<Comment[]>(queryKey);

            queryClient.setQueryData<Comment[]>(queryKey, (old) => {
                if (!old) return old;
                return old.map(c => {
                    if (c.id === comment.id) {
                        return {
                            ...c,
                            likedByMe: !c.likedByMe,
                            _count: {
                                ...c._count,
                                likes: c._count.likes + (c.likedByMe ? -1 : 1)
                            }
                        };
                    }
                    return c;
                });
            });

            return { previousComments };
        },
        onError: (err, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', blogId], context.previousComments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', blogId] });
        },
    });
}
