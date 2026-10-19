'use client';

import { useState, useCallback, useMemo, FormEvent } from 'react';

type TimeRange = '24h' | '48h' | '72h' | 'all';

interface TelegramPost {
  id: string;
  text: string;
  date: string;
  views?: number;
  url: string;
}

interface ScrapeResponse {
  channel: string;
  title?: string;
  range: TimeRange;
  rangeHours: number | null;
  posts: TelegramPost[];
  totalBeforeFilter: number;
  error?: string;
}

interface GoldPrices {
  karat22?: string;
  karat21?: string;
  karat18?: string;
}

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': 'Last 24 hours',
  '48h': 'Last 48 hours',
  '72h': 'Last 72 hours',
  all: 'All time',
};

export default function HomePage() {
  const [channelUsername, setChannelUsername] = useState('');
  const [filterText, setFilterText] = useState('');
  const [range, setRange] = useState<TimeRange>('24h');

  const [posts, setPosts] = useState<TelegramPost[]>([]);
  const [totalBeforeFilter, setTotalBeforeFilter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedChannel, setSearchedChannel] = useState<string | null>(null);
  const [appliedRange, setAppliedRange] = useState<TimeRange>('24h');

  const handleSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const username = channelUsername.trim().replace(/^@/, '');
      if (!username) {
        setError('Please enter a Telegram channel username.');
        return;
      }

      setLoading(true);
      setError(null);
      setPosts([]);
      setTotalBeforeFilter(0);
      setSearchedChannel(username);
      setAppliedRange(range);

      try {
        const res = await fetch(
          `/api/scrape?channel=${encodeURIComponent(username)}&range=${range}`
        );
        const data: ScrapeResponse = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || `Failed to fetch posts (Status: ${res.status})`);
        }

        setPosts(data.posts || []);
        setTotalBeforeFilter(data.totalBeforeFilter || 0);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while scraping.');
      } finally {
        setLoading(false);
      }
    },
    [channelUsername, range]
  );

  const allMatchedPosts = useMemo(() => {
    const q = filterText.trim().normalize('NFC').toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const text = (p.text || '').normalize('NFC').toLowerCase();
      const date = (p.date || '').normalize('NFC').toLowerCase();
      return text.includes(q) || date.includes(q);
    });
  }, [posts, filterText]);

  const displayedPosts = useMemo(() => {
    return allMatchedPosts.slice(0, 20);
  }, [allMatchedPosts]);

  const hasFilter = filterText.trim().length > 0;
  const hiddenByRange = totalBeforeFilter - posts.length;

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            🥇 Telegram Gold Scraper
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Search up to 100 posts from a public Telegram channel.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Channel */}
              <div className="md:col-span-1">
                <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Username
                </label>
                <div className="relative rounded-md shadow-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">@</span>
                  <input
                    id="channel"
                    type="text"
                    value={channelUsername}
                    onChange={(e) => setChannelUsername(e.target.value)}
                    placeholder="goldprices10"
                    disabled={loading}
                    className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Time range */}
              <div className="md:col-span-1">
                <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  id="range"
                  value={range}
                  onChange={(e) => setRange(e.target.value as TimeRange)}
                  disabled={loading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="48h">Last 48 hours</option>
                  <option value="72h">Last 72 hours</option>
                  <option value="all">All time</option>
                </select>
              </div>

              {/* Filter text */}
              <div className="md:col-span-1">
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Text
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    id="filter"
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="e.g., زێڕ"
                    className="block w-full pl-3 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
                  />
                  {hasFilter && (
                    <button
                      type="button"
                      onClick={() => setFilterText('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label="Clear filter"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Scraping up to 100 posts...' : 'Search Channel'}
            </button>
          </form>

          {hasFilter && (
            <div className="mt-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-sm">
              <span className="text-yellow-800">
                Filtering by: <strong>&quot;{filterText}&quot;</strong>
              </span>
              <button
                type="button"
                onClick={() => setFilterText('')}
                className="text-yellow-700 hover:text-yellow-900 font-medium underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {searchedChannel && !loading && !error && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Results from @{searchedChannel}
                <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-0.5 align-middle">
                  {RANGE_LABELS[appliedRange]}
                </span>
              </h2>
              <span className="text-sm text-gray-500">
                Showing top {displayedPosts.length} post{displayedPosts.length === 1 ? '' : 's'}
                {allMatchedPosts.length > 20 && ` (out of ${allMatchedPosts.length} matched)`}
                {posts.length > 0 && ` from ${posts.length} searched`}
                {hiddenByRange > 0 && ` · ${hiddenByRange} older hidden by range`}
              </span>
            </div>

            {displayedPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">
                  {posts.length === 0
                    ? hiddenByRange > 0
                      ? `No posts in the ${RANGE_LABELS[appliedRange].toLowerCase()}. Try a wider range.`
                      : 'No posts were returned. The channel might be private or the username is incorrect.'
                    : `No posts match your filter "${filterText}".`}
                </p>
                {hasFilter && posts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterText('')}
                    className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedPosts.map((post) => {
                  const goldPrices = extractGoldPrices(post.text);
                  const hasGoldData = goldPrices.karat22 || goldPrices.karat21 || goldPrices.karat18;

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">
                          Post #{post.id}
                        </span>
                        <span className="text-xs text-gray-400">
                          {post.date ? new Date(post.date).toLocaleString() : ''}
                        </span>
                      </div>

                      {/* Summary Box for 22, 21, and 18 Karat Gold Prices */}
                      {hasGoldData && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                            🏆 Gold Prices Summary
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                            {goldPrices.karat22 && (
                              <div className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                                <span className="block text-xs font-medium text-amber-700">Gold 22</span>
                                <span className="text-sm font-bold text-amber-950">{goldPrices.karat22} IQD</span>
                              </div>
                            )}
                            {goldPrices.karat21 && (
                              <div className="bg-amber-100/70 p-2 rounded border border-amber-300 shadow-sm">
                                <span className="block text-xs font-bold text-amber-800">Gold 21</span>
                                <span className="text-sm font-extrabold text-amber-950">{goldPrices.karat21} IQD</span>
                              </div>
                            )}
                            {goldPrices.karat18 && (
                              <div className="bg-white p-2 rounded border border-amber-100 shadow-sm">
                                <span className="block text-xs font-medium text-amber-700">Gold 18</span>
                                <span className="text-sm font-bold text-amber-950">{goldPrices.karat18} IQD</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                        {highlightMatches(post.text, filterText) || (
                          <span className="text-gray-400 italic">[No text content]</span>
                        )}
                      </p>
                      {post.url && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View on Telegram →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// Helper function to extract 22, 21, and 18 karat gold values
function extractGoldPrices(text: string): GoldPrices {
  if (!text) return {};

  const extractKarat = (karatNumber: string): string | undefined => {
    // Regex matches e.g. عەیار 22=1,028,000 or عيار 21 = 982,000
    const regex = new RegExp(`(?:عەیار|عيار)\\s*${karatNumber}\\s*[:=]\\s*([0-9,]+)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1];
    }

    // Line-by-line fallback searching for karat and equal/colon
    const lines = text.split('\n');
    for (const line of lines) {
      const normalizedLine = line.normalize('NFC');
      if (
        (normalizedLine.includes(`عەیار ${karatNumber}`) || normalizedLine.includes(`عيار ${karatNumber}`)) &&
        (normalizedLine.includes('=') || normalizedLine.includes(':'))
      ) {
        const parts = normalizedLine.split(/[:=]/);
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
    return undefined;
  };

  return {
    karat22: extractKarat('22'),
    karat21: extractKarat('21'),
    karat18: extractKarat('18'),
  };
}

function highlightMatches(text: string, query: string) {
  if (!query.trim()) return text;
  const normalizedQuery = query.normalize('NFC');
  const escaped = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  
  return text.split(regex).map((part, i) =>
    regex.test(part.normalize('NFC')) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}