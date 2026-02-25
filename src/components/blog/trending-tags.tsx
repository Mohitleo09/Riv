'use client';

import { useMemo } from 'react';
import { Blog } from '@/lib/types';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TrendingTagsProps {
    blogs: Blog[];
    onTagClick: (tag: string) => void;
    activeTag?: string;
}

// Extracts meaningful keywords from blog titles and content
function extractTags(blogs: Blog[]): { tag: string; count: number; likes: number }[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'could', 'should', 'may', 'might', 'that', 'this', 'it', 'its',
        'my', 'your', 'our', 'their', 'about', 'how', 'why', 'what', 'when', 'where',
        'which', 'who', 'im', 'i', 'you', 'we', 'he', 'she', 'they', 'not', 'no',
        'can', 'just', 'so', 'if', 'than', 'then', 'up', 'out', 'into', 'through',
    ]);

    const tagMap = new Map<string, { count: number; likes: number }>();

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
            const existing = tagMap.get(word) || { count: 0, likes: 0 };
            tagMap.set(word, {
                count: existing.count + 1,
                likes: existing.likes + blog._count.likes,
            });
        }
    }

    return Array.from(tagMap.entries())
        .map(([tag, data]) => ({ tag, ...data }))
        .filter(t => t.count >= 1)
        .sort((a, b) => (b.count * 2 + b.likes) - (a.count * 2 + a.likes))
        .slice(0, 8);
}

export function TrendingTags({ blogs, onTagClick, activeTag }: TrendingTagsProps) {
    const tags = useMemo(() => extractTags(blogs), [blogs]);

    if (tags.length === 0) return null;

    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-neutral-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Trending Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map(({ tag, count }) => (
                    <button
                        key={tag}
                        onClick={() => onTagClick(tag === activeTag ? '' : tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeTag === tag
                                ? 'bg-white text-black'
                                : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        #{tag}
                        <span className="ml-1.5 opacity-50 font-normal">{count}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
