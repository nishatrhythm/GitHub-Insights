'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Palette,
  Check,
  Copy,
  Download,
  Code2,
  Sliders,
  User,
  Flame,
  BarChart3,
  Activity,
  Trophy,
  LineChart,
  Sun,
  Moon,
  Monitor,
  RotateCw,
  Search,
  X,
  AlertCircle,
  FileCode,
  Terminal,
  History,
  Plus,
} from 'lucide-react';

type SiteTheme = 'light' | 'dark' | 'system';

interface CardThemeOption {
  id: string;
  name: string;
  bgColor: string;
  cardColor: string;
  accentColor: string;
  textColor: string;
}

const CARD_THEMES: CardThemeOption[] = [
  { id: 'github_dark', name: 'GitHub Dark', bgColor: '#0d1117', cardColor: '#161b22', accentColor: '#58a6ff', textColor: '#c9d1d9' },
  { id: 'github_light', name: 'GitHub Light', bgColor: '#f6f8fa', cardColor: '#ffffff', accentColor: '#0550ae', textColor: '#24292f' },
  { id: 'tokyonight', name: 'Tokyo Night', bgColor: '#1a1b26', cardColor: '#24283b', accentColor: '#70a5fd', textColor: '#a9b1d6' },
  { id: 'dracula', name: 'Dracula', bgColor: '#282a36', cardColor: '#44475a', accentColor: '#ff79c6', textColor: '#f8f8f2' },
  { id: 'radical', name: 'Radical', bgColor: '#141321', cardColor: '#1a1b27', accentColor: '#fe428e', textColor: '#f8f8f2' },
  { id: 'synthwave', name: 'Synthwave', bgColor: '#2b213a', cardColor: '#1a1225', accentColor: '#e2571e', textColor: '#e5289e' },
  { id: 'ocean', name: 'Ocean', bgColor: '#0a192f', cardColor: '#112240', accentColor: '#64ffda', textColor: '#ccd6f6' },
  { id: 'ocean_radical', name: 'Ocean Radical', bgColor: '#050b14', cardColor: '#0a192f', accentColor: '#fe428e', textColor: '#ccd6f6' },
  { id: 'neo_green', name: 'Neo Green', bgColor: '#121212', cardColor: '#181818', accentColor: '#00c875', textColor: '#a6e22e' },
];

const DEMO_USERNAMES = ['mojombo', 'torvalds', 'karpathy', 'sindresorhus', 'gaearon', 'shadcn'];
const QUICK_EXCLUDE_LANGS = ['HTML', 'CSS', 'Jupyter Notebook', 'SCSS', 'Makefile'];

function GitHubLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [generatedUsername, setGeneratedUsername] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('github_dark');
  const [showGraph, setShowGraph] = useState(true);
  const [showLanguages, setShowLanguages] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [showSummary, setShowSummary] = useState(true);
  const [showProfile, setShowProfile] = useState(true);
  const [hiddenLangs, setHiddenLangs] = useState<string[]>([]);
  const [langInput, setLangInput] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'markdown' | 'html'>('markdown');
  const [baseUrl, setBaseUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [siteTheme, setSiteTheme] = useState<SiteTheme>('system');
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInteractedThemeRef = useRef(false);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);

      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemPrefersDark(mql.matches);
      const handleThemeChange = (e: MediaQueryListEvent) => {
        setSystemPrefersDark(e.matches);
        const currentSaved = localStorage.getItem('site-theme') as SiteTheme | null;
        const currentMode = currentSaved && ['light', 'dark', 'system'].includes(currentSaved) ? currentSaved : 'system';
        if (currentMode === 'system') {
          setSelectedTheme((prev) => {
            if (prev === 'github_dark' && !e.matches) return 'github_light';
            if (prev === 'github_light' && e.matches) return 'github_dark';
            return prev;
          });
        }
      };
      mql.addEventListener('change', handleThemeChange);

      const savedTheme = localStorage.getItem('site-theme') as SiteTheme | null;
      const activeSiteTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setSiteTheme(savedTheme);
      }

      const isSystemDark = mql.matches;
      const effectiveDark = activeSiteTheme === 'system' ? isSystemDark : activeSiteTheme === 'dark';
      setSelectedTheme(effectiveDark ? 'github_dark' : 'github_light');

      try {
        const savedSearches = localStorage.getItem('github_insights_recent_searches');
        if (savedSearches) {
          const parsed = JSON.parse(savedSearches);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.slice(0, 10));
          }
        }
      } catch (e) {}

      return () => {
        mql.removeEventListener('change', handleThemeChange);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
      };
    }
  }, []);

  const resolvedTheme = siteTheme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : siteTheme;
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('site-theme', siteTheme);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    }
  }, [siteTheme, isDark, isMounted]);

  const hideLangsParam = hiddenLangs.length > 0 ? `&hide_langs=${encodeURIComponent(hiddenLangs.join(','))}` : '';
  const previewUrl = `/api/insight?username=${generatedUsername}&theme=${selectedTheme}&graph=${showGraph}&languages=${showLanguages}&streak=${showStreak}&stats=${showStats}&header=${showHeader}&summary=${showSummary}&profile=${showProfile}${hideLangsParam}`;

  const triggerGenerate = useCallback((targetUser: string) => {
    const trimmed = targetUser.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setHasError(false);
    setHasLoaded(false);
    setGeneratedUsername(trimmed);
    setRefreshKey(Date.now());

    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setTimeout(() => {
        if (previewSectionRef.current) {
          const yOffset = -80;
          const element = previewSectionRef.current;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 120);
    }

    const checkUrl = `/api/insight?username=${trimmed}&theme=${selectedTheme}&graph=${showGraph}&languages=${showLanguages}&streak=${showStreak}&stats=${showStats}&header=${showHeader}&summary=${showSummary}&profile=${showProfile}${hideLangsParam}&_t=${Date.now()}`;
    
    fetch(checkUrl)
      .then((response) => {
        if (response.ok) {
          setHasLoaded(true);
          setIsGenerating(false);

          setRecentSearches((prev) => {
            const updated = [trimmed, ...prev.filter((u) => u.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
            try {
              localStorage.setItem('github_insights_recent_searches', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        } else {
          setHasError(true);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        setHasError(true);
        setIsGenerating(false);
      });
  }, [selectedTheme, showGraph, showLanguages, showStreak, showStats, showHeader, showSummary, showProfile, hideLangsParam]);

  const handleGenerate = () => {
    triggerGenerate(username);
  };

  const handleQuickDemo = (demoUser: string) => {
    setUsername(demoUser);
    usernameInputRef.current?.focus();
  };

  const handleAddLanguage = () => {
    const cleaned = langInput.trim().replace(/,/g, '');
    if (cleaned && !hiddenLangs.some((l) => l.toLowerCase() === cleaned.toLowerCase())) {
      setHiddenLangs((prev) => [...prev, cleaned]);
      setLangInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const handleSiteThemeChange = (mode: SiteTheme) => {
    hasInteractedThemeRef.current = true;
    setSiteTheme(mode);
    const willBeDark = mode === 'system' ? systemPrefersDark : mode === 'dark';
    setSelectedTheme((prev) => {
      if (prev === 'github_dark' && !willBeDark) return 'github_light';
      if (prev === 'github_light' && willBeDark) return 'github_dark';
      return prev;
    });
  };

  const activeModulesCount =
    (showProfile ? 1 : 0) +
    (showSummary ? 1 : 0) +
    (showHeader ? 1 : 0) +
    (showStats ? 1 : 0) +
    (showLanguages ? 1 : 0) +
    (showStreak ? 1 : 0) +
    (showGraph ? 1 : 0);

  const handleToggleModule = (checked: boolean, setter: (val: boolean) => void) => {
    if (!checked && activeModulesCount <= 1) {
      return;
    }
    setter(checked);
  };

  const getMarkdownCode = () => `<p align="center">
  <img src="${baseUrl}${previewUrl}" alt="${generatedUsername}'s GitHub Insights" />
</p>`;

  const getHtmlCode = () => `<div align="center">
  <img src="${baseUrl}${previewUrl}" alt="${generatedUsername}'s GitHub Insights" />
</div>`;

  const getDirectUrl = () => `${baseUrl}${previewUrl}`;

  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    setCopiedType(type);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedType(null);
      copyTimeoutRef.current = null;
    }, 2200);
  }, []);

  const downloadImage = useCallback(async (format: 'png' | 'jpg' | 'svg') => {
    if (!generatedUsername || hasError) return;

    try {
      const response = await fetch(`${previewUrl}&_t=${refreshKey}`);
      const svgText = await response.text();

      if (format === 'svg') {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-insights-${generatedUsername}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(2, 2);
            if (format === 'jpg') {
              ctx.fillStyle = '#0d1117';
              ctx.fillRect(0, 0, img.width, img.height);
            }
            ctx.drawImage(img, 0, 0);

            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `github-insights-${generatedUsername}.${format}`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }, mimeType, 0.95);
          }
          URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [generatedUsername, hasError, previewUrl, refreshKey]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}
      >
        <div
          className="navbar-container"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '0 20px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
            <img
              src="/icon.png"
              alt="GitHub Insights Logo"
              width={32}
              height={32}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              className="no-drag"
              style={{
                borderRadius: '8px',
                display: 'block',
                flexShrink: 0,
                userSelect: 'none',
              }}
            />
            <div>
              <span
                className="navbar-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                }}
              >
                GitHub Insights
              </span>
            </div>
          </div>

          
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            
            <div
              className="theme-toggle-container"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                padding: '3px',
                borderRadius: '12px',
                backgroundColor: 'var(--theme-switch-bg)',
                border: '1px solid var(--theme-switch-border)',
                gap: '2px',
              }}
            >
              {(['light', 'dark', 'system'] as SiteTheme[]).map((mode) => {
                const isSelected = siteTheme === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleSiteThemeChange(mode)}
                    title={`Switch to ${mode} mode`}
                    className="theme-toggle-btn"
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: isSelected ? 'var(--theme-pill-color)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      zIndex: 1,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {isMounted && isSelected && (
                      <motion.div
                        layoutId="active-theme-pill"
                        transition={
                          hasInteractedThemeRef.current
                            ? { type: 'spring', stiffness: 500, damping: 35 }
                            : { duration: 0 }
                        }
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '8px',
                          backgroundColor: 'var(--theme-pill-bg)',
                          border: '1px solid var(--theme-pill-border)',
                          boxShadow: 'var(--theme-pill-shadow)',
                          zIndex: -1,
                        }}
                      />
                    )}
                    {mode === 'light' && <Sun size={14} />}
                    {mode === 'dark' && <Moon size={14} />}
                    {mode === 'system' && <Monitor size={14} />}
                  </button>
                );
              })}
            </div>

            
            <a
              href="https://github.com/nishatrhythm/GitHub-Insights"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary star-btn"
              title="Star on GitHub"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              <GitHubLogo size={14} />
              <span className="star-btn-text" style={{ fontSize: '13px', fontWeight: 600 }}>Star</span>
            </a>
          </div>
        </div>
      </motion.header>

      
      <main className="main-content" style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '36px 20px 60px' }}>
        
        
        <section className="hero-container" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto 36px' }}>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: 'clamp(24px, 3.8vw, 36px)',
              fontWeight: 800,
              letterSpacing: '-0.8px',
              lineHeight: 1.25,
              marginBottom: '12px',
              color: 'var(--text-main)',
              textWrap: 'balance',
            }}
          >
            Elegant telemetry for your{' '}
            <span
              style={{
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                whiteSpace: 'nowrap',
              }}
            >
              GitHub profile
            </span>
          </motion.h1>

          <motion.p
            className="hero-desc"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontSize: '15px',
              lineHeight: 1.5,
              color: 'var(--text-muted)',
              marginBottom: '20px',
            }}
          >
            Live analytics and contribution cards for your README.
          </motion.p>

          
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Try with popular profiles
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              {DEMO_USERNAMES.map((user) => (
                <button
                  key={user}
                  onClick={() => handleQuickDemo(user)}
                  className="btn-secondary"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    padding: '4px 9px',
                    borderRadius: '8px',
                  }}
                >
                  @{user}
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px',
            alignItems: 'start',
          }}
        >
          
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            
            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                    color: isDark ? '#60a5fa' : '#2563eb',
                    display: 'flex',
                  }}
                >
                  <User size={16} />
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Target Account
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '14px', color: 'var(--text-subtle)', display: 'flex' }}>
                    <Search size={16} />
                  </div>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter GitHub username..."
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '11px 40px 11px 40px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-field)',
                      backgroundColor: 'var(--bg-field)',
                      color: 'var(--text-main)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {username && (
                    <button
                      onClick={() => {
                        setUsername('');
                        usernameInputRef.current?.focus();
                      }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        padding: '4px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                
                {recentSearches.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-subtle)' }}>
                        <History size={12} />
                        <span>Recent searches:</span>
                      </div>
                      <button
                        onClick={() => {
                          setRecentSearches([]);
                          try {
                            localStorage.removeItem('github_insights_recent_searches');
                          } catch (e) {}
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '0 2px',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                      >
                        Clear
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {recentSearches.map((recentUser) => (
                        <button
                          key={recentUser}
                          onClick={() => {
                            setUsername(recentUser);
                            usernameInputRef.current?.focus();
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: '6px',
                          }}
                        >
                          @{recentUser}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!username.trim() || isGenerating}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: '14px',
                  }}
                >
                  {isGenerating ? (
                    <>
                      <RotateCw size={16} className="animate-spin" />
                      <span>Fetching Telemetry...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Insights</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(147, 51, 234, 0.08)',
                    color: isDark ? '#c084fc' : '#9333ea',
                    display: 'flex',
                  }}
                >
                  <Palette size={16} />
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Card Theme
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                  gap: '10px',
                }}
              >
                {CARD_THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-option)',
                        backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-subtle)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 0 1px var(--primary), 0 0 12px var(--primary-glow)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        
                        <div
                          style={{
                            width: '32px',
                            height: '18px',
                            borderRadius: '5px',
                            backgroundColor: theme.bgColor,
                            border: '1px solid var(--border-field)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '0 4px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: theme.accentColor,
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              height: '2.5px',
                              flex: 1,
                              borderRadius: '2px',
                              backgroundColor: theme.accentColor,
                              opacity: 0.8,
                            }}
                          />
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Check size={10} />
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {theme.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.08)',
                    color: isDark ? '#34d399' : '#059669',
                    display: 'flex',
                  }}
                >
                  <Sliders size={16} />
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Active Telemetry Modules
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'profile', label: 'Identity Header', desc: 'Name, handle, location & join date', checked: showProfile, setter: setShowProfile, icon: User },
                  { id: 'summary', label: '12-Month Summary', desc: 'Yearly contributions & public repos', checked: showSummary, setter: setShowSummary, icon: Flame },
                  { id: 'header', label: 'Monthly Trend', desc: 'Month-by-month volume curve', checked: showHeader, setter: setShowHeader, icon: BarChart3 },
                  { id: 'stats', label: 'Metric Ratings', desc: 'Stars, PRs, issues & letter grade', checked: showStats, setter: setShowStats, icon: Activity },
                  { id: 'languages', label: 'Top Languages', desc: 'Most utilized languages breakdown', checked: showLanguages, setter: setShowLanguages, icon: Code2 },
                  { id: 'streak', label: 'Streak Metrics', desc: 'Active & all-time longest streaks', checked: showStreak, setter: setShowStreak, icon: Trophy },
                  { id: 'graph', label: '31-Day Activity', desc: 'Daily contribution density chart', checked: showGraph, setter: setShowGraph, icon: LineChart },
                ].map((item) => {
                  const Icon = item.icon;
                  const isLastActive = item.checked && activeModulesCount <= 1;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: item.checked ? 'var(--bg-card)' : 'var(--bg-subtle)',
                        border: '1px solid var(--border-option)',
                        boxShadow: item.checked ? 'var(--shadow-sm)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '6px',
                            borderRadius: '8px',
                            backgroundColor: item.checked ? 'var(--bg-subtle)' : 'var(--bg-card)',
                            color: item.checked ? 'var(--primary)' : 'var(--text-subtle)',
                            display: 'flex',
                            border: '1px solid var(--border-option)',
                            boxShadow: item.checked ? 'var(--shadow-sm)' : 'none',
                          }}
                        >
                          <Icon size={14} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: item.checked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '11px', color: item.checked ? 'var(--text-muted)' : 'var(--text-subtle)' }}>
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <label
                        className="switch"
                        title={isLastActive ? 'At least one telemetry module must remain enabled' : undefined}
                        style={{
                          opacity: isLastActive ? 0.6 : 1,
                          cursor: isLastActive ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled={isLastActive}
                          onChange={(e) => handleToggleModule(e.target.checked, item.setter)}
                        />
                        <span className="slider" />
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.08)',
                    color: isDark ? '#fbbf24' : '#d97706',
                    display: 'flex',
                  }}
                >
                  <FileCode size={16} />
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Exclude Specific Languages
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Hide markup, styling, or auto-generated languages from the language breakdown chart.
              </p>

              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                  placeholder="Enter language name..."
                  className="input-field"
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-field)',
                    backgroundColor: 'var(--bg-field)',
                    color: 'var(--text-main)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAddLanguage}
                  disabled={!langInput.trim()}
                  style={{
                    padding: '9px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '10px',
                    border: langInput.trim() ? '1px solid var(--primary)' : '1px solid var(--border-option)',
                    backgroundColor: langInput.trim() ? 'var(--primary)' : 'var(--bg-card)',
                    color: langInput.trim() ? '#ffffff' : 'var(--text-muted)',
                    cursor: langInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: langInput.trim() ? 1 : 0.6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: langInput.trim() ? '0 2px 8px var(--primary-glow)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              
              {hiddenLangs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {hiddenLangs.map((lang) => (
                    <span
                      key={lang}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 9px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-option)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      {lang}
                      <button
                        onClick={() => setHiddenLangs((prev) => prev.filter((l) => l !== lang))}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          padding: 0,
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-subtle)' }}>Quick exclude:</span>
                {QUICK_EXCLUDE_LANGS.map((quickLang) => {
                  const isHidden = hiddenLangs.some((l) => l.toLowerCase() === quickLang.toLowerCase());
                  return (
                    <button
                      key={quickLang}
                      onClick={() => {
                        if (isHidden) {
                          setHiddenLangs((prev) => prev.filter((l) => l.toLowerCase() !== quickLang.toLowerCase()));
                        } else {
                          setHiddenLangs((prev) => [...prev, quickLang]);
                        }
                      }}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        border: isHidden ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: isHidden ? 'var(--primary-glow)' : 'transparent',
                        color: isHidden ? 'var(--primary)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isHidden ? <Check size={10} /> : <Plus size={10} />}
                      <span>{quickLang}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </motion.div>

          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '84px' }}
          >
            
            
            <div ref={previewSectionRef} id="preview-section" className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
              
              
              <div
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', opacity: 0.8 }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b', opacity: 0.8 }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', opacity: 0.8 }} />
                  </div>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {generatedUsername ? `${generatedUsername}-insights.svg` : 'preview.svg'}
                  </span>
                </div>

                {generatedUsername && !hasError && hasLoaded && !isGenerating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(['svg', 'png', 'jpg'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => downloadImage(fmt)}
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        <Download size={12} />
                        <span>{fmt.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              
              <div
                style={{
                  padding: '28px 20px',
                  backgroundColor: 'var(--bg-inset)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '340px',
                  overflow: 'auto',
                }}
              >
                {!isMounted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-subtle)' }}>
                    <RotateCw size={16} className="animate-spin" />
                    <span>Loading Studio...</span>
                  </div>
                ) : !generatedUsername ? (
                  <div style={{ textAlign: 'center', maxWidth: '320px', padding: '20px 0' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        margin: '0 auto 12px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <Activity size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                      No Profile Selected
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Enter a GitHub username or select a popular profile above to render the live telemetry card.
                    </p>
                  </div>
                ) : hasError ? (
                  <div style={{ textAlign: 'center', padding: '36px 20px', maxWidth: '360px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        margin: '0 auto 12px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AlertCircle size={22} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444', marginBottom: '6px' }}>
                      User Not Found
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      The account <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>@{generatedUsername}</strong> was not found on GitHub. Please verify the username.
                    </p>
                  </div>
                ) : !hasLoaded || isGenerating ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '48px 24px',
                      minHeight: '280px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-option)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      <RotateCw size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                      Generating Telemetry Card
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Fetching live GitHub stats for <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>@{generatedUsername}</span>...
                    </p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <motion.img
                      key={refreshKey}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      src={`${previewUrl}&_t=${refreshKey}`}
                      alt="GitHub Insights Card Preview"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      className="no-drag"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        boxShadow: 'var(--shadow-lg)',
                        userSelect: 'none',
                      }}
                      onError={() => {
                        setIsGenerating(false);
                        setHasError(true);
                        setHasLoaded(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            
            {generatedUsername && !hasError && hasLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-panel"
                style={{ padding: '20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                        color: isDark ? '#60a5fa' : '#2563eb',
                        display: 'flex',
                      }}
                    >
                      <Terminal size={14} />
                    </div>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Embed Code
                    </h2>
                  </div>

                  
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '3px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--theme-switch-bg)',
                      border: '1px solid var(--theme-switch-border)',
                      gap: '2px',
                    }}
                  >
                    {[
                      { id: 'markdown', label: 'Markdown', icon: FileCode },
                      { id: 'html', label: 'HTML', icon: Code2 },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeCodeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCodeTab(tab.id as 'markdown' | 'html')}
                          className="embed-tab-btn"
                          style={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '7px',
                            fontSize: '11.5px',
                            fontWeight: isActive ? 600 : 500,
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: isActive ? 'var(--theme-pill-color)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            zIndex: 1,
                            transition: 'color 0.15s ease',
                          }}
                        >
                          {isMounted && isActive && (
                            <motion.div
                              layoutId="active-embed-tab-pill"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '7px',
                                backgroundColor: 'var(--theme-pill-bg)',
                                border: '1px solid var(--theme-pill-border)',
                                boxShadow: 'var(--theme-pill-shadow)',
                                zIndex: -1,
                              }}
                            />
                          )}
                          <Icon size={13} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                
                <div style={{ position: 'relative' }}>
                  <pre
                    className="code-snippet-box"
                    style={{
                      margin: 0,
                      padding: '14px',
                      paddingRight: '60px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-field)',
                      backgroundColor: 'var(--bg-field)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-main)',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      lineHeight: 1.5,
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.12)',
                    }}
                  >
                    {activeCodeTab === 'markdown' && getMarkdownCode()}
                    {activeCodeTab === 'html' && getHtmlCode()}
                  </pre>

                  <button
                    onClick={() => {
                      const text = activeCodeTab === 'markdown' ? getMarkdownCode() : getHtmlCode();
                      copyToClipboard(text, activeCodeTab);
                    }}
                    className="btn-secondary code-copy-btn"
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '5px 10px',
                      fontSize: '11px',
                      backgroundColor: copiedType === activeCodeTab ? '#10b981' : undefined,
                      color: copiedType === activeCodeTab ? '#ffffff' : undefined,
                      borderColor: copiedType === activeCodeTab ? '#10b981' : undefined,
                    }}
                  >
                    {copiedType === activeCodeTab ? (
                      <>
                        <Check size={12} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

          </motion.div>

        </div>

        
        <motion.footer
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: '60px',
            paddingTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>Free and open source</span>
            <span>•</span>
            <span>
              Made possible by{' '}
              <a
                href="https://github.com/nishatrhythm/GitHub-Insights/graphs/contributors"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                community contributors
              </a>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a
              href="https://github.com/nishatrhythm/GitHub-Insights"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              GitHub Repository
            </a>
            <span>•</span>
            <a
              href="https://github.com/nishatrhythm/GitHub-Insights/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              MIT License
            </a>
            <span>•</span>
            <span>
              Author:{' '}
              <a
                href="https://github.com/nishatrhythm"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  fontWeight: 600,
                  transition: 'color 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                @nishatrhythm
              </a>
            </span>
          </div>
        </motion.footer>

      </main>
    </div>
  );
}