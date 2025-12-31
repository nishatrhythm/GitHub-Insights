// GitHub API Types
export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  followers: { totalCount: number };
  following: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: Repository[];
  };
  contributionsCollection: ContributionsCollection;
  createdAt: string;
}

export interface Repository {
  name: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  isPrivate: boolean;
  isFork: boolean;
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoryContributions: number;
  contributionCalendar: ContributionCalendar;
  contributionYears: number[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
  weekday: number;
}

export interface LanguageStats {
  name: string;
  color: string;
  size: number;
  percentage: number;
}

export interface StreakInfo {
  count: number;
  startDate: string;
  endDate: string;
}

export interface GitHubStats {
  user: GitHubUser;
  totalStars: number;
  totalForks: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalContributions: number;
  totalContributionsAllTime: number;
  contributedRepos: number;
  languages: LanguageStats[];
  currentStreak: StreakInfo;
  longestStreak: StreakInfo;
  accountCreatedAt: string;
  contributionData: ContributionDay[];
  rank: string;
  rankPercentile: number;
}

export interface ThemeColors {
  background: string;
  backgroundGradient: string;
  cardBackground: string;
  border: string;
  title: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  iconColor: string;
  contributionLevels: string[];
}
