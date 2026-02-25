'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Blog } from '@/lib/types';
import { TrendingUp, ChevronDown, RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GoogleTrend {
    topic: string;
    posts: string;
    category: string;
}

interface TrendingTagsProps {
    blogs: Blog[];
    onTagClick: (tag: string) => void;
    activeTag?: string;
}

// ─── Platform tag extraction ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'have', 'has', 'do', 'does', 'that', 'this', 'it', 'my', 'your',
    'our', 'about', 'how', 'why', 'what', 'when', 'where', 'which', 'who',
    'im', 'i', 'you', 'we', 'just', 'so', 'up', 'out', 'not', 'very', 'more',
]);

function extractPlatformTags(blogs: Blog[]): { tag: string; count: number }[] {
    const tagMap = new Map<string, number>();
    for (const blog of blogs) {
        const words = (blog.title + ' ' + (blog.content || ''))
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !STOP_WORDS.has(w));
        const seen = new Set<string>();
        for (const word of words) {
            if (seen.has(word)) continue;
            seen.add(word);
            tagMap.set(word, (tagMap.get(word) || 0) + 1);
        }
    }
    return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function TrendSkeleton() {
    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-neutral-900 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-neutral-700" />
                <div className="h-3.5 w-32 bg-neutral-900 rounded-full animate-pulse" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-neutral-900/60">
                    <div className="h-2.5 w-20 bg-neutral-900 rounded-full animate-pulse mb-2" />
                    <div className="h-3.5 w-36 bg-neutral-900 rounded-full animate-pulse mb-1.5" />
                    <div className="h-2.5 w-24 bg-neutral-900 rounded-full animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrendingTags({ blogs, onTagClick, activeTag }: TrendingTagsProps) {
    const [showAll, setShowAll] = useState(false);
    const platformTags = useMemo(() => extractPlatformTags(blogs), [blogs]);

    const {
        data,
        isLoading,
        isError,
        refetch,
        dataUpdatedAt,
    } = useQuery<{ trends: GoogleTrend[]; updatedAt: string | null }>({
        queryKey: ['google-trends'],
        queryFn: () => fetch('/api/trends').then(r => r.json()),
        staleTime: 1000 * 60 * 60,      // 1 hour — don't re-fetch unnecessarily
        gcTime: 1000 * 60 * 60 * 2,
        retry: 2,
    });

    const googleTrends = data?.trends ?? [];
    const displayedTrends = showAll ? googleTrends : googleTrends.slice(0, 5);

    const updatedAt = data?.updatedAt
        ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div className="space-y-3">
            {/* Platform tags */}
            {platformTags.length > 0 && (
                <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-900">
                        <h3 className="text-[13px] font-bold text-white">Trending on Rival</h3>
                    </div>
                    <div className="divide-y divide-neutral-900/60">
                        {platformTags.map(({ tag, count }) => (
                            <button
                                key={tag}
                                onClick={() => onTagClick(tag === activeTag ? '' : tag)}
                                className={`w-full text-left px-4 py-3 hover:bg-neutral-900/50 transition-colors ${activeTag === tag ? 'bg-neutral-900' : ''}`}
                            >
                                <p className="text-[13px] font-bold text-white">#{tag}</p>
                                <p className="text-[11px] text-neutral-600 mt-0.5">{count} post{count !== 1 ? 's' : ''} · On Rival</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Google Trends */}
            {isLoading ? (
                <TrendSkeleton />
            ) : isError || googleTrends.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 text-center">
                    <p className="text-neutral-600 text-xs mb-3">Couldn't load live trends</p>
                    <button
                        onClick={() => refetch()}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                </div>
            ) : (
                <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                            <h3 className="text-[13px] font-bold text-white">What's happening</h3>
                        </div>
                        {updatedAt && (
                            <span className="text-[10px] text-neutral-700">Updated {updatedAt}</span>
                        )}
                    </div>

                    <div className="divide-y divide-neutral-900/60">
                        {displayedTrends.map(({ topic, category, posts }) => (
                            <button
                                key={topic}
                                onClick={() => onTagClick(topic === activeTag ? '' : topic)}
                                className={`w-full text-left px-4 py-3 hover:bg-neutral-900/50 transition-colors ${activeTag === topic ? 'bg-neutral-900' : ''}`}
                            >
                                <p className="text-[10px] text-neutral-600 mb-0.5 uppercase tracking-wide">
                                    {category} · Trending
                                </p>
                                <p className="text-[13px] font-bold text-white leading-tight">{topic}</p>
                                <p className="text-[11px] text-neutral-600 mt-0.5">{posts}</p>
                            </button>
                        ))}
                    </div>

                    {googleTrends.length > 5 && (
                        <button
                            onClick={() => setShowAll(v => !v)}
                            className="w-full flex items-center gap-1.5 px-4 py-3 text-[13px] text-blue-400 hover:bg-neutral-900/50 transition-colors font-medium"
                        >
                            {showAll ? 'Show less' : `Show ${googleTrends.length - 5} more`}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
