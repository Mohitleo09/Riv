'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { blogApi } from '@/lib/api';
import { ActivityHeatmap } from '@/components/ui/activity-heatmap';
import BlogCard from '@/components/blog/blog-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { FileText, Heart, Zap, BarChart3 } from 'lucide-react';
import { calculateStreak, calculateEngagementScore } from '@/lib/utils';

export default function ProfilePage() {
    const { user } = useAuth();

    const { data: blogs, isLoading } = useQuery({
        queryKey: ['myBlogs'],
        queryFn: () => blogApi.getMyBlogs().then(res => res.data),
    });

    const totalLikes = blogs?.reduce((acc, blog) => acc + blog._count.likes, 0) || 0;
    const totalComments = blogs?.reduce((acc, blog) => acc + blog._count.comments, 0) || 0;
    const streak = calculateStreak(blogs?.map(b => b.createdAt) || []);
    const engagementScore = blogs?.reduce((acc, b) => acc + calculateEngagementScore(b._count.likes, b._count.comments), 0) || 0;

    if (!user && !isLoading) return null;

    const stats = [
        { label: 'Posts', value: blogs?.length || 0, icon: FileText },
        { label: 'Likes', value: totalLikes, icon: Heart },
        { label: 'Streak', value: `${streak}d`, icon: Zap },
        { label: 'Score', value: engagementScore, icon: BarChart3 },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
            {/* Profile Info */}
            <header className="mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-5 mb-8"
                >
                    <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-2xl font-bold text-neutral-500 ring-1 ring-neutral-800">
                        {user?.email[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            {user?.email.split('@')[0]}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">@{user?.email.split('@')[0].toLowerCase()}</p>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-4 divide-x divide-neutral-900 border border-neutral-900 rounded-2xl overflow-hidden"
                >
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex flex-col items-center py-4 px-2 gap-1">
                            <span className="text-lg font-bold text-white">{value}</span>
                            <span className="text-[11px] text-neutral-600 font-medium tracking-wide flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {label}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </header>

            {/* Activity Pulse */}
            <section className="mb-14">
                <ActivityHeatmap
                    activityData={blogs?.map(blog => ({
                        date: new Date(blog.createdAt).toISOString().split('T')[0],
                        count: 1
                    })) || []}
                />
            </section>

            {/* Published Works */}
            <section>
                <div className="flex items-center justify-between pb-5 border-b border-neutral-900 mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Published Works</h2>
                    {blogs && blogs.length > 0 && (
                        <span className="text-xs text-neutral-600">{blogs.length} post{blogs.length !== 1 ? 's' : ''}</span>
                    )}
                </div>

                <div className="grid gap-0">
                    {isLoading ? (
                        [...Array(2)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl bg-neutral-900 mb-4" />
                        ))
                    ) : blogs && blogs.length > 0 ? (
                        blogs.map((blog, i) => (
                            <motion.div
                                key={blog.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                                <BlogCard blog={blog} />
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-16 text-center">
                            <p className="text-neutral-600 text-sm">No posts yet. Start writing.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
