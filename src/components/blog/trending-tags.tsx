'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, RefreshCw, Hash, Radio, ExternalLink, ChevronDown } from 'lucide-react';

interface GoogleTrend {
    topic: string;
    posts: string;
    category: string;
    hashtag: string;
    url: string;
}

export function TrendingTags() {
    const [showAllTrends, setShowAllTrends] = useState(false);

    const { data, isLoading, isError, refetch } = useQuery<{
        trends: GoogleTrend[];
        hashtags: { tag: string; label: string }[];
        updatedAt: string | null;
    }>({
        queryKey: ['google-trends'],
        queryFn: () => fetch('/api/trends').then(r => r.json()),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
    });

    const googleTrends = data?.trends ?? [];
    const googleHashtags = data?.hashtags ?? [];
    const displayedTrends = showAllTrends ? googleTrends : googleTrends.slice(0, 5);

    const handleTopicClick = (topicName: string) => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(topicName)}`, '_blank', 'noopener,noreferrer');
    };

    if (isLoading) {
        return (
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl overflow-hidden p-4 space-y-4">
                <div className="h-4 w-32 bg-neutral-900 rounded-full animate-pulse" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-3 w-full bg-neutral-900 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError || googleTrends.length === 0) {
        return (
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-6 text-center">
                <p className="text-neutral-500 text-xs mb-3 italic">Couldn't load news</p>
                <button
                    onClick={() => refetch()}
                    className="text-[10px] font-bold text-white uppercase tracking-widest bg-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-800 transition-colors flex items-center gap-2 mx-auto"
                >
                    <RefreshCw className="w-2.5 h-2.5" /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Live Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Trending Now</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                    <Radio className="w-2 h-2" /> Live
                </div>
            </div>

            {/* Simple Hashtag List */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-3">
                    <Hash className="w-3 h-3 text-neutral-600" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Top Tags</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {googleHashtags.slice(0, 8).map(h => (
                        <button
                            key={h.tag}
                            onClick={() => handleTopicClick(h.label)}
                            className="text-[12px] font-medium text-neutral-400 hover:text-blue-400 transition-colors"
                        >
                            #{h.tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* What's Happening List */}
            <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-neutral-900">
                    {displayedTrends.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => handleTopicClick(t.topic)}
                            className="w-full text-left px-4 py-3.5 hover:bg-neutral-900/30 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{t.category}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
                            </div>
                            <p className="text-[13px] font-bold text-white leading-snug group-hover:text-blue-50 transition-colors">
                                {t.topic}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] font-medium text-neutral-700">{t.posts}</span>
                                <span className="text-[10px] text-neutral-800">·</span>
                                <span className="text-[10px] font-medium text-neutral-700">#{t.hashtag}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowAllTrends(v => !v)}
                    className="w-full py-3.5 text-[11px] font-bold text-blue-400 hover:bg-neutral-900/30 transition-colors border-t border-neutral-900"
                >
                    {showAllTrends ? 'See less' : 'See more'}
                </button>
            </div>

            {data?.updatedAt && (
                <p className="text-[8px] text-center text-neutral-800 font-bold uppercase tracking-[0.3em] pt-1">
                    Last Synced {new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            )}
        </div>
    );
}
