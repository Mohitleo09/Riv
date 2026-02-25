'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { blogApi } from '@/lib/api';
import { ActivityHeatmap } from '@/components/ui/activity-heatmap';
import BlogCard from '@/components/blog/blog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { FileText, Heart, Globe, Zap, BarChart3, Target } from 'lucide-react';
import { calculateStreak, calculateEngagementScore } from '@/lib/utils';

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

            {/* Writer Insights */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-neutral-900/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Zap className="w-20 h-20 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Writing Streak</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tighter mb-1">
                        {calculateStreak(blogs?.map(b => b.createdAt) || [])} Days
                    </div>
                    <p className="text-neutral-500 text-xs font-medium">Consecutive writing days</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-neutral-900/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BarChart3 className="w-20 h-20 text-purple-500" />
                    </div>
                    <div className="flex items-center gap-2 text-purple-500 mb-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Engagement Engine</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tighter mb-1">
                        {blogs?.reduce((acc, b) => acc + calculateEngagementScore(b._count.likes, b._count.comments), 0) || 0}
                    </div>
                    <p className="text-neutral-500 text-xs font-medium">Weighted interaction score</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-neutral-900/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Target className="w-20 h-20 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Global Rank</span>
                    </div>
                    <div className="text-4xl font-bold tracking-tighter mb-1">
                        Top 5%
                    </div>
                    <p className="text-neutral-500 text-xs font-medium">Among creative writers</p>
                </motion.div>
            </section>

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
