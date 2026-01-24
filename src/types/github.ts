// GitHub API Types
export interface GitHubUser {
  login: string;
  name: string | null;
  location: string | null;
  followers: { totalCount: number };
  repositories: {
    totalCount: number;
    nodes: Repository[];
  };
  contributionsCollection: ContributionsCollection;
  createdAt: string;
}

export interface Repository {
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  isFork: boolean;
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
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
}

export interface LanguageStats {
  name: string;
  color: string;
  size: number;
  percentage: number;
}

export interface MonthlyContribution {
  month: string;
  label: string;
  count: number;
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
  monthlyContributions: MonthlyContribution[];
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
