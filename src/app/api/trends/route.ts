import { NextResponse } from 'next/server';

export const revalidate = 3600;

function cleanXmlText(str: string): string {
    return str.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim();
}

function extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? cleanXmlText(match[1]) : '';
}

// Convert a topic string to a camelCase hashtag
function toHashtag(topic: string): string {
    return topic
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) => i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join('');
}

export async function GET() {
    try {
        const res = await fetch(
            'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
            {
                next: { revalidate: 3600 },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Rival/1.0)',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                },
            }
        );

        if (!res.ok) throw new Error(`Google Trends responded ${res.status}`);

        const xml = await res.text();
        const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        const trends = itemBlocks.slice(0, 20).map((block) => {
            const topic = extractTag(block, 'title');
            const traffic = extractTag(block, 'ht:approx_traffic');
            const newsBlock = block.match(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/)?.[1] || '';
            const source = extractTag(newsBlock, 'ht:news_item_source');

            return {
                topic,
                posts: traffic ? `${traffic} searches` : 'Trending now',
                category: source || 'Google Trends',
                hashtag: toHashtag(topic),
            };
        }).filter(t => t.topic.length > 0);

        // Top hashtags derived from trending topics
        const hashtags = trends.slice(0, 12).map(t => ({
            tag: t.hashtag,
            label: t.topic,
            posts: t.posts,
        }));

        return NextResponse.json(
            { trends, hashtags, updatedAt: new Date().toISOString() },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                },
            }
        );
    } catch (err) {
        console.error('[/api/trends] Failed:', err);
        return NextResponse.json({ trends: [], hashtags: [], updatedAt: null }, { status: 200 });
    }
}
