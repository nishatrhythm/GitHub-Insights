import { ThemeColors } from '@/types/github';

export const themes: Record<string, ThemeColors> = {
  dark: {
    background: '#0d1117',
    backgroundGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
    cardBackground: '#161b22',
    border: '#30363d',
    title: '#f0f6fc',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    accent: '#58a6ff',
    accentSecondary: '#238636',
    iconColor: '#8b949e',
    contributionLevels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  
  radical: {
    background: '#141321',
    backgroundGradient: 'linear-gradient(135deg, #141321 0%, #1a1b27 50%, #141321 100%)',
    cardBackground: '#1a1b27',
    border: '#fe428e',
    title: '#fe428e',
    text: '#f8f8f2',
    textSecondary: '#a9fef7',
    accent: '#f8d847',
    accentSecondary: '#a9fef7',
    iconColor: '#fe428e',
    contributionLevels: ['#1a1b27', '#5a1f3f', '#8b2a5f', '#c73e7f', '#fe428e'],
  },

  tokyonight: {
    background: '#1a1b26',
    backgroundGradient: 'linear-gradient(135deg, #1a1b26 0%, #24283b 50%, #1a1b26 100%)',
    cardBackground: '#24283b',
    border: '#414868',
    title: '#70a5fd',
    text: '#a9b1d6',
    textSecondary: '#565f89',
    accent: '#bb9af7',
    accentSecondary: '#9ece6a',
    iconColor: '#7aa2f7',
    contributionLevels: ['#24283b', '#394b70', '#4e6ea5', '#6392d9', '#7aa2f7'],
  },

  dracula: {
    background: '#282a36',
    backgroundGradient: 'linear-gradient(135deg, #282a36 0%, #44475a 50%, #282a36 100%)',
    cardBackground: '#44475a',
    border: '#6272a4',
    title: '#ff79c6',
    text: '#f8f8f2',
    textSecondary: '#6272a4',
    accent: '#bd93f9',
    accentSecondary: '#50fa7b',
    iconColor: '#ff79c6',
    contributionLevels: ['#44475a', '#5a5f7a', '#7159a8', '#9b6bd6', '#bd93f9'],
  },

  github_dark: {
    background: '#0d1117',
    backgroundGradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
    cardBackground: '#161b22',
    border: '#30363d',
    title: '#58a6ff',
    text: '#c9d1d9',
    textSecondary: '#8b949e',
    accent: '#58a6ff',
    accentSecondary: '#3fb950',
    iconColor: '#58a6ff',
    contributionLevels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },

  synthwave: {
    background: '#2b213a',
    backgroundGradient: 'linear-gradient(135deg, #2b213a 0%, #1a1225 50%, #2b213a 100%)',
    cardBackground: '#1a1225',
    border: '#e2571e',
    title: '#e2571e',
    text: '#e5289e',
    textSecondary: '#ff7edb',
    accent: '#00f3ff',
    accentSecondary: '#03edf9',
    iconColor: '#e2571e',
    contributionLevels: ['#1a1225', '#5e2a4f', '#a23279', '#e23a9e', '#ff7edb'],
  },

  ocean: {
    background: '#0a192f',
    backgroundGradient: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #0a192f 100%)',
    cardBackground: '#112240',
    border: '#233554',
    title: '#64ffda',
    text: '#ccd6f6',
    textSecondary: '#8892b0',
    accent: '#64ffda',
    accentSecondary: '#57cbff',
    iconColor: '#64ffda',
    contributionLevels: ['#112240', '#1a4a5e', '#23727c', '#2d9a9a', '#64ffda'],
  },
    matrix: {
  background: '#121212',
  backgroundGradient:
    'linear-gradient(135deg, #121212 0%, #181818 50%, #121212 100%)',
  cardBackground: '#181818',
  border: '#00c875',
  title: '#00c875',
  text: '#a6e22e',
  textSecondary: '#66b266',
  accent: '#00c875',
  accentSecondary: '#33ff99',
  iconColor: '#00c875',
  contributionLevels: [
    '#181818',
    '#223322',
    '#2d552d',
    '#44aa44',
    '#00c875',
  ],
},



};

export function getTheme(themeName: string): ThemeColors {
  return themes[themeName] || themes.github_dark;
}
