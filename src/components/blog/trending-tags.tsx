'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Blog } from '@/lib/types';
import { TrendingUp, ChevronDown, RefreshCw, Hash, Radio, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GoogleTrend {
    topic: string;
    posts: string;
    category: string;
    hashtag: string;
    source?: 'reddit' | 'hn';
    url: string;
}

interface TrendingTagsProps {
    blogs: Blog[];
    onTagClick: (tag: string) => void;
    activeTag?: string;
}

// ─── Platform tag extraction ──────────────────────────────────────────────────
const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'have', 'has', 'do', 'does',
    'that', 'this', 'it', 'my', 'your', 'our', 'about', 'how', 'why', 'what', 'when',
    'where', 'which', 'who', 'im', 'i', 'you', 'we', 'just', 'so', 'up', 'out', 'not', 'very', 'more',
]);

function extractPlatformTags(blogs: Blog[]) {
    const map = new Map<string, number>();
    for (const blog of blogs) {
        const words = (blog.title + ' ' + (blog.content || ''))
            .toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
            .filter(w => w.length > 3 && !STOP.has(w));
        const seen = new Set<string>();
        for (const w of words) {
            if (seen.has(w)) continue;
            seen.add(w);
            map.set(w, (map.get(w) || 0) + 1);
        }
    }
    return [...map.entries()].map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="px-4 py-4 border-b border-neutral-900">
                <div className="h-4 w-32 bg-neutral-900 rounded-full animate-pulse" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-neutral-900/50">
                    <div className="h-2 w-16 bg-neutral-900 rounded-full animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-neutral-900 rounded-full animate-pulse" />
                </div>
            ))}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TrendingTags({ blogs, onTagClick, activeTag }: TrendingTagsProps) {
    const [showAllTrends, setShowAllTrends] = useState(false);
    const [showAllHashtags, setShowAllHashtags] = useState(false);

    const platformTags = useMemo(() => extractPlatformTags(blogs), [blogs]);

    const { data, isLoading, isError, refetch } = useQuery<{
        trends: GoogleTrend[];
        hashtags: { tag: string; label: string; posts: string; category?: string }[];
        updatedAt: string | null;
    }>({
        queryKey: ['google-trends'],
        queryFn: () => fetch('/api/trends').then(r => r.json()),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
        retry: 2,
    });

    const googleTrends = data?.trends ?? [];
    const googleHashtags = data?.hashtags ?? [];
    const displayedTrends = showAllTrends ? googleTrends : googleTrends.slice(0, 6);
    const displayedHashtags = showAllHashtags ? googleHashtags : googleHashtags.slice(0, 8);

    const updatedAt = data?.updatedAt
        ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    const handleTrendClick = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="space-y-4">

            {/* ── Trending Hashtags ── */}
            {isLoading ? null : !isError && googleHashtags.length > 0 && (
                <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5 text-neutral-500" />
                            <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400">Trends for you</h3>
                        </div>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                        {displayedHashtags.map(({ tag, label, category }) => (
                            <button
                                key={tag}
                                onClick={() => handleTrendClick(`https://www.google.com/search?q=${encodeURIComponent(label)}`)}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/50`}
                            >
                                <span className="text-neutral-500 group-hover:text-blue-400">#</span>
                                {tag}
                            </button>
                        ))}
                    </div>
                    {googleHashtags.length > 8 && (
                        <button
                            onClick={() => setShowAllHashtags(v => !v)}
                            className="w-full py-2.5 text-[11px] font-bold text-blue-400/80 hover:text-blue-400 hover:bg-neutral-900/40 transition-colors border-t border-neutral-900 border-dashed"
                        >
                            {showAllHashtags ? 'Show less' : `Explore ${googleHashtags.length - 8} more`}
                        </button>
                    )}
                </div>
            )}

            {/* ── What's Happening ── */}
            {isLoading ? (
                <Skeleton />
            ) : isError || googleTrends.length === 0 ? (
                <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-6 text-center">
                    <p className="text-neutral-500 text-xs mb-4 italic">Trends temporarily unavailable</p>
                    <button
                        onClick={() => refetch()}
                        className="text-xs bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw className="w-3 h-3" /> Try again
                    </button>
                </div>
            ) : (
                <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            <h3 className="text-[13px] font-bold text-white tracking-tight">What's happening</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase tracking-tighter bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                <Radio className="w-2 h-2" /> Live
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-neutral-900">
                        {displayedTrends.map(({ topic, category, posts, hashtag, source, url }) => (
                            <button
                                key={topic}
                                onClick={() => handleTrendClick(url)}
                                className="w-full text-left px-4 py-3.5 hover:bg-neutral-900/50 transition-all group relative"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{category}</p>
                                    <ExternalLink className="w-3 h-3 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all" />
                                </div>
                                <p className="text-[13px] font-bold text-white leading-tight group-hover:text-blue-50 transition-colors mb-2">
                                    {topic}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-medium text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded leading-none">
                                        {posts}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 font-medium">#{hashtag}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowAllTrends(v => !v)}
                        className="w-full py-4 text-[13px] text-blue-400 font-bold hover:bg-neutral-900/50 transition-colors"
                    >
                        {showAllTrends ? 'Show less' : 'Show more'}
                    </button>
                </div>
            )}

            {/* ── Rival Topics (Minimal) ── */}
            {platformTags.length > 0 && (
                <div className="bg-[#0a0a0a] border border-neutral-900 rounded-2xl p-4">
                    <h4 className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-3">Community Hub</h4>
                    <div className="flex flex-wrap gap-2">
                        {platformTags.map(({ tag, count }) => (
                            <button
                                key={tag}
                                onClick={() => onTagClick(tag === activeTag ? '' : tag)}
                                className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${activeTag === tag
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {updatedAt && (
                <p className="text-[9px] text-center text-neutral-700 font-bold uppercase tracking-[0.2em] pt-2">
                    Synced {updatedAt}
                </p>
            )}
        </div>
    );
}
