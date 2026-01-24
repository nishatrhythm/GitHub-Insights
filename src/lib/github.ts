import { GitHubUser, GitHubStats, LanguageStats, ContributionDay, StreakInfo, MonthlyContribution } from '@/types/github';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Pre-compute monthly contributions from daily data
function computeMonthlyContributions(contributionDays: ContributionDay[]): MonthlyContribution[] {
  const monthMap = new Map<string, number>();

  for (const day of contributionDays) {
    const date = new Date(day.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + day.contributionCount);
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => {
      const [year, m] = month.split('-');
      return {
        month,
        label: `${MONTH_NAMES[parseInt(m) - 1]} '${year.slice(2)}`,
        count
      };
    });
}

export const USER_QUERY = `
query($username: String!) {
  user(login: $username) {
    login
    name
    location
    followers { totalCount }
    createdAt

    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        isFork
        
        primaryLanguage {
          name
          color
        }

        languages(first: 10) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }

    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalRepositoryContributions

      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }

      contributionYears
    }
  }
}
`;

async function fetchYearContributions(username: string, year: number, token: string): Promise<ContributionDay[]> {
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { username, from, to },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    return [];
  }

  const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
  return weeks.flatMap((week: { contributionDays: ContributionDay[] }) => week.contributionDays);
}

async function fetchYearTotalContributions(username: string, year: number, token: string): Promise<number> {
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { username, from, to },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    return 0;
  }

  return data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0;
}

// Fetch contribution days for current year from Jan 1 to today (non-overlapping)
async function fetchCurrentYearContributionDays(username: string, token: string): Promise<ContributionDay[]> {
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const now = new Date();
  const currentYear = now.getFullYear();
  const from = `${currentYear}-01-01T00:00:00Z`;
  const to = now.toISOString();

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { username, from, to },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    return [];
  }

  const weeks = data.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
  return weeks.flatMap((week: { contributionDays: ContributionDay[] }) => week.contributionDays);
}

// Fetch contributions for the current year from Jan 1 to today (non-overlapping with past years)
async function fetchCurrentYearContributions(username: string, token: string): Promise<number> {
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;

  const now = new Date();
  const currentYear = now.getFullYear();
  const from = `${currentYear}-01-01T00:00:00Z`;
  // Use current date/time as the end
  const to = now.toISOString();

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { username, from, to },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    return 0;
  }

  return data.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions || 0;
}

