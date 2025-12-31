import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubStats } from '@/lib/github';
import { generateInsightCard } from '@/lib/card-generator';
import { getTheme } from '@/lib/themes';

export const runtime = 'nodejs';
export const revalidate = 3600; // Cache for 1 hour

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

  if (!username) {
    return new NextResponse(
      generateErrorCard('Username is required', getTheme('github_dark')),
      {
        status: 400,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }

  try {
    const stats = await fetchGitHubStats(username);
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

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
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
          'Cache-Control': 'no-cache',
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
  <text x="250" y="50" text-anchor="middle" font-size="18" font-weight="bold" fill="#f85149" font-family="Segoe UI, Ubuntu, Sans-Serif">
    ⚠️ Error
  </text>
  <text x="250" y="80" text-anchor="middle" font-size="14" fill="${theme.text}" font-family="Segoe UI, Ubuntu, Sans-Serif">
    ${message}
  </text>
</svg>
  `.trim();
}
