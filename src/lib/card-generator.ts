import { GitHubStats, ThemeColors } from "@/types/github";
import {
  icons,
  renderIcon,
  escapeHtml,
  formatNumber,
  generateAnimationStyles,
  generateGradientDefs,
} from "./svg-utils";

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

const FONT_FAMILY =
  "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return "";
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${months[startDate.getMonth()]} ${startDate.getDate()} - ${
      months[endDate.getMonth()]
    } ${endDate.getDate()}, ${endDate.getFullYear()}`;
  } else {
    return `${
      months[startDate.getMonth()]
    } ${startDate.getDate()}, ${startDate.getFullYear()} - ${
      months[endDate.getMonth()]
    } ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }
}

function formatDateFull(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getYearsAgo(dateStr: string): string {
  const created = new Date(dateStr);
  const now = new Date();
  const years = Math.floor(
    (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

function calculateGrade(stats: GitHubStats): { grade: string; color: string } {
  const {
    totalStars,
    totalCommits,
    totalPRs,
    totalIssues,
    contributedRepos,
    user,
  } = stats;

  // Calculate score based on various metrics
  let score = 0;

  // 1 point for every 5 commits. Full 30 points if you have 150 commits.
  score += Math.min(30, totalCommits * 0.2);

  // 1 PR = 2.5 points. Full 25 points if you have 10 PRs.
  score += Math.min(25, totalPRs * 2.5);

  // 1 star = 0.4 points. 50 stars = 20 points.
  score += Math.min(20, totalStars * 0.4);

  // 1 issue = 1 point. 10 issues = 10 points.
  score += Math.min(10, totalIssues * 1.0);

  // Stars & Followers & Repos: Profile Value (Max 15)
  const followersBonus = user?.followers?.totalCount * 0.2; // 1 point for every 5 followers
  const repoBonus = contributedRepos * 1.0; // 1 point for every repo
  score += Math.min(15, followersBonus + repoBonus);

  // Grade Mapping
  const gradeThresholds = [
    { threshold: 85, grade: "S+", color: "#fbbf24" },
    { threshold: 75, grade: "S", color: "#f59e0b" },
    { threshold: 65, grade: "A++", color: "#10b981" },
    { threshold: 55, grade: "A+", color: "#34d399" },
    { threshold: 45, grade: "A", color: "#6ee7b7" },
    { threshold: 35, grade: "B+", color: "#60a5fa" },
    { threshold: 25, grade: "B", color: "#93c5fd" },
    { threshold: 15, grade: "C", color: "#a78bfa" },
    { threshold: 0, grade: "D", color: "#9ca3af" },
  ];

  const result = gradeThresholds?.find((g) => score >= g?.threshold);
  return { grade: result?.grade ?? "D", color: result?.color ?? "#9ca3af" };
}

function renderHeaderSection(
  stats: GitHubStats,
  theme: ThemeColors,
  startY: number,
  cardWidth: number,
  options: {
    showProfile?: boolean;
    showSummary?: boolean;
    showHeader?: boolean;
  }
): { svg: string; height: number } {
  const { user, totalContributions, contributionData, monthlyContributions } =
    stats;
  const name = escapeHtml(user.name || user.login);
  const login = escapeHtml(user.login);
  const location = user.location ? escapeHtml(user.location) : "";

  // GitHub's contribution calendar shows approximately the last 365-366 days (rolling year)
  // not a calendar year, so we should label it as "the last 12 months" for accuracy
  const contributionPeriodLabel = "the last 12 months";

  const showProfile = options.showProfile !== false;
  const showSummary = options.showSummary !== false;
  const showHeader = options.showHeader !== false;

  // If nothing is shown, return empty
  if (!showProfile && !showSummary && !showHeader) {
    return { svg: "", height: 0 };
  }

  // Use pre-computed monthly data
  const monthlyData = monthlyContributions;

  const graphWidth = 280;
  const graphHeight = 90;
  const maxCount = Math.max(...monthlyData.map((d) => d.count), 1);

  // Build paths using array for better performance
  const areaPoints: string[] = [`M 0 ${graphHeight}`];
  const linePoints: string[] = [];

  monthlyData.forEach((data, i) => {
    const x = (i / Math.max(monthlyData.length - 1, 1)) * graphWidth;
    const y = graphHeight - (data.count / maxCount) * (graphHeight - 15);
    areaPoints.push(`L ${x} ${y}`);
    linePoints.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  });
  areaPoints.push(`L ${graphWidth} ${graphHeight} Z`);

  const areaPath = areaPoints.join(" ");
  const linePath = linePoints.join(" ");

  // Profile section (name & username)
  const profileSvg = showProfile
    ? `
      <g transform="translate(${cardWidth / 2}, 0)">
        <text x="0" y="0" text-anchor="middle" font-size="28" font-weight="700" fill="${
          theme.accent
        }" font-family="${FONT_FAMILY}" letter-spacing="0.5">
          ${login}
        </text>
        <text x="0" y="32" text-anchor="middle" font-size="15" font-weight="400" fill="${
          theme.textSecondary
        }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${name}
        </text>
      </g>
  `
    : "";

  const profileHeight = showProfile ? 50 : 0;

  // Calculate summary section
  const summaryRows = showSummary
    ? [
        {
          icon: "fire",
          color: "#ff6b35",
          text: `${totalContributions.toLocaleString()} contributions in ${contributionPeriodLabel}`,
        },
        {
          icon: "repo",
          color: theme.accent,
          text: `${user.repositories.totalCount} public repositories`,
        },
        {
          icon: "calendar",
          color: "#9ca3af",
          text: `Joined GitHub ${getYearsAgo(stats.accountCreatedAt)}`,
        },
        ...(location
          ? [{ icon: "pin", color: "#10b981", text: location }]
          : []),
      ]
    : [];

  const summaryHeight = showSummary ? summaryRows.length * 32 : 0;
  const headerChartHeight = showHeader ? 120 : 0;

  // Determine if we need side-by-side layout
  const showBothSummaryAndHeader = showSummary && showHeader;
  const summaryStartY = profileHeight + (showProfile ? 32 : 0);

  // Summary section SVG
  const summarySvg = showSummary
    ? `
      <!-- Profile Stats - ${
        showBothSummaryAndHeader ? "Left aligned" : "Centered"
      } -->
      <g transform="translate(${
        showBothSummaryAndHeader ? 48 : (cardWidth - 320) / 2
      }, ${summaryStartY})">
        ${summaryRows
          .map(
            (row, index) => `
        <g transform="translate(0, ${index * 32})">
          ${renderIcon(
            row.icon as "fire" | "repo" | "calendar" | "pin",
            0,
            -1,
            row.color,
            18
          )}
          <text x="28" y="13" font-size="14" fill="${
            theme.text
          }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${row.text}
          </text>
        </g>
        `
          )
          .join("")}
      </g>
  `
    : "";

  // Header chart SVG
  const headerChartSvg = showHeader
    ? `
      <!-- Contribution Area Graph -->
      <g transform="translate(${
        showBothSummaryAndHeader
          ? cardWidth - graphWidth - 80
          : (cardWidth - graphWidth) / 2
      }, ${summaryStartY})">
        <text x="${
          graphWidth / 2
        }" y="-8" text-anchor="middle" font-size="12" font-weight="600" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Monthly Contributions (Last 12 Months)
        </text>
        
        <!-- Y-axis labels -->
        <g transform="translate(${graphWidth + 10}, 0)">
          <text y="10" font-size="9" fill="${
            theme.textSecondary
          }" font-family="${FONT_FAMILY}">${maxCount}</text>
          <text y="${graphHeight / 2 + 4}" font-size="9" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}">${Math.round(maxCount / 2)}</text>
          <text y="${graphHeight}" font-size="9" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}">0</text>
        </g>
        
        <defs>
          <linearGradient id="headerAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${
              theme.accent
            };stop-opacity:0.5" />
            <stop offset="100%" style="stop-color:${
              theme.accent
            };stop-opacity:0.05" />
          </linearGradient>
        </defs>
        
        <path d="${areaPath}" fill="url(#headerAreaGradient)" />
        <path d="${linePath}" fill="none" stroke="${
        theme.accent
      }" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        
        <!-- X-axis labels -->
        <g transform="translate(0, ${graphHeight + 14})">
          ${monthlyData
            .filter((_, i) => i % 4 === 0 || i === monthlyData.length - 1)
            .map((data, idx, arr) => {
              const originalIdx = monthlyData.indexOf(data);
              return `<text x="${
                (originalIdx / Math.max(monthlyData.length - 1, 1)) * graphWidth
              }" y="0" font-size="9" fill="${
                theme.textSecondary
              }" font-family="${FONT_FAMILY}" text-anchor="middle">${
                data.label
              }</text>`;
            })
            .join("")}
        </g>
      </g>
  `
    : "";

  // Calculate total height
  const contentHeight = showBothSummaryAndHeader
    ? Math.max(summaryHeight, headerChartHeight)
    : summaryHeight + headerChartHeight;

  const totalHeight =
    profileHeight + (showProfile ? 32 : 0) + contentHeight + 10;

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

function renderStatsCard(
  stats: GitHubStats,
  theme: ThemeColors,
  startY: number,
  startX: number = 40
): { svg: string; height: number } {
  const { totalStars, totalContributions, totalPRs, totalIssues, contributedRepos } =
    stats;
  const { grade, color: gradeColor } = calculateGrade(stats);

  const statItems = [
    {
      icon: "star" as const,
      label: "Total Stars Earned",
      value: totalStars,
      color: "#fbbf24",
    },
    {
      icon: "commit" as const,
      label: "Contributions (12mo)",
      value: totalContributions,
      color: "#34d399",
    },
    {
      icon: "pr" as const,
      label: "Pull Requests (12mo)",
      value: totalPRs,
      color: "#a78bfa",
    },
    {
      icon: "issue" as const,
      label: "Issues (12mo)",
      value: totalIssues,
      color: "#f472b6",
    },
    {
      icon: "fork" as const,
      label: "Contributed To (12mo)",
      value: contributedRepos,
      color: "#60a5fa",
    },
  ];

  // Build stats items using array.join() for better performance
  const statsSvgParts = statItems.map((item, index) => {
    const y = index * 27;
    return `<g transform="translate(0, ${y})">${renderIcon(
      item.icon,
      0,
      0,
      item.color,
      16
    )}<text x="26" y="12" font-size="13" fill="${
      theme.textSecondary
    }" font-family="${FONT_FAMILY}" letter-spacing="0.3">${
      item.label
    }</text><text x="230" y="12" font-size="14" font-weight="600" fill="${
      theme.text
    }" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">${item.value.toLocaleString()}</text></g>`;
  });

  const svg = `<g transform="translate(${startX}, ${startY})">
      <rect x="0" y="0" width="377" height="200" rx="14" fill="${
        theme.cardBackground
      }" stroke="${theme.border}" stroke-width="1"/>
      <g transform="translate(24, 28)">${renderIcon(
        "activity",
        0,
        -1,
        theme.accent,
        18
      )}<text x="28" y="13" font-size="16" font-weight="600" fill="${
    theme.title
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">GitHub Stats</text></g>
      <g transform="translate(24, 60)">${statsSvgParts.join("")}</g>
      <g transform="translate(290, 62)">
        <circle cx="36" cy="36" r="42" fill="${
          theme.background
        }" stroke="${gradeColor}" stroke-width="3"/>
        <circle cx="36" cy="36" r="34" fill="${gradeColor}" opacity="0.12"/>
        <text x="36" y="44" text-anchor="middle" font-size="28" font-weight="700" fill="${gradeColor}" font-family="${FONT_FAMILY}" letter-spacing="0.5">${grade}</text>
      </g>
      <text x="326" y="168" text-anchor="middle" font-size="12" font-weight="500" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}" letter-spacing="0.3">Rating</text>
    </g>`;

  return { svg, height: 218 };
}

function renderLanguagesCard(
  stats: GitHubStats,
  theme: ThemeColors,
  startY: number,
  startX: number
): { svg: string; height: number } {
  const { languages } = stats;

  if (languages.length === 0) {
    return { svg: "", height: 0 };
  }

  const barWidth = 329;
  const barHeight = 12;
  const borderRadius = 6;

  // Calculate widths and create clip path for proper rounding
  let currentX = 0;
  const segments: { x: number; width: number; color: string }[] = [];

  const topLangs = languages.slice(0, 8);
  const validLangs = topLangs.filter(
    (lang) => (lang.percentage / 100) * barWidth > 0.5
  );

  // Calculate total percentage to normalize
  const totalPercentage = validLangs.reduce(
    (sum, lang) => sum + lang.percentage,
    0
  );

  for (let index = 0; index < validLangs.length; index++) {
    const lang = validLangs[index];
    const normalizedPercentage = (lang.percentage / totalPercentage) * 100;
    const width = (normalizedPercentage / 100) * barWidth;
    const actualWidth =
      index === validLangs.length - 1 ? barWidth - currentX : width;
    segments.push({ x: currentX, width: actualWidth, color: lang.color });
    currentX += actualWidth;
  }

  // Build using array.join() for better performance
  const segmentsSvg = segments
    .map(
      (seg) =>
        `<rect x="${seg.x}" y="0" width="${seg.width}" height="${barHeight}" fill="${seg.color}"/>`
    )
    .join("");

  const leftColumn = topLangs.filter((_, i) => i % 2 === 0);
  const rightColumn = topLangs.filter((_, i) => i % 2 === 1);

  const leftLangsSvg = leftColumn
    .map((lang, index) => {
      const y = index * 27;
      return `<g transform="translate(0, ${y})"><circle cx="6" cy="7" r="5" fill="${
        lang.color
      }"/><text x="20" y="11" font-size="12" font-weight="500" fill="${
        theme.text
      }" font-family="${FONT_FAMILY}" letter-spacing="0.3">${escapeHtml(
        lang.name
      )}</text><text x="155" y="11" font-size="12" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">${lang.percentage.toFixed(
        1
      )}%</text></g>`;
    })
    .join("");

  const rightLangsSvg = rightColumn
    .map((lang, index) => {
      const y = index * 27;
      return `<g transform="translate(175, ${y})"><circle cx="6" cy="7" r="5" fill="${
        lang.color
      }"/><text x="20" y="11" font-size="12" font-weight="500" fill="${
        theme.text
      }" font-family="${FONT_FAMILY}" letter-spacing="0.3">${escapeHtml(
        lang.name
      )}</text><text x="155" y="11" font-size="12" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}" text-anchor="end" letter-spacing="0.2">${lang.percentage.toFixed(
        1
      )}%</text></g>`;
    })
    .join("");

  const svg = `<g transform="translate(${startX}, ${startY})">
      <rect x="0" y="0" width="377" height="200" rx="14" fill="${
        theme.cardBackground
      }" stroke="${theme.border}" stroke-width="1"/>
      <g transform="translate(24, 28)">${renderIcon(
        "code",
        0,
        -1,
        theme.accent,
        18
      )}<text x="28" y="13" font-size="16" font-weight="600" fill="${
    theme.title
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">Most Used Languages</text></g>
      <g transform="translate(24, 60)">
        <defs><clipPath id="langBarClip"><rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="${borderRadius}"/></clipPath></defs>
        <rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="${borderRadius}" fill="${
    theme.background
  }"/>
        <g clip-path="url(#langBarClip)">${segmentsSvg}</g>
      </g>
      <g transform="translate(24, 88)">${leftLangsSvg}${rightLangsSvg}</g>
    </g>`;

  return { svg, height: 218 };
}

function renderStreakSection(
  stats: GitHubStats,
  theme: ThemeColors,
  startY: number,
  cardWidth: number
): { svg: string; height: number } {
  const {
    currentStreak,
    longestStreak,
    totalContributionsAllTime,
    accountCreatedAt,
  } = stats;

  const circleRadius = 32;
  const strokeWidth = 5;
  const innerCardWidth = cardWidth - 80;
  const cardWidth3 = (innerCardWidth - 32) / 3;

  const svg = `
    <!-- Streak Section -->
    <g transform="translate(40, ${startY})">
      <!-- Total Contributions Card -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${
    theme.cardBackground
  }" stroke="${theme.border}" stroke-width="1"/>
        
        <g transform="translate(${cardWidth3 / 2}, 28)">
          ${renderIcon("contribution", -10, 0, theme.accent, 20)}
        </g>
        
        <text x="${
          cardWidth3 / 2
        }" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="${
    theme.accent
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${totalContributionsAllTime.toLocaleString()}
        </text>
        <text x="${
          cardWidth3 / 2
        }" y="94" text-anchor="middle" font-size="12" font-weight="600" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Total Contributions
        </text>
        <text x="${
          cardWidth3 / 2
        }" y="116" text-anchor="middle" font-size="10" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${formatDateFull(accountCreatedAt)} - Present
        </text>
      </g>
      
      <!-- Current Streak Card -->
      <g transform="translate(${cardWidth3 + 16}, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${
    theme.cardBackground
  }" stroke="${theme.border}" stroke-width="1"/>
        
        <!-- Circle Progress with fire icon on edge -->
        <g transform="translate(${cardWidth3 / 2}, 58)">
          <circle cx="0" cy="0" r="${circleRadius}" fill="none" stroke="${
    theme.border
  }" stroke-width="${strokeWidth}" opacity="0.4"/>
          <circle cx="0" cy="0" r="${circleRadius}" fill="none" stroke="${
    theme.accent
  }" stroke-width="${strokeWidth}" 
                  stroke-dasharray="${2 * Math.PI * circleRadius}" 
                  stroke-dashoffset="${
                    2 *
                    Math.PI *
                    circleRadius *
                    (1 - Math.min(currentStreak.count / 30, 1))
                  }"
                  transform="rotate(-90)"
                  stroke-linecap="round"/>
          <!-- Fire icon positioned at top edge of circle - no background -->
          <g transform="translate(-10, ${-circleRadius - 10})">
            ${renderIcon("fire", 0, 0, "#ff6b35", 20)}
          </g>
          <text x="0" y="8" text-anchor="middle" font-size="22" font-weight="700" fill="${
            theme.text
          }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
            ${currentStreak.count}
          </text>
        </g>
        
        <text x="${
          cardWidth3 / 2
        }" y="108" text-anchor="middle" font-size="12" font-weight="600" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Current Streak
        </text>
        <text x="${
          cardWidth3 / 2
        }" y="126" text-anchor="middle" font-size="10" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${
            currentStreak.startDate
              ? formatDateRange(currentStreak.startDate, currentStreak.endDate)
              : "No active streak"
          }
        </text>
      </g>
      
      <!-- Longest Streak Card -->
      <g transform="translate(${(cardWidth3 + 16) * 2}, 0)">
        <rect x="0" y="0" width="${cardWidth3}" height="140" rx="14" fill="${
    theme.cardBackground
  }" stroke="${theme.border}" stroke-width="1"/>
        
        <g transform="translate(${cardWidth3 / 2}, 28)">
          ${renderIcon("trophy", -10, 0, theme.accentSecondary, 20)}
        </g>
        
        <text x="${
          cardWidth3 / 2
        }" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="${
    theme.accentSecondary
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          ${longestStreak.count}
        </text>
        <text x="${
          cardWidth3 / 2
        }" y="94" text-anchor="middle" font-size="12" font-weight="600" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">
          Longest Streak
        </text>
        <text x="${
          cardWidth3 / 2
        }" y="116" text-anchor="middle" font-size="10" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" opacity="0.7" letter-spacing="0.2">
          ${
            longestStreak.startDate
              ? formatDateRange(longestStreak.startDate, longestStreak.endDate)
              : "N/A"
          }
        </text>
      </g>
    </g>
  `;

  return { svg, height: 160 };
}

function renderContributionLineGraph(
  stats: GitHubStats,
  theme: ThemeColors,
  startY: number,
  cardWidth: number
): { svg: string; height: number } {
  const { contributionData } = stats;

  if (!contributionData || contributionData.length === 0) {
    return { svg: "", height: 0 };
  }

  const last31Days = contributionData.slice(-31);

  // Get month info for title
  const firstDate = new Date(last31Days[0].date);
  const lastDate = new Date(last31Days[last31Days.length - 1].date);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let monthLabel: string;
  if (
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDate.getFullYear() === lastDate.getFullYear()
  ) {
    monthLabel = `${months[firstDate.getMonth()]} ${firstDate.getFullYear()}`;
  } else if (firstDate.getFullYear() === lastDate.getFullYear()) {
    monthLabel = `${months[firstDate.getMonth()].slice(0, 3)} - ${months[
      lastDate.getMonth()
    ].slice(0, 3)} ${lastDate.getFullYear()}`;
  } else {
    monthLabel = `${months[firstDate.getMonth()].slice(
      0,
      3
    )} ${firstDate.getFullYear()} - ${months[lastDate.getMonth()].slice(
      0,
      3
    )} ${lastDate.getFullYear()}`;
  }

  const innerWidth = cardWidth - 80;
  const graphWidth = innerWidth - 70;
  const graphHeight = 80;
  const maxCount = Math.max(...last31Days.map((d) => d.contributionCount), 1);

  // Build path and points using arrays for better performance
  const linePathParts: string[] = [];
  const points: { x: number; y: number; date: string }[] = [];

  for (let i = 0; i < last31Days.length; i++) {
    const day = last31Days[i];
    const x = (i / Math.max(last31Days.length - 1, 1)) * graphWidth;
    const y =
      graphHeight - (day.contributionCount / maxCount) * (graphHeight - 10);
    points.push({ x, y, date: day.date });
    linePathParts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }

  const linePath = linePathParts.join(" ");

  // Build data points SVG
  const dataPointsSvg = points
    .filter((_, i) => i % 5 === 0 || i === points.length - 1)
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="4" fill="${theme.accent}" stroke="${theme.cardBackground}" stroke-width="2"/>`
    )
    .join("");

  // Build x-axis labels
  const xAxisLabelsSvg = points
    .filter((_, i) => i % 7 === 0 || i === points.length - 1)
    .map((p) => {
      const date = new Date(p.date);
      return `<text x="${
        p.x
      }" y="0" text-anchor="middle" font-size="10" fill="${
        theme.textSecondary
      }" font-family="${FONT_FAMILY}" letter-spacing="0.2">${date.getDate()}</text>`;
    })
    .join("");

  const svg = `<g transform="translate(40, ${startY})">
      <rect x="0" y="0" width="${innerWidth}" height="${
    graphHeight + 80
  }" rx="14" fill="${theme.cardBackground}" stroke="${
    theme.border
  }" stroke-width="1"/>
      <g transform="translate(24, 26)">${renderIcon(
        "history",
        0,
        -1,
        theme.accent,
        18
      )}<text x="28" y="13" font-size="15" font-weight="600" fill="${
    theme.title
  }" font-family="${FONT_FAMILY}" letter-spacing="0.3">Contribution Activity</text><text x="28" y="34" font-size="12" fill="${
    theme.textSecondary
  }" font-family="${FONT_FAMILY}" letter-spacing="0.2">Daily contributions · ${monthLabel}</text></g>
      <g transform="translate(36, 62)">
        <text x="0" y="5" font-size="10" fill="${
          theme.textSecondary
        }" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">${maxCount}</text>
        <text x="0" y="${graphHeight / 2 + 2}" font-size="10" fill="${
    theme.textSecondary
  }" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">${Math.round(
    maxCount / 2
  )}</text>
        <text x="0" y="${graphHeight - 3}" font-size="10" fill="${
    theme.textSecondary
  }" text-anchor="end" font-family="${FONT_FAMILY}" letter-spacing="0.2">0</text>
        <line x1="10" y1="0" x2="${graphWidth + 12}" y2="0" stroke="${
    theme.border
  }" stroke-width="0.5" stroke-dasharray="4,2" opacity="0.4"/>
        <line x1="10" y1="${graphHeight / 2}" x2="${graphWidth + 12}" y2="${
    graphHeight / 2
  }" stroke="${
    theme.border
  }" stroke-width="0.5" stroke-dasharray="4,2" opacity="0.4"/>
        <line x1="10" y1="${graphHeight}" x2="${
    graphWidth + 12
  }" y2="${graphHeight}" stroke="${theme.border}" stroke-width="0.5"/>
      </g>
      <g transform="translate(52, 62)">
        <defs><linearGradient id="graphGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:${
          theme.accent
        };stop-opacity:0.3"/><stop offset="100%" style="stop-color:${
    theme.accent
  };stop-opacity:0.02"/></linearGradient></defs>
        <path d="${linePath} L ${graphWidth} ${graphHeight} L 0 ${graphHeight} Z" fill="url(#graphGradient)"/>
        <path d="${linePath}" fill="none" stroke="${
    theme.accent
  }" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dataPointsSvg}
      </g>
      <g transform="translate(52, ${graphHeight + 72})">${xAxisLabelsSvg}</g>
    </g>`;

  return { svg, height: graphHeight + 98 };
}

