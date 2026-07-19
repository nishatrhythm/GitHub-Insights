import { GitHubUser, GitHubStats, LanguageStats, ContributionDay, StreakInfo, MonthlyContribution } from '@/types/github';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const USER_PROFILE_QUERY = `
query($username: String!) {
  user(login: $username) {
    login
    name
    location
    followers { totalCount }
    createdAt
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
    }
  }
}
`;

const USER_CALENDAR_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
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
  }
}
`;

const USER_REPOS_QUERY = `
query($username: String!) {
  user(login: $username) {
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


function calculateStreaks(contributionDays: ContributionDay[]): { current: StreakInfo; longest: StreakInfo } {
  const emptyStreak: StreakInfo = { count: 0, startDate: '', endDate: '' };
  if (!contributionDays.length) return { current: emptyStreak, longest: emptyStreak };

  const sortedDays = [...contributionDays].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const uniqueDays: ContributionDay[] = [];
  const seenDates = new Set<string>();
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
  let lastDate: Date | null = null;

  for (let i = 0; i < uniqueDays.length; i++) {
    const day = uniqueDays[i];
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);

    let isConsecutive = false;
    if (lastDate) {
      const expectedDate = new Date(lastDate);
      expectedDate.setDate(expectedDate.getDate() + 1);
      isConsecutive = dayDate.getTime() === expectedDate.getTime();
    }

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
    lastDate = dayDate;
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

  for (const repo of repositories) {
    if (repo.isFork) continue;
    if (!repo.languages?.edges) continue;

    for (const edge of repo.languages.edges) {
      const langName = edge.node.name;
      if (hiddenLanguages.has(langName.toLowerCase())) continue;
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
    .slice(0, 8);

  return languages;
}

const cache = new Map<string, { data: GitHubStats; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchGitHubStats(username: string, hiddenLanguages: string[] = []): Promise<GitHubStats> {
  const cacheKey = username.toLowerCase();
  const fullCacheKey = hiddenLanguages.length > 0 
    ? `${cacheKey}:hide=${hiddenLanguages.map(l => l.toLowerCase()).sort().join(',')}` 
    : cacheKey;
  const cached = cache.get(fullCacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GitHub token is not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const [profileResponse, reposResponse, calendarResponse] = await Promise.all([
      fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: USER_PROFILE_QUERY,
          variables: { username },
        }),
        signal: controller.signal,
      }),
      fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: USER_REPOS_QUERY,
          variables: { username },
        }),
        signal: controller.signal,
      }),
      fetch(GITHUB_GRAPHQL_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: USER_CALENDAR_QUERY,
          variables: { username },
        }),
        signal: controller.signal,
      })
    ]);

    clearTimeout(timeoutId);

    const [profileData, reposData, calendarData] = await Promise.all([
      profileResponse.json(),
      reposResponse.json(),
      calendarResponse.json()
    ]);

    if (profileData.errors) {
      console.error('GraphQL profile query errors:', profileData.errors);
      throw new Error(profileData.errors[0]?.message || 'Failed to fetch GitHub user profile');
    }

    if (reposData.errors) {
      console.error('GraphQL repos query errors:', reposData.errors);
      throw new Error(reposData.errors[0]?.message || 'Failed to fetch GitHub repositories');
    }

    if (calendarData.errors) {
      console.error('GraphQL calendar query errors:', calendarData.errors);
      throw new Error(calendarData.errors[0]?.message || 'Failed to fetch GitHub contribution calendar');
    }

    if (!profileData.data?.user) {
      throw new Error(`User "${username}" not found`);
    }

    const user: GitHubUser = {
      ...profileData.data.user,
      repositories: reposData.data?.user?.repositories || { totalCount: 0, nodes: [] },
      contributionsCollection: {
        ...profileData.data.user.contributionsCollection,
        contributionCalendar: calendarData.data?.user?.contributionsCollection?.contributionCalendar || { totalContributions: 0, weeks: [] }
      }
    };

    const totalStars = user.repositories.nodes.reduce((sum, repo) => sum + repo.stargazerCount, 0);
    const totalForks = user.repositories.nodes.reduce((sum, repo) => sum + repo.forkCount, 0);

    const currentYear = new Date().getFullYear();
    const years = user.contributionsCollection.contributionYears || [currentYear];

    let allContributionDays: ContributionDay[] = [];
    let historicalFetchSuccess = false;

    try {
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
      historicalFetchSuccess = true;
    } catch (error) {
      console.error('Error fetching historical contribution days:', error);
      allContributionDays = user.contributionsCollection.contributionCalendar.weeks
        .flatMap(week => week.contributionDays);
    }

    const contributionDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap(week => week.contributionDays);

    const streaks = calculateStreaks(allContributionDays);
    const hiddenLangsSet = new Set(hiddenLanguages.map(l => l.toLowerCase()));
    const languages = calculateLanguageStats(user.repositories.nodes as unknown as RepositoryWithLanguages[], hiddenLangsSet);

    let totalContributionsAllTime = 0;

    if (historicalFetchSuccess && allContributionDays.length > 0) {
      totalContributionsAllTime = allContributionDays.reduce((sum, day) => sum + day.contributionCount, 0);
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
      contributionData: contributionDays,
      monthlyContributions: computeMonthlyContributions(contributionDays),
      rank,
      rankPercentile: percentile,
    };

    const fullCacheKey = hiddenLanguages.length > 0 
      ? `${cacheKey}:hide=${hiddenLanguages.sort().join(',')}` 
      : cacheKey;
    cache.set(fullCacheKey, { data: result, timestamp: Date.now() });

    return result;

  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out - GitHub API is slow');
    }
    throw error;
  }
}