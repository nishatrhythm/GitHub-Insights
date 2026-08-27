import { GitHubUser, GitHubStats, LanguageStats, ContributionDay, StreakInfo, MonthlyContribution } from '@/types/github';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeMonthlyContributions(contributionDays: ContributionDay[]): MonthlyContribution[] {
  const monthMap = new Map<string, number>();

  for (const day of contributionDays) {
    const monthKey = day.date.slice(0, 7); // 'YYYY-MM'
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + day.contributionCount);
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => {
      const [year, m] = month.split('-');
      return {
        month,
        label: `${MONTH_NAMES[parseInt(m, 10) - 1]} '${year.slice(2)}`,
        count
      };
    });
}

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

const USER_COMBINED_QUERY = `
query($username: String!) {
  user(login: $username) {
    login
    name
    location
    createdAt
    followers { totalCount }
    pullRequests(first: 1) {
      totalCount
    }
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalRepositoryContributions
      contributionYears
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
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
  }
}
`;

async function fetchHistoricalContributions(
  username: string,
  years: number[],
  token: string,
  signal: AbortSignal
): Promise<ContributionDay[]> {
  if (!years.length) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const nowIso = now.toISOString();

  // Construct a single batched query with aliases for each year
  const yearQueries = years.map(year => {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear ? nowIso : `${year}-12-31T23:59:59Z`;
    return `
      y${year}: contributionsCollection(from: "${from}", to: "${to}") {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    `;
  }).join('\n');

  const query = `
    query($username: String!) {
      user(login: $username) {
        ${yearQueries}
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { username },
    }),
    signal,
  });

  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL historical contributions errors:', data.errors);
    return [];
  }

  const userData = data.data?.user;
  if (!userData) return [];

  const allDays: ContributionDay[] = [];
  for (const year of years) {
    const weeks = userData[`y${year}`]?.contributionCalendar?.weeks || [];
    for (const week of weeks) {
      if (week.contributionDays) {
        allDays.push(...week.contributionDays);
      }
    }
  }

  return allDays;
}

function calculateStreaks(contributionDays: ContributionDay[]): { current: StreakInfo; longest: StreakInfo } {
  const emptyStreak: StreakInfo = { count: 0, startDate: '', endDate: '' };
  if (!contributionDays.length) return { current: emptyStreak, longest: emptyStreak };

  const seenDates = new Set<string>();
  const uniqueDays: ContributionDay[] = [];
  
  // Sort chronologically by ISO date string
  const sortedDays = [...contributionDays].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  for (const day of sortedDays) {
    if (!seenDates.has(day.date)) {
      seenDates.add(day.date);
      uniqueDays.push(day);
    }
  }

  const streaks: StreakInfo[] = [];
  let currentStreakStart = '';
  let currentStreakEnd = '';
  let currentStreakCount = 0;
  let lastTime = 0;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];
    const dayTime = Date.parse(day.date + 'T00:00:00Z');
    const isConsecutive = lastTime > 0 && Math.round((dayTime - lastTime) / ONE_DAY_MS) === 1;

    if (day.contributionCount > 0) {
      if (currentStreakCount === 0 || !isConsecutive) {
        if (currentStreakCount > 0) {
          streaks.push({
            count: currentStreakCount,
            startDate: currentStreakStart,
            endDate: currentStreakEnd
          });
        }
        currentStreakStart = day.date;
        currentStreakCount = 1;
      } else {
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
    lastTime = dayTime;
  }

  if (currentStreakCount > 0) {
    streaks.push({
      count: currentStreakCount,
      startDate: currentStreakStart,
      endDate: currentStreakEnd
    });
  }

  let longestStreak = emptyStreak;
  for (const streak of streaks) {
    if (streak.count > longestStreak.count) {
      longestStreak = streak;
    }
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  today.setUTCDate(today.getUTCDate() - 1);
  const yesterdayStr = today.toISOString().split('T')[0];

  let currentStreak = emptyStreak;
  for (const streak of streaks) {
    if (streak.endDate === todayStr || streak.endDate === yesterdayStr) {
      currentStreak = streak;
      break;
    }
  }

  return { current: currentStreak, longest: longestStreak };
}

function exponentialCdf(x: number): number {
  return 1 - Math.pow(2, -x);
}

function logNormalCdf(x: number): number {
  return x / (1 + x);
}

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

  const rank =
    1 -
    (COMMITS_WEIGHT * exponentialCdf(commits / COMMITS_MEDIAN) +
      PRS_WEIGHT * exponentialCdf(prs / PRS_MEDIAN) +
      ISSUES_WEIGHT * exponentialCdf(issues / ISSUES_MEDIAN) +
      REVIEWS_WEIGHT * exponentialCdf(reviews / REVIEWS_MEDIAN) +
      STARS_WEIGHT * logNormalCdf(stars / STARS_MEDIAN) +
      FOLLOWERS_WEIGHT * logNormalCdf(followers / FOLLOWERS_MEDIAN)) /
    TOTAL_WEIGHT;

  const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];

  const percentile = rank * 100;
  const levelIndex = THRESHOLDS.findIndex((t) => percentile <= t);
  const level = LEVELS[levelIndex >= 0 ? levelIndex : LEVELS.length - 1];

  return { rank: level, percentile };
}

function calculateLanguageStats(repositories: RepositoryWithLanguages[], hiddenLanguages: Set<string> = new Set()): LanguageStats[] {
  const languageMap = new Map<string, { size: number; color: string; count: number }>();
  let totalSize = 0;

  for (const repo of repositories) {
    if (repo.isFork || !repo.languages?.edges) continue;

    for (const edge of repo.languages.edges) {
      const langName = edge.node.name;
      if (hiddenLanguages.has(langName.toLowerCase())) continue;
      const langColor = edge.node.color || '#858585';
      const langSize = edge.size;
      totalSize += langSize;

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

  const languages: LanguageStats[] = Array.from(languageMap.entries())
    .map(([name, { size, color }]) => ({
      name,
      color,
      size,
      percentage: totalSize > 0 ? (size / totalSize) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);

  return languages;
}

const cache = new Map<string, { data: GitHubStats; timestamp: number }>();
const pendingRequests = new Map<string, Promise<GitHubStats>>();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

function setInCache(key: string, data: GitHubStats): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now - v.timestamp >= CACHE_TTL) {
        cache.delete(k);
      }
    }
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
  }
  cache.set(key, { data, timestamp: Date.now() });
}

async function executeFetchGitHubStats(username: string, hiddenLanguages: string[] = []): Promise<GitHubStats> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GitHub token is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(GITHUB_GRAPHQL_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: USER_COMBINED_QUERY,
        variables: { username },
      }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL query errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'Failed to fetch GitHub stats');
    }

    if (!data.data?.user) {
      throw new Error(`User "${username}" not found`);
    }

    const rawUser = data.data.user;
    const user: GitHubUser = {
      login: rawUser.login,
      name: rawUser.name,
      location: rawUser.location,
      createdAt: rawUser.createdAt,
      followers: rawUser.followers || { totalCount: 0 },
      pullRequests: rawUser.pullRequests || { totalCount: 0 },
      repositories: rawUser.repositories || { totalCount: 0, nodes: [] },
      contributionsCollection: rawUser.contributionsCollection || {
        totalCommitContributions: 0,
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalRepositoryContributions: 0,
        contributionYears: [new Date().getFullYear()],
        contributionCalendar: { totalContributions: 0, weeks: [] },
      },
    };

    const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
    const totalForks = user.repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0);

    const currentYear = new Date().getFullYear();
    const years = user.contributionsCollection.contributionYears || [currentYear];

    const currentYearDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap(week => week.contributionDays || []);

    let allContributionDays: ContributionDay[] = [];
    let historicalFetchSuccess = false;

    if (years.length > 1) {
      try {
        const historicalDays = await fetchHistoricalContributions(username, years, token, controller.signal);
        if (historicalDays.length > 0) {
          allContributionDays = historicalDays;
          historicalFetchSuccess = true;
        } else {
          allContributionDays = currentYearDays;
        }
      } catch (error) {
        console.error('Error fetching historical contribution days:', error);
        allContributionDays = currentYearDays;
      }
    } else {
      allContributionDays = currentYearDays;
      historicalFetchSuccess = true;
    }

    clearTimeout(timeoutId);

    const streaks = calculateStreaks(allContributionDays);
    const hiddenLangsSet = new Set(hiddenLanguages.map(l => l.toLowerCase()));
    const languages = calculateLanguageStats(user.repositories.nodes as unknown as RepositoryWithLanguages[], hiddenLangsSet);

    let totalContributionsAllTime = 0;
    if (historicalFetchSuccess && allContributionDays.length > 0) {
      const seenDates = new Set<string>();
      for (const day of allContributionDays) {
        if (!seenDates.has(day.date)) {
          seenDates.add(day.date);
          totalContributionsAllTime += day.contributionCount;
        }
      }
    } else {
      totalContributionsAllTime = user.contributionsCollection.contributionCalendar.totalContributions;
    }

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
      contributionData: currentYearDays,
      monthlyContributions: computeMonthlyContributions(currentYearDays),
      rank,
      rankPercentile: percentile,
    };

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - GitHub API is slow');
    }
    throw error;
  }
}

export async function fetchGitHubStats(username: string, hiddenLanguages: string[] = []): Promise<GitHubStats> {
  const normalizedUsername = username.trim().toLowerCase();
  const sortedHidden = hiddenLanguages.map(l => l.trim().toLowerCase()).filter(Boolean).sort();
  const fullCacheKey = sortedHidden.length > 0 
    ? `${normalizedUsername}:hide=${sortedHidden.join(',')}` 
    : normalizedUsername;

  const cached = cache.get(fullCacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const inFlight = pendingRequests.get(fullCacheKey);
  if (inFlight) {
    return inFlight;
  }

  const fetchPromise = (async () => {
    try {
      const stats = await executeFetchGitHubStats(username.trim(), sortedHidden);
      setInCache(fullCacheKey, stats);
      return stats;
    } finally {
      pendingRequests.delete(fullCacheKey);
    }
  })();

  pendingRequests.set(fullCacheKey, fetchPromise);
  return fetchPromise;
}