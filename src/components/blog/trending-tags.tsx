'use client';

import { useMemo, useState } from 'react';
import { Blog } from '@/lib/types';
import { TrendingUp, ChevronDown } from 'lucide-react';

interface TrendingTagsProps {
    blogs: Blog[];
    onTagClick: (tag: string) => void;
    activeTag?: string;
}

// World trending topics with realistic data (updated periodically in a real app via API)
const WORLD_TRENDS: { topic: string; category: string; posts: string }[] = [
    { topic: 'Artificial Intelligence', category: 'Technology', posts: '284K posts' },
    { topic: 'Web Development', category: 'Technology', posts: '192K posts' },
    { topic: 'Open Source', category: 'Technology', posts: '143K posts' },
    { topic: 'Mental Health', category: 'Wellness', posts: '98K posts' },
    { topic: 'Climate Change', category: 'Environment', posts: '87K posts' },
    { topic: 'Remote Work', category: 'Work & Career', posts: '76K posts' },
    { topic: 'Startup Culture', category: 'Business', posts: '61K posts' },
    { topic: 'JavaScript', category: 'Technology', posts: '54K posts' },
    { topic: 'Learning', category: 'Education', posts: '48K posts' },
    { topic: 'Design Systems', category: 'Design', posts: '39K posts' },
];

// Extracts meaningful keywords from blog titles and content
function extractPlatformTags(blogs: Blog[]): { tag: string; count: number }[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'have', 'has', 'do', 'does', 'that', 'this', 'it', 'my', 'your',
        'our', 'about', 'how', 'why', 'what', 'when', 'where', 'which', 'who',
        'im', 'i', 'you', 'we', 'just', 'so', 'up', 'out', 'into', 'through',
        'not', 'no', 'can', 'will', 'would', 'could', 'should', 'very', 'more',
    ]);

    const tagMap = new Map<string, number>();

    for (const blog of blogs) {
        const words = (blog.title + ' ' + (blog.content || ''))
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

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

export function TrendingTags({ blogs, onTagClick, activeTag }: TrendingTagsProps) {
    const [showAll, setShowAll] = useState(false);
    const platformTags = useMemo(() => extractPlatformTags(blogs), [blogs]);

    const displayedTrends = showAll ? WORLD_TRENDS : WORLD_TRENDS.slice(0, 5);

    return (
        <div className="space-y-3">
            {/* Platform Trending Tags */}
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
                                className={`w-full text-left px-4 py-3 hover:bg-neutral-900/50 transition-colors group ${activeTag === tag ? 'bg-neutral-900' : ''
                                    }`}
                            >
                                <p className={`text-[13px] font-bold leading-tight ${activeTag === tag ? 'text-white' : 'text-white group-hover:text-white'
                                    }`}>
                                    #{tag}
                                </p>
                                <p className="text-[11px] text-neutral-600 mt-0.5">
                                    {count} post{count !== 1 ? 's' : ''} · On Rival
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* World Trending Topics */}
            <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-neutral-900 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                    <h3 className="text-[13px] font-bold text-white">What's happening</h3>
                </div>
                <div className="divide-y divide-neutral-900/60">
                    {displayedTrends.map(({ topic, category, posts }) => (
                        <button
                            key={topic}
                            onClick={() => onTagClick(topic === activeTag ? '' : topic)}
                            className={`w-full text-left px-4 py-3 hover:bg-neutral-900/50 transition-colors group ${activeTag === topic ? 'bg-neutral-900' : ''
                                }`}
                        >
                            <p className="text-[10px] text-neutral-600 mb-0.5 uppercase tracking-wide">{category} · Trending</p>
                            <p className={`text-[13px] font-bold leading-tight ${activeTag === topic ? 'text-white' : 'text-white'
                                }`}>
                                {topic}
                            </p>
                            <p className="text-[11px] text-neutral-600 mt-0.5">{posts}</p>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowAll(v => !v)}
                    className="w-full flex items-center gap-1.5 px-4 py-3 text-[13px] text-blue-400 hover:bg-neutral-900/50 transition-colors font-medium"
                >
                    {showAll ? 'Show less' : 'Show more'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
            </div>
        </div>
    );
}
