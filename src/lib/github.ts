import { GitHubUser, GitHubStats, LanguageStats, ContributionDay, StreakInfo } from '@/types/github';

const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

const USER_QUERY = `
query($username: String!) {
  user(login: $username) {
    login
    name
    avatarUrl
    bio
    company
    location
    websiteUrl
    twitterUsername
    followers { totalCount }
    following { totalCount }
    createdAt
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}, privacy: PUBLIC) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        primaryLanguage {
          name
          color
        }
        isPrivate
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
            color
            weekday
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
                color
                weekday
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

function calculateStreaks(contributionDays: ContributionDay[]): { current: StreakInfo; longest: StreakInfo } {
  const emptyStreak: StreakInfo = { count: 0, startDate: '', endDate: '' };
  if (!contributionDays.length) return { current: emptyStreak, longest: emptyStreak };

  // Sort by date ascending for easier processing
  const sortedDays = [...contributionDays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find all streaks
  const streaks: StreakInfo[] = [];
  let currentStreakStart = '';
  let currentStreakEnd = '';
  let currentStreakCount = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const day = sortedDays[i];
    
    if (day.contributionCount > 0) {
      if (currentStreakCount === 0) {
        currentStreakStart = day.date;
      }
      currentStreakEnd = day.date;
      currentStreakCount++;
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

    // Get contribution data for current year
    const currentYear = new Date().getFullYear();
    const contributionDays = user.contributionsCollection.contributionCalendar.weeks
      .flatMap(week => week.contributionDays);

    // Fetch previous year in parallel for streak calculation (only 1 extra request)
    const years = user.contributionsCollection.contributionYears || [currentYear];
    let allContributionDays = [...contributionDays];

    // Only fetch previous year if needed, in parallel
    if (years.includes(currentYear - 1)) {
      try {
        const prevYearDays = await fetchYearContributions(username, currentYear - 1, token);
        allContributionDays = [...allContributionDays, ...prevYearDays];
      } catch {
        // Continue without previous year data if it fails
      }
    }

    const streaks = calculateStreaks(allContributionDays);
    const languages = calculateLanguageStats(user.repositories.nodes);
    
    // Use current year total only (faster, skip fetching all historical years)
    const totalContributionsAllTime = user.contributionsCollection.contributionCalendar.totalContributions;

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