function calculateStreaks(contributionDays: ContributionDay[]): { current: StreakInfo; longest: StreakInfo } {
  const emptyStreak: StreakInfo = { count: 0, startDate: '', endDate: '' };
  if (!contributionDays.length) return { current: emptyStreak, longest: emptyStreak };

  // Sort by date ascending for easier processing
  const sortedDays = [...contributionDays].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Remove duplicate dates and keep only unique days
  const uniqueDays: ContributionDay[] = [];
  const seenDates = new Set<string>();
  for (const day of sortedDays) {
    if (!seenDates.has(day.date)) {
      seenDates.add(day.date);
      uniqueDays.push(day);
    }
  }

  // Find all streaks - must check for consecutive days
  const streaks: StreakInfo[] = [];
  let currentStreakStart = '';
  let currentStreakEnd = '';
  let currentStreakCount = 0;
  let lastDate: Date | null = null;

  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    // Check if this day is consecutive to the last day
    let isConsecutive = false;
    if (lastDate) {
      const expectedDate = new Date(lastDate);
      expectedDate.setDate(expectedDate.getDate() + 1);
      isConsecutive = dayDate.getTime() === expectedDate.getTime();
    }

    if (day.contributionCount > 0) {
      if (currentStreakCount === 0 || !isConsecutive) {
        // Start a new streak
        if (currentStreakCount > 0) {
          // Save the previous streak
          streaks.push({
            count: currentStreakCount,
            startDate: currentStreakStart,
            endDate: currentStreakEnd
          });
        }
        currentStreakStart = day.date;
        currentStreakCount = 1;
      } else {
        // Continue the streak
        currentStreakCount++;
      }
      currentStreakEnd = day.date;
    } else {
      if (currentStreakCount > 0) {
        streaks.push({
          count: currentStreakCount,
          startDate: currentStreakStart,
          endDate: currentStreakEnd
        });
        currentStreakCount = 0;
      }
    }
    lastDate = dayDate;
  }

  // Don't forget the last streak if it ends at the last day
  if (currentStreakCount > 0) {
    streaks.push({
      count: currentStreakCount,
      startDate: currentStreakStart,
      endDate: currentStreakEnd
    });
  }

  // Find longest streak
  let longestStreak = emptyStreak;
  for (const streak of streaks) {
    if (streak.count > longestStreak.count) {
      longestStreak = streak;
    }
  }

  // Find current streak (the one that includes today or yesterday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let currentStreak = emptyStreak;
  for (const streak of streaks) {
    const endDate = new Date(streak.endDate);
    endDate.setHours(0, 0, 0, 0);
    if (endDate.getTime() === today.getTime() || endDate.getTime() === yesterday.getTime()) {
      currentStreak = streak;
      break;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

function calculateRank(stats: {
  commits: number;
  prs: number;
  issues: number;
  stars: number;
  followers: number;
  repos: number;
}): { rank: string; percentile: number } {
  const { commits, prs, issues, stars, followers, repos } = stats;

  // Weighted score calculation
  const score =
    commits * 1 +
    prs * 3 +
    issues * 2 +
    stars * 4 +
    followers * 2 +
    repos * 1;

  // Rank thresholds
  if (score >= 10000) return { rank: 'S+', percentile: 1 };
  if (score >= 5000) return { rank: 'S', percentile: 5 };
  if (score >= 2500) return { rank: 'A+', percentile: 10 };
  if (score >= 1000) return { rank: 'A', percentile: 25 };
  if (score >= 500) return { rank: 'B+', percentile: 40 };
  if (score >= 250) return { rank: 'B', percentile: 55 };
  if (score >= 100) return { rank: 'C+', percentile: 70 };
  if (score >= 50) return { rank: 'C', percentile: 85 };
  return { rank: 'C', percentile: 100 };
}

function calculateLanguageStats(
  repositories: GitHubUser['repositories']['nodes']
): LanguageStats[] {
  const languageMap = new Map<string, { size: number; color: string }>();

  for (const repo of repositories) {
    if (repo.isFork) continue;

    if (repo.primaryLanguage) {
      const lang = repo.primaryLanguage;
      const existing = languageMap.get(lang.name);

      if (existing) {
        existing.size += starWeight;
      } else {
        languageMap.set(lang.name, {
          size: starWeight,
          color: lang.color ?? "#858585",
        });
      }
    }

    // Multi-language breakdown
    if (repo.languages?.edges) {
      for (const edge of repo.languages.edges) {
        const lang = edge.node;
        const weightedSize = edge.size * starWeight;

        const existing = languageMap.get(lang.name);
        if (existing) {
          existing.size += weightedSize;
        } else {
          languageMap.set(lang.name, {
            size: weightedSize,
            color: lang.color || "#858585",
          });
        }
      }
    }
  }

  const totalSize = Array.from(languageMap.values()).reduce((sum, lang) => sum + lang.size, 0);

  const languages: LanguageStats[] = Array.from(languageMap.entries())
    .map(([name, { size, color }]) => ({
      name,
      color,
      size,
      percentage: totalSize > 0 ? (size / totalSize) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
}

// In-memory cache with stale-while-revalidate pattern
// Note: On edge/serverless, this cache persists only within a warm instance
// The primary caching happens at the CDN level via Cache-Control headers
const cache = new Map<string, { data: GitHubStats; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - fresh data
const STALE_TTL = 60 * 60 * 1000; // 60 minutes - serve stale while revalidating

// Track ongoing revalidation requests to prevent duplicate fetches
const revalidationInProgress = new Set<string>();

// Fast fetch with aggressive timeout for GitHub's 4-second Camo proxy limit
// We need to return SOMETHING within 4 seconds or GitHub shows broken image
const FAST_TIMEOUT = 3000; // 3 seconds for main data (leaves buffer for response)
const EXTENDED_TIMEOUT = 6000; // 6 seconds for background revalidation

/**
 * Fetch with timeout helper - critical for meeting GitHub Camo's 4s limit
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fast path: Fetch only essential data needed for a basic card
 * This prioritizes speed over completeness to meet GitHub's timeout
 */
async function fetchEssentialStats(username: string, token: string): Promise<GitHubStats> {
  const response = await fetchWithTimeout(
    GITHUB_GRAPHQL_API,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: USER_QUERY,
        variables: { username },
      }),
    },
    FAST_TIMEOUT
  );

  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error(data.errors[0]?.message || 'Failed to fetch GitHub data');
  }

  if (!data.data?.user) {
    throw new Error(`User "${username}" not found`);
  }

  const user: GitHubUser = data.data.user;

  // Calculate totals from main query (no additional API calls needed)
  const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
  const totalForks = user.repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0);

  // Use rolling window data for contribution graph (already in response)
  const contributionDays = user.contributionsCollection.contributionCalendar.weeks
    .flatMap(week => week.contributionDays);

  // Calculate streaks from available data (rolling ~1 year)
  const streaks = calculateStreaks(contributionDays);
  const languages = calculateLanguageStats(user.repositories.nodes);

  const { rank, percentile } = calculateRank({
    commits: user.contributionsCollection.totalCommitContributions,
    prs: user.contributionsCollection.totalPullRequestContributions,
    issues: user.contributionsCollection.totalIssueContributions,
    stars: totalStars,
    followers: user.followers.totalCount,
    repos: user.repositories.totalCount,
  });

  // Use the rolling total as estimate (accurate enough for display)
  // The all-time total will be fetched in background if needed
  const totalContributionsAllTime = user.contributionsCollection.contributionCalendar.totalContributions;

  return {
    user,
    totalStars,
    totalForks,
    totalCommits: user.contributionsCollection.totalCommitContributions,
    totalPRs: user.contributionsCollection.totalPullRequestContributions,
    totalIssues: user.contributionsCollection.totalIssueContributions,
    totalContributions: user.contributionsCollection.contributionCalendar.totalContributions,
    totalContributionsAllTime,
    contributedRepos: user.contributionsCollection.totalRepositoryContributions,
    languages,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    accountCreatedAt: user.createdAt,
    contributionData: contributionDays,
    monthlyContributions: computeMonthlyContributions(contributionDays),
    rank,
    rankPercentile: percentile,
  };
}

/**
 * Full fetch: Gets complete historical data (may be slow)
 * Used for background revalidation
 */
async function fetchFullStats(username: string, token: string): Promise<GitHubStats> {
  // Start with essential stats
  const baseStats = await fetchEssentialStats(username, token);
  const user = baseStats.user;
  
  const currentYear = new Date().getFullYear();
  const years = user.contributionsCollection.contributionYears || [currentYear];

  // Fetch historical data for more accurate streaks (only if multiple years)
  let allContributionDays = baseStats.contributionData;
  let totalContributionsAllTime = baseStats.totalContributionsAllTime;

  if (years.length > 1) {
    try {
      // Fetch all years in parallel with extended timeout
      const yearDaysResults = await Promise.all(
        years.map(year => {
          if (year === currentYear) {
            return fetchCurrentYearContributionDays(username, token);
          } else {
            return fetchYearContributions(username, year, token);
          }
        })
      );

      allContributionDays = yearDaysResults.flat();

      // Calculate accurate all-time contributions
      const pastYears = years.filter(y => y < currentYear);
      const [currentYearTotal, ...pastYearTotals] = await Promise.all([
        fetchCurrentYearContributions(username, token),
        ...pastYears.map(year => fetchYearTotalContributions(username, year, token))
      ]);

      totalContributionsAllTime = currentYearTotal + pastYearTotals.reduce((sum, total) => sum + total, 0);
    } catch (error) {
      console.error('Error fetching historical data, using rolling data:', error);
      // Keep using the rolling data from baseStats
    }
  }

  // Recalculate streaks with full history
  const streaks = calculateStreaks(allContributionDays);

  return {
    ...baseStats,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalContributionsAllTime,
    contributionData: baseStats.contributionData, // Keep rolling data for graph
  };
}

export async function fetchGitHubStats(username: string): Promise<GitHubStats> {
  const cacheKey = username.toLowerCase();
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // Return fresh cached data immediately
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Return stale data immediately while revalidating in background
  // This is the KEY fix for GitHub's Camo timeout issue
  if (cached && now - cached.timestamp < STALE_TTL) {
    // Trigger background revalidation if not already in progress
    if (!revalidationInProgress.has(cacheKey)) {
      revalidationInProgress.add(cacheKey);
      
      // Fire and forget - don't await
      fetchAndCacheStats(username, cacheKey, true).finally(() => {
        revalidationInProgress.delete(cacheKey);
      });
    }
    
    // Return stale data immediately (fast response!)
    return cached.data;
  }

  // No cache available - must fetch fresh data
  return fetchAndCacheStats(username, cacheKey, false);
}

async function fetchAndCacheStats(
  username: string,
  cacheKey: string,
  isBackgroundRevalidation: boolean
): Promise<GitHubStats> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GitHub token is not configured');
  }

  try {
    let result: GitHubStats;

    if (isBackgroundRevalidation) {
      // Background: Can take more time, fetch full data
      result = await fetchFullStats(username, token);
    } else {
      // Foreground: Must be fast! Use essential-only fetch
      // Then trigger background fetch for full data
      result = await fetchEssentialStats(username, token);
      
      // Queue background fetch for full data (non-blocking)
      if (!revalidationInProgress.has(cacheKey + '_full')) {
        revalidationInProgress.add(cacheKey + '_full');
        fetchFullStats(username, token)
          .then(fullResult => {
            cache.set(cacheKey, { data: fullResult, timestamp: Date.now() });
          })
          .catch(err => console.error('Background full fetch failed:', err))
          .finally(() => revalidationInProgress.delete(cacheKey + '_full'));
      }
    }

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    // If we have stale data and the fetch failed, return stale data
    const staleData = cache.get(cacheKey);
    if (staleData) {
      console.warn('Fetch failed, returning stale data:', error);
      return staleData.data;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - GitHub API is slow');
    }
    throw error;
  }
}
