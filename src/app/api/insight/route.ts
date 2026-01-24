import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubStats } from '@/lib/github';
import { generateInsightCard } from '@/lib/card-generator';
import { getTheme } from '@/lib/themes';

// Use edge runtime for faster cold starts (critical for GitHub's 4s timeout)
export const runtime = 'edge';
export const preferredRegion = 'auto';

// GitHub's Camo proxy has a 4-second timeout
// We MUST respond within this time or the image breaks
const CAMO_TIMEOUT = 3800; // 3.8 seconds (with buffer for network latency)

// Cache headers optimized for GitHub's Camo proxy
// GitHub's camo proxy caches images and has a 4-second timeout
// We use aggressive caching to ensure fast responses
const CACHE_HEADERS = {
  'Content-Type': 'image/svg+xml',
  'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
  // Vercel-specific: Allow serving stale content while revalidating
  'CDN-Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
  // Important: Tell Camo to cache for 30 minutes
  'X-Robots-Tag': 'noindex',
} as const;

const ERROR_CACHE_HEADERS = {
  'Content-Type': 'image/svg+xml',
  // Don't cache errors for long - allow retry
  'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
} as const;

// Loading card shown when data is still being fetched
// This helps prevent broken images by always returning valid SVG
const LOADING_CACHE_HEADERS = {
  'Content-Type': 'image/svg+xml',
  // Very short cache - just enough to prevent thundering herd
  'Cache-Control': 'public, max-age=10, s-maxage=10, stale-while-revalidate=30',
} as const;

/**
 * Promise.race with timeout - ensures we always respond in time
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const themeName = searchParams.get('theme') || 'github_dark';
  const showGraph = searchParams.get('graph') !== 'false';
  const showLanguages = searchParams.get('languages') !== 'false';
  const showStreak = searchParams.get('streak') !== 'false';
  const showStats = searchParams.get('stats') !== 'false';
  const showHeader = searchParams.get('header') !== 'false';
  const showSummary = searchParams.get('summary') !== 'false';
  const showProfile = searchParams.get('profile') !== 'false';

  const theme = getTheme(themeName);

  if (!username) {
    return new NextResponse(
      generateErrorCard('Username is required', theme),
      {
        status: 400,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }

  // Use a timeout wrapper to ensure we respond within GitHub's Camo timeout
  // If fetching takes too long, show a loading card instead of timing out
  const TIMEOUT_SYMBOL = Symbol('timeout');
  
  try {
    const result = await withTimeout(
      fetchGitHubStats(username),
      CAMO_TIMEOUT,
      TIMEOUT_SYMBOL as unknown as Awaited<ReturnType<typeof fetchGitHubStats>>
    );

    // If we timed out, return a loading card that prompts a retry
    if (result === TIMEOUT_SYMBOL) {
      console.warn(`Request for ${username} timed out, returning loading card`);
      return new NextResponse(
        generateLoadingCard(username, theme),
        {
          status: 200, // Return 200 so Camo caches it briefly
          headers: LOADING_CACHE_HEADERS,
        }
      );
    }

    const svg = generateInsightCard(result, {
      theme,
      showGraph,
      showLanguages,
      showStreak,
      showStats,
      showHeader,
      showSummary,
      showProfile,
    });

    return new NextResponse(svg, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Error generating insight card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate stats';
    
    return new NextResponse(
      generateErrorCard(errorMessage, theme),
      {
        status: 500,
        headers: ERROR_CACHE_HEADERS,
      }
    );
  }
}

function generateLoadingCard(username: string, theme: ReturnType<typeof getTheme>): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .loading-text { animation: pulse 1.5s ease-in-out infinite; }
  </style>
  <rect x="0" y="0" width="500" height="120" rx="12" fill="${theme.background}"/>
  <rect x="0" y="0" width="500" height="120" rx="12" fill="none" stroke="${theme.border}" stroke-width="1"/>
  <text x="250" y="50" text-anchor="middle" font-size="16" font-weight="600" fill="${theme.accent}" font-family="Segoe UI, Ubuntu, Sans-Serif" class="loading-text">
    Loading stats for @${username}...
  </text>
  <text x="250" y="80" text-anchor="middle" font-size="12" fill="${theme.textSecondary}" font-family="Segoe UI, Ubuntu, Sans-Serif">
    Refresh in a few seconds
  </text>
</svg>
  `.trim();
}

function generateErrorCard(message: string, theme: ReturnType<typeof getTheme>): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <rect x="0" y="0" width="500" height="120" rx="12" fill="${theme.background}"/>
  <rect x="0" y="0" width="500" height="120" rx="12" fill="none" stroke="#f85149" stroke-width="2"/>
  <text x="250" y="50" text-anchor="middle" font-size="18" font-weight="bold" fill="#f85149" font-family="Segoe UI, Ubuntu, Sans-Serif">
    ⚠️ Error
  </text>
  <text x="250" y="80" text-anchor="middle" font-size="14" fill="${theme.text}" font-family="Segoe UI, Ubuntu, Sans-Serif">
    ${message}
  </text>
</svg>
  `.trim();
}
