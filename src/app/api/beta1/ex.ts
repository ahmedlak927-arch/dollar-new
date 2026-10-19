import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

type TimeRange = '24h' | '48h' | '72h' | 'all';

const RANGE_HOURS: Record<TimeRange, number | null> = {
  '24h': 24,
  '48h': 48,
  '72h': 72,
  all: null,
};

const TARGET_POST_COUNT = 100;
const MAX_SCRAPE_ITERATIONS = 6;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');
  const range = (searchParams.get('range') || '24h') as TimeRange;

  if (!channel) {
    return NextResponse.json({ error: 'Channel required' }, { status: 400 });
  }

  try {
    const allPosts: any[] = [];
    const seenIds = new Set<string>();
    let beforeCursor: string | null = null;
    let iteration = 0;

    while (allPosts.length < TARGET_POST_COUNT && iteration < MAX_SCRAPE_ITERATIONS) {
      iteration++;

      const fetchUrl = beforeCursor
        ? `https://t.me/s/${encodeURIComponent(channel)}?before=${beforeCursor}`
        : `https://t.me/s/${encodeURIComponent(channel)}`;

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        next: { revalidate: 30 },
      });

      if (!res.ok) {
        if (allPosts.length === 0) {
          return NextResponse.json(
            { error: 'Channel not found or is private' },
            { status: 404 }
          );
        }
        break;
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const newPostsBatch: any[] = [];

      $('.tgme_widget_message_wrap').each((_, el) => {
        const text = $(el).find('.tgme_widget_message_text').text().trim();
        const date = $(el).find('time').attr('datetime') || '';
        const rawId = $(el).attr('data-post') || '';
        const id = rawId.split('/').pop() || Math.random().toString();

        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          if (text) {
            newPostsBatch.push({
              id,
              text,
              date,
              url: `https://t.me/${channel}/${id}`,
            });
          }
        }
      });

      if (newPostsBatch.length === 0) {
        break;
      }

      allPosts.push(...newPostsBatch);

      const firstMessageLink = $('.tgme_widget_message').first().attr('data-post');
      if (firstMessageLink) {
        const oldestId = firstMessageLink.split('/').pop();
        if (oldestId && oldestId !== beforeCursor) {
          beforeCursor = oldestId;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    const totalBeforeFilter = allPosts.length;
    const rangeHours = RANGE_HOURS[range] ?? null;

    let filteredPosts = allPosts;

    if (rangeHours !== null) {
      const cutoffTime = new Date().getTime() - rangeHours * 60 * 60 * 1000;
      filteredPosts = allPosts.filter((post) => {
        if (!post.date) return false;
        const postTime = new Date(post.date).getTime();
        return postTime >= cutoffTime;
      });
    }

    const finalPosts = filteredPosts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, TARGET_POST_COUNT);

    return NextResponse.json({
      channel,
      range,
      rangeHours,
      posts: finalPosts,
      totalBeforeFilter,
    });
  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json(
      { error: 'Failed to scrape channel posts' },
      { status: 500 }
    );
  }
}