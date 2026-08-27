import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubStats } from '@/lib/github';
import { generateInsightCard } from '@/lib/card-generator';
import { getTheme } from '@/lib/themes';

function generateETag(content: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `"${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)}"`;
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
  const hideLangs = searchParams.get('hide_langs');
  const hiddenLanguages = hideLangs ? hideLangs.split(',').map(l => l.trim()).filter(Boolean) : [];

  if (!username) {
    return new NextResponse(
      generateErrorCard('Username is required', getTheme('github_dark')),
      {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }

  try {
    const stats = await fetchGitHubStats(username, hiddenLanguages);
    const theme = getTheme(themeName);
    
    const svg = generateInsightCard(stats, {
      theme,
      showGraph,
      showLanguages,
      showStreak,
      showStats,
      showHeader,
      showSummary,
      showProfile,
    });

    const etag = generateETag(svg);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
        },
      });
    }

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'ETag': etag,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error generating insight card:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate stats';
    
    return new NextResponse(
      generateErrorCard(errorMessage, getTheme('github_dark')),
      {
        status: 500,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

function generateErrorCard(message: string, theme: ReturnType<typeof getTheme>): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="120" viewBox="0 0 500 120">
  <rect x="0" y="0" width="500" height="120" rx="12" fill="${theme.background}"/>
  <rect x="0" y="0" width="500" height="120" rx="12" fill="none" stroke="#f85149" stroke-width="2"/>
  <text x="250" y="50" text-anchor="middle" font-size="18" font-weight="bold" fill="#f85149" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'">
    ⚠️ Error
  </text>
  <text x="250" y="80" text-anchor="middle" font-size="14" fill="${theme.text}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'">
    ${message}
  </text>
</svg>
  `.trim();
}