export function generateInsightCard(
  stats: GitHubStats,
  options: CardOptions
): string {
  const { theme } = options;
  const cardWidth = 850;
  let currentY = 36;

  // Header (includes profile, summary, and header chart based on options)
  const headerSection = renderHeaderSection(stats, theme, currentY, cardWidth, {
    showProfile: options.showProfile,
    showSummary: options.showSummary,
    showHeader: options.showHeader,
  });
  currentY += headerSection.height + (headerSection.height > 0 ? 3 : 0);

  // Stats and Languages side by side
  const showStats = options.showStats !== false;
  const showLanguages = options.showLanguages !== false;

  // Calculate positioning based on which cards are shown
  let statsStartX = 40;
  let languagesStartX = 433;

  // Center card if only one is shown
  if (showStats && !showLanguages) {
    statsStartX = (cardWidth - 377) / 2; // Center stats card
  } else if (!showStats && showLanguages) {
    languagesStartX = (cardWidth - 377) / 2; // Center languages card
  }

  const statsCard = showStats
    ? renderStatsCard(stats, theme, currentY, statsStartX)
    : { svg: "", height: 0 };

  const languagesCard = showLanguages
    ? renderLanguagesCard(stats, theme, currentY, languagesStartX)
    : { svg: "", height: 0 };

  const statsAndLangsHeight = Math.max(statsCard.height, languagesCard.height);
  currentY += statsAndLangsHeight + (statsAndLangsHeight > 0 ? 3 : 0);

  // Streak section
  const streakSection =
    options.showStreak !== false
      ? renderStreakSection(stats, theme, currentY, cardWidth)
      : { svg: "", height: 0 };
  currentY += streakSection.height + (streakSection.height > 0 ? 3 : 0);

  // Contribution graph
  const graphSection =
    options.showGraph !== false
      ? renderContributionLineGraph(stats, theme, currentY, cardWidth)
      : { svg: "", height: 0 };
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
  <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="16" fill="${
    theme.background
  }"/>
  <rect x="1" y="1" width="${cardWidth - 2}" height="${
    cardHeight - 2
  }" rx="15" fill="none" stroke="url(#borderGradient)" stroke-width="2"/>
  
  ${headerSection.svg}
  ${statsCard.svg}
  ${languagesCard.svg}
  ${streakSection.svg}
  ${graphSection.svg}
</svg>
  `.trim();

  return svg;
}
