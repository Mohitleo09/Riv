import { NextResponse } from 'next/server';

export const revalidate = 3600; // ISR: re-fetch from Google every 1 hour

// Strips CDATA wrappers and HTML tags from XML text nodes
function cleanXmlText(str: string): string {
    return str
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function extractTag(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? cleanXmlText(match[1]) : '';
}

export async function GET() {
    try {
        // Google Trends daily RSS — public, no API key needed
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

        // Extract <item> blocks
        const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

        const trends = itemBlocks.slice(0, 20).map((block) => {
            const topic = extractTag(block, 'title');
            const traffic = extractTag(block, 'ht:approx_traffic');
            // Grab the first news item's source for a "category" label
            const newsBlock = block.match(/<ht:news_item>([\s\S]*?)<\/ht:news_item>/)?.[1] || '';
            const source = extractTag(newsBlock, 'ht:news_item_source');

            return {
                topic,
                posts: traffic ? `${traffic} searches` : 'Trending now',
                category: source || 'Google Trends',
            };
        }).filter(t => t.topic.length > 0);

        return NextResponse.json(
            { trends, updatedAt: new Date().toISOString() },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
                },
            }
        );
    } catch (err) {
        console.error('[/api/trends] Failed to fetch Google Trends:', err);
        // Return empty so the UI falls back gracefully
        return NextResponse.json(
            { trends: [], updatedAt: null },
            { status: 200 }
        );
    }
}
