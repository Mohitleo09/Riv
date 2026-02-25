'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Blog } from '@/lib/types';
import { TrendingUp, ChevronDown, RefreshCw, Hash } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GoogleTrend {
    topic: string;
    posts: string;
    category: string;
    hashtag: string;
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
        <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-neutral-800 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-neutral-700" />
                <div className="h-3 w-28 bg-neutral-800 rounded-full animate-pulse" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-3 border-b border-neutral-800/50">
                    <div className="h-2 w-16 bg-neutral-800 rounded-full animate-pulse mb-2" />
                    <div className="h-3.5 w-32 bg-neutral-800 rounded-full animate-pulse mb-1.5" />
                    <div className="h-2 w-20 bg-neutral-800 rounded-full animate-pulse" />
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
        hashtags: { tag: string; label: string; posts: string }[];
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
    const displayedTrends = showAllTrends ? googleTrends : googleTrends.slice(0, 5);
    const displayedHashtags = showAllHashtags ? googleHashtags : googleHashtags.slice(0, 8);

    const updatedAt = data?.updatedAt
        ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div className="space-y-3">

            {/* ── Platform tags from Rival posts ── */}
            {platformTags.length > 0 && (
                <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-800">
                        <h3 className="text-[13px] font-bold text-white">Trending on Rival</h3>
                    </div>
                    <div className="divide-y divide-neutral-800/50">
                        {platformTags.map(({ tag, count }) => (
                            <button
                                key={tag}
                                onClick={() => onTagClick(tag === activeTag ? '' : tag)}
                                className={`w-full text-left px-4 py-3 hover:bg-neutral-800/40 transition-colors ${activeTag === tag ? 'bg-neutral-800/60' : ''}`}
                            >
                                <p className="text-[13px] font-bold text-white leading-tight">#{tag}</p>
                                <p className="text-[11px] text-neutral-600 mt-0.5">{count} post{count !== 1 ? 's' : ''} · On Rival</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Live hashtags from Google Trends ── */}
            {isLoading ? null : !isError && googleHashtags.length > 0 && (
                <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-800 flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-neutral-400" />
                        <h3 className="text-[13px] font-bold text-white">Trending Hashtags</h3>
                    </div>
                    <div className="px-4 py-3 flex flex-wrap gap-2">
                        {displayedHashtags.map(({ tag, label, posts }) => (
                            <button
                                key={tag}
                                onClick={() => onTagClick(label === activeTag ? '' : label)}
                                title={`${label} · ${posts}`}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold transition-all ${activeTag === label
                                        ? 'bg-white text-black'
                                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                    {googleHashtags.length > 8 && (
                        <button
                            onClick={() => setShowAllHashtags(v => !v)}
                            className="w-full flex items-center gap-1 px-4 py-2.5 text-[12px] text-neutral-500 hover:text-white hover:bg-neutral-800/40 transition-colors border-t border-neutral-800"
                        >
                            <ChevronDown className={`w-3 h-3 transition-transform ${showAllHashtags ? 'rotate-180' : ''}`} />
                            {showAllHashtags ? 'Show less' : `+${googleHashtags.length - 8} more hashtags`}
                        </button>
                    )}
                </div>
            )}

            {/* ── What's Happening (Google Trends) ── */}
            {isLoading ? (
                <Skeleton />
            ) : isError || googleTrends.length === 0 ? (
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-5 text-center">
                    <p className="text-neutral-600 text-xs mb-3">Couldn't load live trends</p>
                    <button
                        onClick={() => refetch()}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                </div>
            ) : (
                <div className="bg-[#111] border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                            <h3 className="text-[13px] font-bold text-white">What's happening</h3>
                        </div>
                        {updatedAt && (
                            <span className="text-[10px] text-neutral-700">Updated {updatedAt}</span>
                        )}
                    </div>

                    <div className="divide-y divide-neutral-800/50">
                        {displayedTrends.map(({ topic, category, posts, hashtag }) => (
                            <button
                                key={topic}
                                onClick={() => onTagClick(topic === activeTag ? '' : topic)}
                                className={`w-full text-left px-4 py-3 hover:bg-neutral-800/40 transition-colors ${activeTag === topic ? 'bg-neutral-800/60' : ''}`}
                            >
                                <p className="text-[10px] text-neutral-600 mb-0.5 uppercase tracking-wide">{category} · Trending</p>
                                <p className="text-[13px] font-bold text-white leading-snug">{topic}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[11px] text-neutral-600">{posts}</p>
                                    <span className="text-[11px] text-neutral-700">·</span>
                                    <p className="text-[11px] text-neutral-700">#{hashtag}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {googleTrends.length > 5 && (
                        <button
                            onClick={() => setShowAllTrends(v => !v)}
                            className="w-full flex items-center gap-1.5 px-4 py-3 text-[13px] text-blue-400 hover:bg-neutral-800/40 transition-colors font-medium border-t border-neutral-800"
                        >
                            {showAllTrends ? 'Show less' : `Show ${googleTrends.length - 5} more`}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllTrends ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
