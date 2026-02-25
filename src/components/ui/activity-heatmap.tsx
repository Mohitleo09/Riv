'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
    activityData: { date: string; count: number }[];
    userName?: string;
}

export function ActivityHeatmap({ activityData, userName }: ActivityHeatmapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Optimized data lookup using a frequency map
    const activityMap = activityData.reduce((acc, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + curr.count;
        return acc;
    }, {} as Record<string, number>);

    // Generate real activity data for the last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
        if (!mounted) return { active: false, intensity: 0 };

        // Go back in time from today
        const date = new Date();
        date.setDate(date.getDate() - (30 - 1 - i));
        const dateStr = date.toISOString().split('T')[0];

        const count = activityMap[dateStr] || 0;

        return {
            active: count > 0,
            intensity: Math.min(Math.max(0, count - 1), 3),
            date: dateStr
        };
    });

    return (
        <div className="p-8 rounded-[2rem] bg-neutral-950 border border-neutral-900/50 overflow-hidden relative group">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-1">
                        Activity Pulse
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                        Momentum over the last month
                    </p>
                </div>

                {/* Simple Legend */}
                <div className="flex items-center gap-3">
                    <div className="flex gap-1 text-[8px] text-neutral-600 font-bold uppercase tracking-widest">
                        <span>Less</span>
                        <div className="flex gap-1 px-1">
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-900 border border-neutral-800" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-800" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-700" />
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-white" />
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex justify-center">
                <div className="grid grid-flow-col grid-rows-3 gap-1.5">
                    {days.map((day, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                delay: i * 0.01,
                                duration: 0.3,
                                ease: 'easeOut'
                            }}
                            whileHover={{ scale: 1.4, zIndex: 10 }}
                            className={cn(
                                "w-3.5 h-3.5 md:w-4 md:h-4 rounded-[2px] transition-all duration-300",
                                day.active
                                    ? day.intensity === 0 ? "bg-neutral-800" :
                                        day.intensity === 1 ? "bg-neutral-700" :
                                            day.intensity === 2 ? "bg-neutral-500" : "bg-white"
                                    : "bg-neutral-900 border border-neutral-800/10"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="absolute bottom-2 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.3em]">
                    Consistency is Key
                </span>
            </div>
        </div>
    );
}
