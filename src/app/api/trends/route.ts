import { NextResponse } from 'next/server';

// Revalidate every 30 minutes
export const revalidate = 1800;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatScore(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M points`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K points`;
    return `${n} points`;
}

function formatComments(n: number): string {
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K comments`;
    return `${n} comments`;
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

// Subreddit → friendly category label
function subredditToCategory(sub: string): string {
    const map: Record<string, string> = {
        worldnews: 'World News', news: 'News', technology: 'Technology',
        science: 'Science', politics: 'Politics', sports: 'Sports',
        gaming: 'Gaming', movies: 'Entertainment', television: 'Entertainment',
        music: 'Music', AskReddit: 'Discussion', todayilearned: 'Education',
        dataisbeautiful: 'Data', programming: 'Tech', nba: 'Sports',
        soccer: 'Sports', funny: 'Trending', videos: 'Video',
        explainlikeimfive: 'Education', business: 'Business',
        finance: 'Finance', investing: 'Finance', cryptocurrency: 'Crypto',
        futurology: 'Future', space: 'Science', environment: 'Environment',
    };
    return map[sub] ?? sub.charAt(0).toUpperCase() + sub.slice(1);
}

// ─── Reddit r/all hot ─────────────────────────────────────────────────────────
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

async function fetchRedditTrends() {
    const url = 'https://www.reddit.com/r/all/hot.json?limit=25&raw_json=1';
    const res = await fetch(url, {
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
        .filter(p => p.data.score > 100)
        .slice(0, 20)
        .map(p => ({
            topic: p.data.title.length > 80
                ? p.data.title.slice(0, 80) + '…'
                : p.data.title,
            posts: `${formatScore(p.data.score)} · ${formatComments(p.data.num_comments)}`,
            category: subredditToCategory(p.data.subreddit),
            hashtag: toHashtag(p.data.subreddit),
            source: 'reddit' as const,
        }));
}

// ─── Hacker News top stories ──────────────────────────────────────────────────
interface HNStory {
    title: string;
    score: number;
    descendants?: number;
    url?: string;
    by: string;
}

async function fetchHNTrends() {
    // Get top story IDs
    const idsRes = await fetch(
        'https://hacker-news.firebaseio.com/v0/topstories.json',
        { next: { revalidate: 1800 } }
    );
    if (!idsRes.ok) throw new Error('HN failed');
    const ids: number[] = await idsRes.json();

    // Fetch first 8 stories in parallel
    const stories = await Promise.allSettled(
        ids.slice(0, 8).map(id =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                .then(r => r.json() as Promise<HNStory>)
        )
    );

    return stories
        .filter((r): r is PromiseFulfilledResult<HNStory> => r.status === 'fulfilled' && !!r.value?.title)
        .map(r => r.value)
        .map(s => ({
            topic: s.title.length > 80 ? s.title.slice(0, 80) + '…' : s.title,
            posts: `${formatScore(s.score)} · ${formatComments(s.descendants ?? 0)}`,
            category: 'Hacker News',
            hashtag: toHashtag(s.title.split(' ').slice(0, 2).join(' ')),
            source: 'hn' as const,
        }));
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
    try {
        // Run both in parallel, tolerate individual failures
        const [redditResult, hnResult] = await Promise.allSettled([
            fetchRedditTrends(),
            fetchHNTrends(),
        ]);

        const redditTrends = redditResult.status === 'fulfilled' ? redditResult.value : [];
        const hnTrends = hnResult.status === 'fulfilled' ? hnResult.value : [];

        if (redditTrends.length === 0 && hnTrends.length === 0) {
            throw new Error('All trend sources failed');
        }

        // Merge: first 15 reddit + 5 HN (deduplicated by hashtag)
        const seen = new Set<string>();
        const trends = [...redditTrends, ...hnTrends].filter(t => {
            if (seen.has(t.hashtag)) return false;
            seen.add(t.hashtag);
            return true;
        }).slice(0, 20);

        // Hashtags: unique subreddit/topic-based chips from reddit + HN
        const hashtagSeen = new Set<string>();
        const hashtags = [
            ...redditTrends.map(t => ({ tag: t.hashtag, label: t.category, posts: t.posts })),
            ...hnTrends.map(t => ({ tag: 'hackernews', label: 'HackerNews', posts: 'Tech Trending' })),
        ].filter(h => {
            if (!h.tag || hashtagSeen.has(h.tag)) return false;
            hashtagSeen.add(h.tag);
            return true;
        }).slice(0, 14);

        return NextResponse.json(
            {
                trends,
                hashtags,
                sources: {
                    reddit: redditResult.status === 'fulfilled',
                    hn: hnResult.status === 'fulfilled',
                },
                updatedAt: new Date().toISOString(),
            },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
                },
            }
        );
    } catch (err) {
        console.error('[/api/trends] All sources failed:', err);
        return NextResponse.json(
            { trends: [], hashtags: [], sources: { reddit: false, hn: false }, updatedAt: null },
            { status: 200 }
        );
    }
}
