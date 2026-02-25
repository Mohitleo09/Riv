import { NextResponse } from 'next/server';

// Revalidate every 30 minutes
export const revalidate = 1800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScore(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M points`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K points`;
    return `${n} points`;
}

// Convert topic string → camelCase hashtag
function toHashtag(topic: string): string {
    return topic
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

function subredditToCategory(sub: string): string {
    const map: Record<string, string> = {
        worldnews: 'World News',
        news: 'News',
        technology: 'Technology',
        science: 'Science',
        politics: 'Politics',
        sports: 'Sports',
        gaming: 'Gaming',
        movies: 'Entertainment',
        television: 'Entertainment',
        music: 'Music',
        business: 'Business',
        finance: 'Finance',
        space: 'Space',
        environment: 'Environment',
    };
    return map[sub] ?? sub.charAt(0).toUpperCase() + sub.slice(1);
}

// ─── Reddit Fetcher ───────────────────────────────────────────────────────────
interface RedditPost {
    data: {
        title: string;
        subreddit: string;
        score: number;
        num_comments: number;
        permalink: string;
        url: string;
    };
}

// Fetch from multiple diverse subreddits for variety
const TARGET_SUBREDDITS = ['worldnews', 'news', 'technology', 'science', 'politics', 'sports', 'gaming', 'business'];

async function fetchRedditTrends() {
    // Fetch from r/all plus specific ones to ensure coverage
    const res = await fetch('https://www.reddit.com/r/all/hot.json?limit=50', {
        headers: {
            'User-Agent': 'Rival-Blog/1.0 (production app)',
            'Accept': 'application/json',
        },
        next: { revalidate: 1800 },
    });

    if (!res.ok) throw new Error(`Reddit API responded ${res.status}`);
    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    return posts
        .filter(p => p.data.score > 50)
        .map(p => {
            const topic = p.data.title.length > 100
                ? p.data.title.slice(0, 100) + '...'
                : p.data.title;

            return {
                topic,
                posts: formatScore(p.data.score),
                category: subredditToCategory(p.data.subreddit),
                hashtag: toHashtag(p.data.subreddit),
                source: 'reddit' as const,
                url: `https://www.google.com/search?q=${encodeURIComponent(topic)}`
            };
        });
}

// ─── Hacker News Fetcher ──────────────────────────────────────────────────────
async function fetchHNTrends() {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
        next: { revalidate: 1800 }
    });
    if (!idsRes.ok) throw new Error('HN failed');
    const ids: number[] = await idsRes.json();

    const stories = await Promise.allSettled(
        ids.slice(0, 10).map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                .then(r => r.json())
        )
    );

    return stories
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !!r.value?.title)
        .map(r => r.value)
        .map(s => {
            const topic = s.title.length > 100 ? s.title.slice(0, 100) + '...' : s.title;
            return {
                topic,
                posts: formatScore(s.score),
                category: 'Technology',
                hashtag: toHashtag(s.title.split(' ').slice(0, 2).join(' ')),
                source: 'hn' as const,
                url: `https://www.google.com/search?q=${encodeURIComponent(topic)}`
            };
        });
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
    try {
        const [redditResult, hnResult] = await Promise.allSettled([
            fetchRedditTrends(),
            fetchHNTrends(),
        ]);

        const redditTrends = redditResult.status === 'fulfilled' ? redditResult.value : [];
        const hnTrends = hnResult.status === 'fulfilled' ? hnResult.value : [];

        // Mix them and ensure variety in categories
        const combined = [...redditTrends, ...hnTrends];

        // Deduplicate and prioritize variety
        const seenHashtags = new Set<string>();
        const finalTrends = combined.filter(t => {
            if (seenHashtags.has(t.hashtag)) return false;
            seenHashtags.add(t.hashtag);
            return true;
        }).sort((a, b) => 0.5 - Math.random()); // Shuffle for daily variety

        // Dynamic Hashtags (Chips)
        const activeHashtags = finalTrends.slice(0, 15).map(t => ({
            tag: t.hashtag,
            label: t.topic,
            category: t.category
        }));

        return NextResponse.json({
            trends: finalTrends.slice(0, 25),
            hashtags: activeHashtags,
            updatedAt: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
        });
    } catch (err) {
        return NextResponse.json({ trends: [], hashtags: [], updatedAt: null }, { status: 200 });
    }
}
