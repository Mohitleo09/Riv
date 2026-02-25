'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence } from 'framer-motion';
import { Blog } from '@/lib/types';

import { DashboardItem } from '@/components/blog/dashboard-item';

export default function Dashboard() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: blogs, isLoading } = useQuery({
        queryKey: ['myBlogs'],
        queryFn: () => blogApi.getMyBlogs().then(res => res.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => blogApi.deleteBlog(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['myBlogs'] });
            await queryClient.cancelQueries({ queryKey: ['feed'] });
            const previousBlogs = queryClient.getQueryData<Blog[]>(['myBlogs']);
            queryClient.setQueryData<Blog[]>(['myBlogs'], (old) =>
                old ? old.filter((item) => item.id !== id) : []
            );
            return { previousBlogs };
        },
        onError: (err, id, context: any) => {
            queryClient.setQueryData(['myBlogs'], context.previousBlogs);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['myBlogs'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
        },
    });

    const handleDelete = (id: string) => {
        if (confirm('Delete this blog?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="p-6 md:p-12 max-w-5xl mx-auto w-full">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 md:mb-16">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">My Blogs</h1>
                    <p className="text-neutral-500 font-medium tracking-tight text-sm md:text-base">Manage and share your writing with the world.</p>
                </div>
                <Link href="/dashboard/new" className="w-full sm:w-auto">
                    <button className="h-12 px-8 w-full sm:w-auto rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Create
                    </button>
                </Link>
            </header>

            {/* Stories Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-neutral-900">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">All Blogs</h2>
                    <span className="text-xs font-bold text-neutral-700">{blogs?.length || 0} Blogs</span>
                </div>

                <div className="space-y-4 pt-4">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                    ) : blogs?.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-neutral-900 rounded-3xl">
                            <FileText className="w-10 h-10 text-neutral-800 mx-auto mb-4" />
                            <p className="text-neutral-500 font-medium tracking-tight">You haven't published any blogs yet.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {blogs?.map((blog: Blog) => (
                                <DashboardItem
                                    key={blog.id}
                                    blog={blog}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}


