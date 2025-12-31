import { GitHubStats, ThemeColors } from '@/types/github';
import { 
  icons,
  renderIcon,
  escapeHtml, 
  formatNumber, 
  generateAnimationStyles,
  generateGradientDefs 
} from './svg-utils';

interface CardOptions {
  theme: ThemeColors;
  showGraph?: boolean;
  showLanguages?: boolean;
  showStreak?: boolean;
  showStats?: boolean;
  showHeader?: boolean;
  showSummary?: boolean;
  showProfile?: boolean;
}

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif";

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getYearsAgo(dateStr: string): string {
  const created = new Date(dateStr);
  const now = new Date();
  const years = Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

function calculateGrade(stats: GitHubStats): { grade: string; color: string } {
  const { totalStars, totalCommits, totalPRs, totalIssues, contributedRepos, user } = stats;
  
  // Calculate score based on various metrics
  let score = 0;
  
  // Stars contribution (max 25 points)
  score += Math.min(25, totalStars * 0.5);
  
  // Commits contribution (max 25 points)
  score += Math.min(25, totalCommits * 0.05);
  
  // PRs contribution (max 20 points)
  score += Math.min(20, totalPRs * 0.5);
  
  // Issues contribution (max 10 points)
  score += Math.min(10, totalIssues * 0.2);
  
  // Contributed repos (max 10 points)
  score += Math.min(10, contributedRepos * 0.5);
  
  // Followers bonus (max 10 points)
  score += Math.min(10, user.followers.totalCount * 0.1);
  
  // Determine grade
  if (score >= 90) return { grade: 'S+', color: '#fbbf24' };
  if (score >= 80) return { grade: 'S', color: '#f59e0b' };
  if (score >= 70) return { grade: 'A++', color: '#10b981' };
  if (score >= 60) return { grade: 'A+', color: '#34d399' };
  if (score >= 50) return { grade: 'A', color: '#6ee7b7' };
  if (score >= 40) return { grade: 'B+', color: '#60a5fa' };
  if (score >= 30) return { grade: 'B', color: '#93c5fd' };
  if (score >= 20) return { grade: 'C+', color: '#a78bfa' };
  if (score >= 10) return { grade: 'C', color: '#c4b5fd' };
  return { grade: 'D', color: '#9ca3af' };
}

function renderHeaderSection(stats: GitHubStats, theme: ThemeColors, startY: number, cardWidth: number, options: { showProfile?: boolean; showSummary?: boolean; showHeader?: boolean }): { svg: string; height: number } {
  const { user, totalContributions } = stats;
  const name = escapeHtml(user.name || user.login);
  const login = escapeHtml(user.login);
  const location = user.location ? escapeHtml(user.location) : '';
  const currentYear = new Date().getFullYear();
  
  const showProfile = options.showProfile !== false;
  const showSummary = options.showSummary !== false;
  const showHeader = options.showHeader !== false;
  
  // If nothing is shown, return empty
  if (!showProfile && !showSummary && !showHeader) {
    return { svg: '', height: 0 };
  }
  
  const contributionData = stats.contributionData;
  
  // Group by month for the area chart
  const monthlyData: { month: string; count: number }[] = [];
  const monthMap = new Map<string, number>();
  
  contributionData.forEach(day => {
    const date = new Date(day.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + day.contributionCount);
  });
  
  const sortedMonths = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  sortedMonths.forEach(([month, count]) => {
    const [year, m] = month.split('-');
    monthlyData.push({
      month: `${monthNames[parseInt(m) - 1]} '${year.slice(2)}`,
      count
    });
  });

  const graphWidth = 280;
  const graphHeight = 90;
  const maxCount = Math.max(...monthlyData.map(d => d.count), 1);
  
  let areaPath = `M 0 ${graphHeight}`;
  let linePath = 'M';
  
  monthlyData.forEach((data, i) => {
    const x = (i / Math.max(monthlyData.length - 1, 1)) * graphWidth;
    const y = graphHeight - (data.count / maxCount) * (graphHeight - 15);
    areaPath += ` L ${x} ${y}`;
    linePath += `${i === 0 ? '' : ' L'} ${x} ${y}`;
  });
  areaPath += ` L ${graphWidth} ${graphHeight} Z`;

  // Calculate layout based on what's visible
  let currentHeight = 0;
  
  // Profile section (name & username)
  const profileSvg = showProfile ? `
      <!-- Centered Username and Name -->
      <g transform="translate(${cardWidth / 2}, 0)">
        <text x="0" y="0" text-anchor="middle" font-size="28" font-weight="700" fill="${theme.accent}" font-family="${FONT_FAMILY}" letter-spacing="0.5">
          ${login}
        </text>
        <text x="0" y="32" text-anchor="middle" font-size="15" font-weight="400" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${name}
        </text>
      </g>
  ` : '';
  
  const profileHeight = showProfile ? 50 : 0;
  
  // Calculate summary section
  const summaryRows = showSummary ? [
    { icon: 'fire', color: '#ff6b35', text: `${totalContributions.toLocaleString()} contributions in ${currentYear}` },
    { icon: 'repo', color: theme.accent, text: `${user.repositories.totalCount} public repositories` },
    { icon: 'calendar', color: '#9ca3af', text: `Joined GitHub ${getYearsAgo(stats.accountCreatedAt)}` },
    ...(location ? [{ icon: 'pin', color: '#10b981', text: location }] : [])
  ] : [];
  
  const summaryHeight = showSummary ? (summaryRows.length * 32) : 0;
  const headerChartHeight = showHeader ? 120 : 0;
  
  // Determine if we need side-by-side layout
  const showBothSummaryAndHeader = showSummary && showHeader;
  const summaryStartY = profileHeight + (showProfile ? 32 : 0);
  
  // Summary section SVG
  const summarySvg = showSummary ? `
      <!-- Profile Stats - Left aligned -->
      <g transform="translate(48, ${summaryStartY})">
        ${summaryRows.map((row, index) => `
        <g transform="translate(0, ${index * 32})">
          ${renderIcon(row.icon as 'fire' | 'repo' | 'calendar' | 'pin', 0, -1, row.color, 18)}
          <text x="28" y="13" font-size="14" fill="${theme.text}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${row.text}
          </text>
        </g>
        `).join('')}
      </g>
  ` : '';
  
  // Header chart SVG
  const headerChartSvg = showHeader ? `
      <!-- Contribution Area Graph -->
      <g transform="translate(${showBothSummaryAndHeader ? cardWidth - graphWidth - 80 : (cardWidth - graphWidth) / 2}, ${summaryStartY})">
        <text x="${graphWidth / 2}" y="-8" text-anchor="middle" font-size="12" font-weight="600" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Monthly Contributions (Last 12 Months)
        </text>
        
        <!-- Y-axis labels -->
        <g transform="translate(${graphWidth + 10}, 0)">
          <text y="10" font-size="9" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}">${maxCount}</text>
          <text y="${graphHeight / 2 + 4}" font-size="9" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}">${Math.round(maxCount / 2)}</text>
          <text y="${graphHeight}" font-size="9" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}">0</text>
        </g>
        
        <defs>
          <linearGradient id="headerAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:0.5" />
            <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.05" />
          </linearGradient>
        </defs>
        
        <path d="${areaPath}" fill="url(#headerAreaGradient)" />
        <path d="${linePath}" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- X-axis labels -->
        <g transform="translate(0, ${graphHeight + 14})">
          ${monthlyData.filter((_, i) => i % 4 === 0 || i === monthlyData.length - 1).map((data) => {
            const i = monthlyData.indexOf(data);
            return `
            <text x="${(i / Math.max(monthlyData.length - 1, 1)) * graphWidth}" y="0" font-size="9" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" text-anchor="middle">
              ${data.month}
            </text>
          `}).join('')}
        </g>
      </g>
  ` : '';
  
  // Calculate total height
  const contentHeight = showBothSummaryAndHeader 
    ? Math.max(summaryHeight, headerChartHeight)
    : (summaryHeight + headerChartHeight);
  
  const totalHeight = profileHeight + (showProfile ? 32 : 0) + contentHeight + 10;

  const svg = `
    <!-- Header Section -->
    <g transform="translate(0, ${startY})">
      ${profileSvg}
      ${summarySvg}
      ${headerChartSvg}
    </g>
  `;

  return { svg, height: totalHeight };
}

function renderStatsCard(stats: GitHubStats, theme: ThemeColors, startY: number): { svg: string; height: number } {
  const { user, totalStars, totalCommits, totalPRs, totalIssues, contributedRepos } = stats;
  const currentYear = new Date().getFullYear();
  const { grade, color: gradeColor } = calculateGrade(stats);

  const statItems = [
    { icon: 'star' as const, label: 'Total Stars Earned', value: totalStars, color: '#fbbf24' },
    { icon: 'commit' as const, label: `Commits (${currentYear})`, value: totalCommits, color: '#34d399' },
    { icon: 'pr' as const, label: 'Pull Requests', value: totalPRs, color: '#a78bfa' },
    { icon: 'issue' as const, label: 'Issues', value: totalIssues, color: '#f472b6' },
    { icon: 'fork' as const, label: 'Contributed To', value: contributedRepos, color: '#60a5fa' },
  ];

  let svg = `
    <!-- GitHub Stats Card -->
    <g transform="translate(40, ${startY})">
      <rect x="0" y="0" width="380" height="200" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
      
      <!-- Card Title -->
      <g transform="translate(24, 28)">
        ${renderIcon('activity', 0, -1, theme.accent, 18)}
        <text x="28" y="13" font-size="16" font-weight="600" fill="${theme.title}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          GitHub Stats
        </text>
      </g>
      
      <!-- Stats List -->
      <g transform="translate(24, 60)">
  `;

  statItems.forEach((item, index) => {
    const y = index * 27;
    svg += `
        <g transform="translate(0, ${y})">
          ${renderIcon(item.icon, 0, 0, item.color, 16)}
          <text x="26" y="12" font-size="13" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${item.label}
          </text>
          <text x="230" y="12" font-size="14" font-weight="600" fill="${theme.text}" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">
            ${item.value.toLocaleString()}
          </text>
        </g>
    `;
  });

  svg += `
      </g>
      
      <!-- Grade Rating -->
      <g transform="translate(290, 62)">
        <circle cx="36" cy="36" r="42" fill="${theme.background}" stroke="${gradeColor}" stroke-width="3"/>
        <circle cx="36" cy="36" r="34" fill="${gradeColor}" opacity="0.12"/>
        <text x="36" y="44" text-anchor="middle" font-size="28" font-weight="700" fill="${gradeColor}" font-family="${FONT_FAMILY}" letter-spacing="0.5">
          ${grade}
        </text>
      </g>
      <text x="326" y="168" text-anchor="middle" font-size="12" font-weight="500" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
        Rating
      </text>
    </g>
  `;

  return { svg, height: 218 };
}

function renderLanguagesCard(stats: GitHubStats, theme: ThemeColors, startY: number, startX: number): { svg: string; height: number } {
  const { languages } = stats;
  
  if (languages.length === 0) {
    return { svg: '', height: 0 };
  }

  const barWidth = 332;
  const barHeight = 12;
  const borderRadius = 6;

  // Calculate widths and create clip path for proper rounding
  let currentX = 0;
  const segments: { x: number; width: number; color: string; isFirst: boolean; isLast: boolean }[] = [];
  
  const topLangs = languages.slice(0, 8);
  const validLangs = topLangs.filter(lang => (lang.percentage / 100) * barWidth > 0.5);
  
  // Calculate total percentage to normalize
  const totalPercentage = validLangs.reduce((sum, lang) => sum + lang.percentage, 0);
  
  validLangs.forEach((lang, index) => {
    // Normalize percentage to ensure segments fill entire bar
    const normalizedPercentage = (lang.percentage / totalPercentage) * 100;
    const width = (normalizedPercentage / 100) * barWidth;
    
    // For the last segment, fill remaining space to avoid gaps
    const actualWidth = index === validLangs.length - 1 
      ? barWidth - currentX 
      : width;
    
    segments.push({
      x: currentX,
      width: actualWidth,
      color: lang.color,
      isFirst: index === 0,
      isLast: index === validLangs.length - 1
    });
    currentX += actualWidth;
  });

  let svg = `
    <!-- Languages Card -->
    <g transform="translate(${startX}, ${startY})">
      <rect x="0" y="0" width="380" height="200" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
      
      <!-- Card Title -->
      <g transform="translate(24, 28)">
        ${renderIcon('code', 0, -1, theme.accent, 18)}
        <text x="28" y="13" font-size="16" font-weight="600" fill="${theme.title}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Most Used Languages
        </text>
      </g>
      
      <!-- Language Bar with proper clip path -->
      <g transform="translate(24, 60)">
        <defs>
          <clipPath id="langBarClip">
            <rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="${borderRadius}"/>
          </clipPath>
        </defs>
        <rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="${borderRadius}" fill="${theme.background}"/>
        <g clip-path="url(#langBarClip)">
  `;

  // Render segments without individual rounded corners - the clip-path handles rounding
  segments.forEach((seg) => {
    svg += `
          <rect x="${seg.x}" y="0" width="${seg.width}" height="${barHeight}" fill="${seg.color}"/>
    `;
  });

  svg += `
        </g>
      </g>
      
      <!-- Language Labels -->
      <g transform="translate(24, 88)">
  `;

  const leftColumn = topLangs.filter((_, i) => i % 2 === 0);
  const rightColumn = topLangs.filter((_, i) => i % 2 === 1);

  leftColumn.forEach((lang, index) => {
    const y = index * 27;
    svg += `
        <g transform="translate(0, ${y})">
          <circle cx="6" cy="7" r="5" fill="${lang.color}"/>
          <text x="20" y="11" font-size="12" font-weight="500" fill="${theme.text}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${escapeHtml(lang.name)}
          </text>
          <text x="155" y="11" font-size="12" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">
            ${lang.percentage.toFixed(1)}%
          </text>
        </g>
    `;
  });

  rightColumn.forEach((lang, index) => {
    const y = index * 27;
    svg += `
        <g transform="translate(175, ${y})">
          <circle cx="6" cy="7" r="5" fill="${lang.color}"/>
          <text x="20" y="11" font-size="12" font-weight="500" fill="${theme.text}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${escapeHtml(lang.name)}
          </text>
          <text x="155" y="11" font-size="12" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">
            ${lang.percentage.toFixed(1)}%
          </text>
        </g>
    `;
  });

  svg += `
      </g>
    </g>
  `;

  return { svg, height: 218 };
}

function renderStreakSection(stats: GitHubStats, theme: ThemeColors, startY: number, cardWidth: number): { svg: string; height: number } {
  const { currentStreak, longestStreak, totalContributionsAllTime, accountCreatedAt } = stats;
  
  const circleRadius = 32;
  const strokeWidth = 5;
  const innerCardWidth = cardWidth - 80;
  const cardWidth3 = (innerCardWidth - 32) / 3;

  const svg = `
    <!-- Streak Section -->
    <g transform="translate(40, ${startY})">
      <!-- Total Contributions Card -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
        
        <g transform="translate(${cardWidth3 / 2}, 28)">
          ${renderIcon('contribution', -10, 0, theme.accent, 20)}
        </g>
        
        <text x="${cardWidth3 / 2}" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="${theme.accent}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${totalContributionsAllTime.toLocaleString()}
        </text>
        <text x="${cardWidth3 / 2}" y="94" text-anchor="middle" font-size="12" font-weight="600" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Total Contributions
        </text>
        <text x="${cardWidth3 / 2}" y="116" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${formatDateFull(accountCreatedAt)} - Present
        </text>
      </g>
      
      <!-- Current Streak Card -->
      <g transform="translate(${cardWidth3 + 16}, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
        
        <!-- Circle Progress with fire icon on edge -->
        <g transform="translate(${cardWidth3 / 2}, 58)">
          <circle cx="0" cy="0" r="${circleRadius}" fill="none" stroke="${theme.border}" stroke-width="${strokeWidth}" opacity="0.4"/>
          <circle cx="0" cy="0" r="${circleRadius}" fill="none" stroke="${theme.accent}" stroke-width="${strokeWidth}" 
                  stroke-dasharray="${2 * Math.PI * circleRadius}" 
                  stroke-dashoffset="${2 * Math.PI * circleRadius * (1 - Math.min(currentStreak.count / 30, 1))}"
                  transform="rotate(-90)"
                  stroke-linecap="round"/>
          <!-- Fire icon positioned at top edge of circle - no background -->
          <g transform="translate(-10, ${-circleRadius - 10})">
            ${renderIcon('fire', 0, 0, '#ff6b35', 20)}
          </g>
          <text x="0" y="8" text-anchor="middle" font-size="22" font-weight="700" fill="${theme.text}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${currentStreak.count}
          </text>
        </g>
        
        <text x="${cardWidth3 / 2}" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Current Streak
        </text>
        <text x="${cardWidth3 / 2}" y="126" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${currentStreak.startDate ? `${formatDateShort(currentStreak.startDate)} - ${formatDateShort(currentStreak.endDate)}` : 'No active streak'}
        </text>
      </g>
      
      <!-- Longest Streak Card -->
      <g transform="translate(${(cardWidth3 + 16) * 2}, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
        
        <g transform="translate(${cardWidth3 / 2}, 28)">
          ${renderIcon('trophy', -10, 0, theme.accentSecondary, 20)}
        </g>
        
        <text x="${cardWidth3 / 2}" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="${theme.accentSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${longestStreak.count}
        </text>
        <text x="${cardWidth3 / 2}" y="94" text-anchor="middle" font-size="12" font-weight="600" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Longest Streak
        </text>
        <text x="${cardWidth3 / 2}" y="116" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${longestStreak.startDate ? `${formatDateShort(longestStreak.startDate)} - ${formatDateShort(longestStreak.endDate)}` : 'N/A'}
        </text>
      </g>
    </g>
  `;

  return { svg, height: 160 };
}

function renderContributionLineGraph(stats: GitHubStats, theme: ThemeColors, startY: number, cardWidth: number): { svg: string; height: number } {
  const { contributionData } = stats;
  
  if (!contributionData || contributionData.length === 0) {
    return { svg: '', height: 0 };
  }

  const last31Days = contributionData.slice(-31);
  
  // Get month info for title
  const firstDate = new Date(last31Days[0].date);
  const lastDate = new Date(last31Days[last31Days.length - 1].date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  let monthLabel = '';
  if (firstDate.getMonth() === lastDate.getMonth()) {
    monthLabel = `${months[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
  } else {
    monthLabel = `${months[firstDate.getMonth()].slice(0, 3)} - ${months[lastDate.getMonth()].slice(0, 3)} ${lastDate.getFullYear()}`;
  }
  
  const innerWidth = cardWidth - 80;
  const graphWidth = innerWidth - 70;
  const graphHeight = 80;
  const maxCount = Math.max(...last31Days.map(d => d.contributionCount), 1);
  
  let linePath = 'M';
  const points: { x: number; y: number; count: number; date: string }[] = [];
  
  last31Days.forEach((day, i) => {
    const x = (i / Math.max(last31Days.length - 1, 1)) * graphWidth;
    const y = graphHeight - (day.contributionCount / maxCount) * (graphHeight - 10);
    points.push({ x, y, count: day.contributionCount, date: day.date });
    linePath += `${i === 0 ? '' : ' L'} ${x} ${y}`;
  });

  let svg = `
    <!-- Contribution Line Graph -->
    <g transform="translate(40, ${startY})">
      <rect x="0" y="0" width="${innerWidth}" height="${graphHeight + 80}" rx="14" fill="${theme.cardBackground}" stroke="${theme.border}" stroke-width="1"/>
      
      <!-- Title with month -->
      <g transform="translate(24, 26)">
        ${renderIcon('history', 0, -1, theme.accent, 18)}
        <text x="28" y="13" font-size="15" font-weight="600" fill="${theme.title}" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Contribution Activity
        </text>
        <text x="28" y="34" font-size="12" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.2">
          Daily contributions · ${monthLabel}
        </text>
      </g>
      
      <!-- Y-axis -->
      <g transform="translate(36, 62)">
        <text x="0" y="5" font-size="10" fill="${theme.textSecondary}" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">${maxCount}</text>
        <text x="0" y="${graphHeight / 2 + 2}" font-size="10" fill="${theme.textSecondary}" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">${Math.round(maxCount / 2)}</text>
        <text x="0" y="${graphHeight - 3}" font-size="10" fill="${theme.textSecondary}" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">0</text>
        
        <!-- Grid lines -->
        <line x1="10" y1="0" x2="${graphWidth + 12}" y2="0" stroke="${theme.border}" stroke-width="0.5" stroke-dasharray="4,2" opacity="0.4"/>
        <line x1="10" y1="${graphHeight / 2}" x2="${graphWidth + 12}" y2="${graphHeight / 2}" stroke="${theme.border}" stroke-width="0.5" stroke-dasharray="4,2" opacity="0.4"/>
        <line x1="10" y1="${graphHeight}" x2="${graphWidth + 12}" y2="${graphHeight}" stroke="${theme.border}" stroke-width="0.5"/>
      </g>
      
      <!-- Graph -->
      <g transform="translate(52, 62)">
        <defs>
          <linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.accent};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${theme.accent};stop-opacity:0.02" />
          </linearGradient>
        </defs>
        
        <path d="${linePath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z" fill="url(#graphGradient)" />
        <path d="${linePath}" fill="none" stroke="${theme.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- Data points -->
        ${points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="4" fill="${theme.accent}" stroke="${theme.cardBackground}" stroke-width="2"/>
        `).join('')}
      </g>
      
      <!-- X-axis labels with day numbers -->
      <g transform="translate(52, ${graphHeight + 72})">
        ${points.filter((_, i) => i % 7 === 0 || i === points.length - 1).map((p) => {
          const date = new Date(p.date);
          return `<text x="${p.x}" y="0" text-anchor="middle" font-size="10" fill="${theme.textSecondary}" font-family="${FONT_FAMILY}" letter-spacing="0.2">${date.getDate()}</text>`;
        }).join('')}
      </g>
    </g>
  `;

  return { svg, height: graphHeight + 98 };
}

export function generateInsightCard(stats: GitHubStats, options: CardOptions): string {
  const { theme } = options;
  const cardWidth = 850;
  let currentY = 36;

  // Header (includes profile, summary, and header chart based on options)
  const headerSection = renderHeaderSection(stats, theme, currentY, cardWidth, {
    showProfile: options.showProfile,
    showSummary: options.showSummary,
    showHeader: options.showHeader,
  });
  currentY += headerSection.height + (headerSection.height > 0 ? 20 : 0);

  // Stats and Languages side by side
  const showStats = options.showStats !== false;
  const showLanguages = options.showLanguages !== false;
  
  const statsCard = showStats 
    ? renderStatsCard(stats, theme, currentY)
    : { svg: '', height: 0 };
  
  // Adjust languages card position based on whether stats card is shown
  const languagesStartX = showStats ? 430 : 40;
  const languagesCard = showLanguages 
    ? renderLanguagesCard(stats, theme, currentY, languagesStartX) 
    : { svg: '', height: 0 };
  
  const statsAndLangsHeight = Math.max(statsCard.height, languagesCard.height);
  currentY += statsAndLangsHeight + (statsAndLangsHeight > 0 ? 20 : 0);

  // Streak section
  const streakSection = options.showStreak !== false 
    ? renderStreakSection(stats, theme, currentY, cardWidth) 
    : { svg: '', height: 0 };
  currentY += streakSection.height + (streakSection.height > 0 ? 20 : 0);

  // Contribution graph
  const graphSection = options.showGraph !== false 
    ? renderContributionLineGraph(stats, theme, currentY, cardWidth) 
    : { svg: '', height: 0 };
  currentY += graphSection.height;

  const cardHeight = currentY + 28;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}">
  ${generateAnimationStyles(theme)}
  ${generateGradientDefs(theme)}
  
  <!-- Gradient Border Definition -->
  <defs>
    <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${theme.accent}" />
      <stop offset="50%" style="stop-color:${theme.accentSecondary}" />
      <stop offset="100%" style="stop-color:${theme.accent}" />
    </linearGradient>
  </defs>
  
  <!-- Main Background with gradient border -->
  <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="16" fill="${theme.background}"/>
  <rect x="1" y="1" width="${cardWidth - 2}" height="${cardHeight - 2}" rx="15" fill="none" stroke="url(#borderGradient)" stroke-width="2"/>
  
  ${headerSection.svg}
  ${statsCard.svg}
  ${languagesCard.svg}
  ${streakSection.svg}
  ${graphSection.svg}
</svg>
  `.trim();

  return svg;
}
