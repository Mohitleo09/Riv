'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { blogApi } from '@/lib/api';
import { ActivityHeatmap } from '@/components/ui/activity-heatmap';
import BlogCard from '@/components/blog/blog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { FileText, Heart, Globe } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();

    const { data: blogs, isLoading } = useQuery({
        queryKey: ['myBlogs'],
        queryFn: () => blogApi.getMyBlogs().then(res => res.data),
    });

    const totalLikes = blogs?.reduce((acc, blog) => acc + blog._count.likes, 0) || 0;

    if (!user && !isLoading) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
            {/* Profile Info */}
            <header className="flex flex-col md:flex-row gap-8 mb-16 items-start md:items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-neutral-900 flex items-center justify-center text-4xl font-bold text-neutral-700 ring-2 ring-neutral-800 ring-offset-4 ring-offset-black"
                >
                    {user?.email[0].toUpperCase()}
                </motion.div>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <h1 className="text-3xl font-bold tracking-tighter">{user?.email.split('@')[0]}</h1>
                    </div>
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-neutral-600" />
                            <span className="font-bold">{blogs?.length || 0}</span>
                            <span className="text-neutral-500">Blogs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-neutral-600" />
                            <span className="font-bold">{totalLikes}</span>
                            <span className="text-neutral-500">Total Likes</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-neutral-600" />
                            <span className="text-neutral-500 hover:text-white cursor-pointer transition-colors">rival.io/{user?.email.split('@')[0]}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Activity Pulse */}
            <section className="mb-20">
                <ActivityHeatmap
                    activityData={blogs?.map(blog => ({
                        date: new Date(blog.createdAt).toISOString().split('T')[0],
                        count: 1
                    })) || []}
                />
            </section>

            {/* Content Feed */}
            <section>
                <div className="flex items-center justify-between pb-8 border-b border-neutral-900 mb-8">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">Published Works</h2>
                </div>

                <div className="grid gap-8">
                    {isLoading ? (
                        [...Array(2)].map((_, i) => (
                            <Skeleton key={i} className="h-64 w-full rounded-2xl bg-neutral-900" />
                        ))
                    ) : (
                        blogs?.map(blog => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <BlogCard blog={blog} />
                            </motion.div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
