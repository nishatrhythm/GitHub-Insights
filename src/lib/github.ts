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

// Type for repository with detailed language information
interface RepositoryWithLanguages {
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  languages: {
    edges: Array<{
      size: number;
      node: {
        name: string;
        color: string;
      };
    }>;
  } | null;
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
        isFork
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
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
    pullRequests(first: 1) {
      totalCount
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
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

/**
 * Calculates the exponential cumulative distribution function.
 * Used for metrics that follow exponential distribution (commits, PRs, issues, reviews).
 * @see https://github.com/anuraghazra/github-readme-stats/blob/master/src/calculateRank.js
 */
function exponentialCdf(x: number): number {
  return 1 - Math.pow(2, -x);
}

/**
 * Calculates the log-normal cumulative distribution function.
 * Used for metrics that follow log-normal distribution (stars, followers).
 * @see https://github.com/anuraghazra/github-readme-stats/blob/master/src/calculateRank.js
 */
function logNormalCdf(x: number): number {
  // Approximation: x / (1 + x)
  return x / (1 + x);
}

/**
 * Calculates the user's rank using the github-readme-stats algorithm.
 * 
 * The ranking scheme is based on the Japanese academic grading system:
 * - S (top 1%), A+ (12.5%), A (25%), A- (37.5%), B+ (50%), B (62.5%), B- (75%), C+ (87.5%), C (everyone)
 * 
 * The global percentile is calculated as a weighted sum of percentiles for each statistic,
 * based on the cumulative distribution function of the exponential and log-normal distributions.
 * 
 * @see https://github.com/anuraghazra/github-readme-stats/blob/master/src/calculateRank.js
 */
function calculateRank(stats: {
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  stars: number;
  followers: number;
  allCommits?: boolean;
}): { rank: string; percentile: number } {
  const { commits, prs, issues, reviews, stars, followers, allCommits = false } = stats;

  // Median values based on github-readme-stats research
  const COMMITS_MEDIAN = allCommits ? 1000 : 250;
  const COMMITS_WEIGHT = 2;
  const PRS_MEDIAN = 50;
  const PRS_WEIGHT = 3;
  const ISSUES_MEDIAN = 25;
  const ISSUES_WEIGHT = 1;
  const REVIEWS_MEDIAN = 2;
  const REVIEWS_WEIGHT = 1;
  const STARS_MEDIAN = 50;
  const STARS_WEIGHT = 4;
  const FOLLOWERS_MEDIAN = 10;
  const FOLLOWERS_WEIGHT = 1;

  const TOTAL_WEIGHT =
    COMMITS_WEIGHT +
    PRS_WEIGHT +
    ISSUES_WEIGHT +
    REVIEWS_WEIGHT +
    STARS_WEIGHT +
    FOLLOWERS_WEIGHT;

  // Calculate weighted percentile using CDF
  const rank =
    1 -
    (COMMITS_WEIGHT * exponentialCdf(commits / COMMITS_MEDIAN) +
      PRS_WEIGHT * exponentialCdf(prs / PRS_MEDIAN) +
      ISSUES_WEIGHT * exponentialCdf(issues / ISSUES_MEDIAN) +
      REVIEWS_WEIGHT * exponentialCdf(reviews / REVIEWS_MEDIAN) +
      STARS_WEIGHT * logNormalCdf(stars / STARS_MEDIAN) +
      FOLLOWERS_WEIGHT * logNormalCdf(followers / FOLLOWERS_MEDIAN)) /
    TOTAL_WEIGHT;

  // Rank thresholds (percentile) and levels based on Japanese academic grading
  const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];

  const percentile = rank * 100;
  const levelIndex = THRESHOLDS.findIndex((t) => percentile <= t);
  const level = LEVELS[levelIndex >= 0 ? levelIndex : LEVELS.length - 1];

  return { rank: level, percentile };
}

/**
 * Calculates language statistics using byte counts from all languages in repositories.
 * This follows the github-linguist standard approach where language percentages
 * are calculated based on the actual bytes of code for each language.
 * 
 * @see https://github.com/github-linguist/linguist
 * @see https://github.com/anuraghazra/github-readme-stats/blob/master/src/fetchers/top-languages.js
 */
function calculateLanguageStats(repositories: RepositoryWithLanguages[]): LanguageStats[] {
  const languageMap = new Map<string, { size: number; color: string; count: number }>();

  for (const repo of repositories) {
    if (repo.isFork) continue;
    if (!repo.languages?.edges) continue;

    for (const edge of repo.languages.edges) {
      const langName = edge.node.name;
      const langColor = edge.node.color || '#858585';
      const langSize = edge.size;

      const existing = languageMap.get(langName);
      if (existing) {
        existing.size += langSize;
        existing.count += 1;
      } else {
        languageMap.set(langName, {
          size: langSize,
          color: langColor,
          count: 1,
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
    const languages = calculateLanguageStats(user.repositories.nodes as unknown as RepositoryWithLanguages[]);

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

    // Calculate rank using github-readme-stats algorithm
    // Reviews are fetched from the API if available, otherwise estimated from PRs
    const totalReviews = user.contributionsCollection.totalPullRequestReviewContributions || 0;
    
    const { rank, percentile } = calculateRank({
      commits: user.contributionsCollection.totalCommitContributions,
      prs: user.contributionsCollection.totalPullRequestContributions,
      issues: user.contributionsCollection.totalIssueContributions,
      reviews: totalReviews,
      stars: totalStars,
      followers: user.followers.totalCount,
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
