'use client';

import { FileText, Heart, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { IconButton } from '@/components/ui/icon-button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Blog } from '@/lib/types';

interface DashboardItemProps {
    blog: Blog;
    onDelete: (id: string) => void;
}

export function DashboardItem({ blog, onDelete }: DashboardItemProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="group p-6 bg-neutral-950 border border-neutral-900 rounded-2xl flex items-center justify-between hover:border-neutral-800 transition-all"
        >
            <Link
                href={`/blog/${blog.slug}`}
                className="flex items-center gap-6 flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
                <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0 text-neutral-600 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold truncate block transition-colors">
                        {blog.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm font-medium mt-1">
                        <span className="text-neutral-500">
                            {format(new Date(blog.createdAt), 'MMMM d, yyyy')}
                        </span>
                        <div className="flex items-center gap-3 text-neutral-600">
                            <div className="flex items-center gap-1.5">
                                <Heart className="w-3.5 h-3.5" />
                                <span className="text-xs">{blog._count.likes}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span className="text-xs">{blog._count.comments}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="flex items-center gap-2">
                <Link href={`/dashboard/edit/${blog.id}`}>
                    <IconButton icon={<Edit3 className="w-4 h-4" />} />
                </Link>
                <IconButton
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => onDelete(blog.id)}
                    danger
                />
            </div>
        </motion.div>
    );
}
