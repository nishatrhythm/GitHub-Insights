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

const USER_QUERY = `
query($username: String!) {
  user(login: $username) {
    login
    name
    location
    followers { totalCount }
    createdAt
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}, privacy: PUBLIC) {
      totalCount
      nodes {
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        isFork
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

function calculateLanguageStats(repositories: GitHubUser['repositories']['nodes']): LanguageStats[] {
  const languageMap = new Map<string, { size: number; color: string }>();

  for (const repo of repositories) {
    if (repo.isFork) continue;

    if (repo.primaryLanguage) {
      const existing = languageMap.get(repo.primaryLanguage.name);
      if (existing) {
        existing.size += repo.stargazerCount + 1; // Weight by stars
      } else {
        languageMap.set(repo.primaryLanguage.name, {
          size: repo.stargazerCount + 1,
          color: repo.primaryLanguage.color || '#858585',
        });
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
    .slice(0, 8); // Top 8 languages

  return languages;
}

// Simple in-memory cache
const cache = new Map<string, { data: GitHubStats; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export async function fetchGitHubStats(username: string): Promise<GitHubStats> {
  const cacheKey = username.toLowerCase();
  const cached = cache.get(cacheKey);

  // Return cached data if valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GitHub token is not configured');
  }

  // Create abort controller with 8 second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Fetch main user data
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: USER_QUERY,
        variables: { username },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'Failed to fetch GitHub data');
    }

    if (!data.data?.user) {
      throw new Error(`User "${username}" not found`);
    }

    const user: GitHubUser = data.data.user;

    // Calculate totals
    const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
    const totalForks = user.repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0);

    // Get contribution years from API
    const currentYear = new Date().getFullYear();
    const years = user.contributionsCollection.contributionYears || [currentYear];

    // For streak calculation, we need contribution days using NON-OVERLAPPING date ranges
    // to avoid duplicate days. We fetch all years of contributions to ensure the longest
    // streak is accurately calculated across the user's entire history.
    let allContributionDays: ContributionDay[] = [];

    try {
      // Fetch all years in parallel
      const yearDaysResults = await Promise.all(
        years.map(year => {
          if (year === currentYear) {
            return fetchCurrentYearContributionDays(username, token);
          } else {
            return fetchYearContributions(username, year, token);
          }
        })
      );

      // Flatten all days into a single array
      allContributionDays = yearDaysResults.flat();
    } catch (error) {
      console.error('Error fetching historical contribution days:', error);
      // Fallback to rolling window data if fetching fails (less accurate but functional)
      allContributionDays = user.contributionsCollection.contributionCalendar.weeks
        .flatMap(week => week.contributionDays);
    }

    // Use the rolling window data for the contribution graph display
    // (this is the expected behavior - shows last ~12 months of activity)
    const contributionDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap(week => week.contributionDays);

    const streaks = calculateStreaks(allContributionDays);
    const languages = calculateLanguageStats(user.repositories.nodes);

    // Calculate all-time contributions using NON-OVERLAPPING date ranges
    // to avoid double-counting that occurs when using the rolling ~1-year total.
    // 
    // The rolling total from contributionCalendar.totalContributions covers
    // approximately the last 365 days, which overlaps with part of the previous year.
    // Instead, we fetch:
    // 1. Current year: Jan 1 to today (partial year)
    // 2. Past years: Full calendar years (Jan 1 - Dec 31)
    // This ensures no overlap and accurate lifetime totals.

    let totalContributionsAllTime = 0;

    // Get past years (full calendar years, excluding current year)
    const pastYears = years.filter(y => y < currentYear);

    try {
      // Fetch current year (Jan 1 to today) and all past years in parallel
      const [currentYearTotal, ...pastYearTotals] = await Promise.all([
        fetchCurrentYearContributions(username, token),
        ...pastYears.map(year => fetchYearTotalContributions(username, year, token))
      ]);

      totalContributionsAllTime = currentYearTotal + pastYearTotals.reduce((sum, total) => sum + total, 0);
    } catch {
      // Fallback to rolling total if fetching fails (less accurate but better than nothing)
      totalContributionsAllTime = user.contributionsCollection.contributionCalendar.totalContributions;
    }

    const { rank, percentile } = calculateRank({
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      stars: totalStars,
      followers: user.followers.totalCount,
      repos: user.repositories.totalCount,
    });

    const result: GitHubStats = {
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

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - GitHub API is slow');
    }
    throw error;
  }
}
