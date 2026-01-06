'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// GitHub Octicons - matching GitHub's actual icons
const Icons = {
  github: (
    <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
    </svg>
  ),
  gear: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/>
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"/>
    </svg>
  ),
  copy: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
    </svg>
  ),
  heart: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="#db61a2" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"/>
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
    </svg>
  ),
  download: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
      <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
    </svg>
  ),
};

const themes = [
  { id: 'github_dark', name: 'GitHub Dark', bgColor: '#0d1117', accentColor: '#238636', textColor: '#e6edf3' },
  { id: 'radical', name: 'Radical', bgColor: '#141321', accentColor: '#fe428e', textColor: '#a9fef7' },
  { id: 'tokyonight', name: 'Tokyo Night', bgColor: '#1a1b26', accentColor: '#70a5fd', textColor: '#38bdae' },
  { id: 'dracula', name: 'Dracula', bgColor: '#282a36', accentColor: '#ff79c6', textColor: '#f8f8f2' },
  { id: 'synthwave', name: 'Synthwave', bgColor: '#2b213a', accentColor: '#e2571e', textColor: '#e5289e' },
  { id: 'ocean', name: 'Ocean', bgColor: '#0a192f', accentColor: '#64ffda', textColor: '#8892b0' },
   { 
  id: 'matrix', 
  name: 'Neo Green', 
  bgColor: '#121212',       // VS Code-like dark background
  accentColor: '#00c875',   // soft green highlight
  textColor: '#a6e22e',     // readable muted green for text
},
];

// GitHub's exact dark mode colors
const colors = {
  canvasDefault: '#0d1117',
  canvasSubtle: '#161b22',
  canvasInset: '#010409',
  borderDefault: '#30363d',
  borderMuted: '#21262d',
  fgDefault: '#e6edf3',
  fgMuted: '#7d8590',
  fgSubtle: '#6e7681',
  accentFg: '#2f81f7',
  accentEmphasis: '#1f6feb',
  successFg: '#3fb950',
  successEmphasis: '#238636',
  dangerFg: '#f85149',
};

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
  const [copied, setCopied] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Ref for the username input field
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const CloseIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ display: 'block' }}>
      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"/>
    </svg>
  );
  
  // Use ref to track timeout for proper cleanup
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
      // Detect mobile
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
    // Cleanup timeout on unmount
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const previewUrl = `/api/insight?username=${generatedUsername}&theme=${selectedTheme}&graph=${showGraph}&languages=${showLanguages}&streak=${showStreak}&stats=${showStats}&header=${showHeader}&summary=${showSummary}&profile=${showProfile}`;

  const handleGenerate = () => {
    if (username.trim()) {
      setIsGenerating(true);
      setHasError(false);
      setHasLoaded(false);
      setGeneratedUsername(username.trim());
      setRefreshKey(Date.now());
      
      // Check if API returns success before showing download buttons
      const checkUrl = `/api/insight?username=${username.trim()}&theme=${selectedTheme}&graph=${showGraph}&languages=${showLanguages}&streak=${showStreak}&stats=${showStats}&header=${showHeader}&summary=${showSummary}&profile=${showProfile}&_t=${Date.now()}`;
      fetch(checkUrl)
        .then(response => {
          if (response.ok) {
            setHasLoaded(true);
            setIsGenerating(false);
          } else {
            setHasError(true);
            setIsGenerating(false);
          }
        })
        .catch(() => {
          setHasError(true);
          setIsGenerating(false);
        });
      
      // Smooth scroll to preview section
      setTimeout(() => {
        const previewSection = document.getElementById('preview-section');
        if (previewSection) {
          previewSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  };

  const getMarkdownCode = () => `<p align="center">
  <img src="${baseUrl}${previewUrl}" alt="GitHub Insights" />
</p>`;
  const getHtmlCode = () => `<div align="center">
  <img src="${baseUrl}${previewUrl}" alt="GitHub Insights" />
</div>`;

  const copyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text);
    
    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    
    setCopied(type);
    
    // Set new timeout
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(null);
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

  const downloadImage = useCallback(async (format: 'png' | 'jpg' | 'svg') => {
    if (!generatedUsername || hasError) return;
    
    try {
      const response = await fetch(`${previewUrl}&_t=${refreshKey}`);
      const svgText = await response.text();
      
      if (format === 'svg') {
        // Download as SVG
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `github-insights-${generatedUsername}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert SVG to PNG or JPG using canvas
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width * 2; // 2x for better quality
          canvas.height = img.height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(2, 2);
            if (format === 'jpg') {
              ctx.fillStyle = '#0d1117'; // Dark background for JPG
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

  // Google Sans Flex font stack
  const fontFamily = "'Google Sans', 'Google Sans Text', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const monoFontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: colors.canvasDefault,
      color: colors.fgDefault,
      fontFamily,
      fontSize: '14px',
      lineHeight: 1.5,
    }}>
      {/* GitHub-style Header Bar */}
      <header style={{
        backgroundColor: colors.canvasSubtle,
        borderBottom: `1px solid ${colors.borderDefault}`,
        padding: '16px 24px',
      }}>
        <div style={{
          maxWidth: '960px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ color: colors.fgDefault }}>
            {Icons.github}
          </div>
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: colors.fgDefault,
              margin: 0,
              fontFamily,
            }}>
              GitHub Insights
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.fgMuted,
              margin: '2px 0 0 0',
              fontFamily,
            }}>
              Generate beautiful stats cards for your GitHub profile
            </p>
          </div>
        </div>
      </header>

      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '16px',
      }}>
        <style>{`
          @media (min-width: 768px) {
            .main-container { padding: 24px !important; }
          }
        `}</style>
        {/* Configuration Section */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${colors.borderMuted}`,
          }}>
            <span style={{ color: colors.fgMuted, display: 'flex' }}>{Icons.gear}</span>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.fgDefault,
              margin: 0,
              fontFamily,
            }}>
              Configuration
            </h2>
          </div>
          
          <div style={{
            backgroundColor: colors.canvasSubtle,
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: '6px',
            padding: '16px',
          }}>
            {/* Username Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.fgDefault,
                marginBottom: '8px',
                fontFamily,
              }}>
                GitHub Username
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '150px' }}>
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter username"
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 12px',
                      fontSize: '14px',
                      fontFamily,
                      lineHeight: '20px',
                      color: colors.fgDefault,
                      backgroundColor: colors.canvasDefault,
                      border: `1px solid ${colors.borderDefault}`,
                      borderRadius: '6px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.accentEmphasis;
                      e.target.style.boxShadow = `0 0 0 3px rgba(31, 111, 235, 0.3)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.borderDefault;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {username && (
                    <button
                      onClick={() => {
                        setUsername('');
                        // Focus the input field after clearing
                        setTimeout(() => {
                          usernameInputRef.current?.focus();
                        }, 0);
                      }}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        padding: 0,
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '3px',
                        color: colors.fgMuted,
                        cursor: 'pointer',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = colors.fgDefault;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = colors.fgMuted;
                      }}
                      title="Clear"
                    >
                      {CloseIcon}
                    </button>
                  )}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!username.trim()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 600,
                    fontFamily,
                    lineHeight: '20px',
                    color: !username.trim() ? colors.fgMuted : '#ffffff',
                    backgroundColor: !username.trim() ? colors.canvasSubtle : colors.successEmphasis,
                    border: `1px solid ${!username.trim() ? colors.borderDefault : colors.successEmphasis}`,
                    borderRadius: '6px',
                    cursor: !username.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                  }}
                  onMouseOver={(e) => {
                    if (username.trim()) {
                      e.currentTarget.style.backgroundColor = colors.successFg;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (username.trim()) {
                      e.currentTarget.style.backgroundColor = colors.successEmphasis;
                    }
                  }}
                >
                  Generate
                </button>
              </div>
            </div>

            {/* Theme Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.fgDefault,
                marginBottom: '8px',
                fontFamily,
              }}>
                Theme
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily,
                      color: selectedTheme === theme.id ? '#ffffff' : colors.fgDefault,
                      backgroundColor: selectedTheme === theme.id ? colors.accentEmphasis : colors.canvasDefault,
                      border: `1px solid ${selectedTheme === theme.id ? colors.accentEmphasis : colors.borderDefault}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseOver={(e) => {
                      if (selectedTheme !== theme.id) {
                        e.currentTarget.style.borderColor = colors.fgMuted;
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedTheme !== theme.id) {
                        e.currentTarget.style.borderColor = colors.borderDefault;
                      }
                    }}
                  >
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '2px',
                      backgroundColor: theme.bgColor,
                      border: `2px solid ${theme.accentColor}`,
                      flexShrink: 0,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <span style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        backgroundColor: theme.accentColor,
                        opacity: 0.3,
                      }} />
                    </span>
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: colors.fgDefault,
                marginBottom: '8px',
                fontFamily,
              }}>
                Display Options
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 20px',
              }}>
                {[
                  { id: 'profile', label: 'Name & Username', checked: showProfile, onChange: setShowProfile },
                  { id: 'summary', label: 'Summary Info', checked: showSummary, onChange: setShowSummary },
                  { id: 'header', label: 'Monthly Chart', checked: showHeader, onChange: setShowHeader },
                  { id: 'stats', label: 'GitHub Stats', checked: showStats, onChange: setShowStats },
                  { id: 'languages', label: 'Top Languages', checked: showLanguages, onChange: setShowLanguages },
                  { id: 'streak', label: 'Streak Stats', checked: showStreak, onChange: setShowStreak },
                  { id: 'graph', label: 'Contribution Graph', checked: showGraph, onChange: setShowGraph },
                ].map((option) => (
                  <label
                    key={option.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: colors.fgDefault,
                      fontFamily,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={option.checked}
                      onChange={(e) => option.onChange(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: colors.accentEmphasis,
                        cursor: 'pointer',
                      }}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div id="preview-section" style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${colors.borderMuted}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: colors.fgMuted, display: 'flex' }}>{Icons.eye}</span>
              <h2 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.fgDefault,
                margin: 0,
                fontFamily,
              }}>
                Preview
              </h2>
            </div>
            
            {/* Download buttons */}
            {generatedUsername && !hasError && !isGenerating && hasLoaded && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['svg', 'png', 'jpg'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => downloadImage(format)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily,
                      color: colors.fgDefault,
                      backgroundColor: colors.canvasSubtle,
                      border: `1px solid ${colors.borderDefault}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = colors.borderMuted;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = colors.canvasSubtle;
                    }}
                  >
                    {Icons.download}
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div style={{
            backgroundColor: colors.canvasInset,
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: '6px',
            padding: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            overflow: 'auto',
          }}>
            {!isMounted ? (
              <span style={{ color: colors.fgMuted, fontFamily }}>Loading...</span>
            ) : !generatedUsername ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  color: colors.fgMuted, 
                  fontFamily,
                  fontSize: '16px',
                  marginBottom: '8px'
                }}>
                  Enter a GitHub username and click Generate
                </div>
                <div style={{ 
                  color: colors.fgSubtle, 
                  fontFamily,
                  fontSize: '13px'
                }}>
                  Your insight card preview will appear here
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                {isGenerating && (
                  <div style={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: 10,
                    backgroundColor: 'rgba(1, 4, 9, 0.8)',
                    padding: isMobile ? '16px 12px' : '24px',
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: `3px solid ${colors.borderDefault}`,
                      borderTopColor: colors.accentFg,
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px',
                    }} />
                    <span style={{ color: colors.fgMuted, fontFamily }}>
                      Generating preview for <strong style={{ color: colors.fgDefault }}>{generatedUsername}</strong>...<br />
                      <span style={{ fontSize: '12px', color: colors.fgSubtle }}>This may take a while</span>
                    </span>
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                )}
                {hasError ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '8px',
                    }}>
                      <div style={{ color: colors.dangerFg }}>
                        {Icons.alert}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: colors.dangerFg,
                        fontFamily,
                      }}>
                        User not found
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: colors.fgMuted,
                      fontFamily,
                    }}>
                      The username &quot;<strong style={{ color: colors.fgDefault }}>{generatedUsername}</strong>&quot; does not exist on GitHub.
                      <br />Please check the spelling and try again.
                    </div>
                  </div>
                ) : (
                  <img
                    key={refreshKey}
                    src={`${previewUrl}&_t=${refreshKey}`}
                    alt="GitHub Insights Preview"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      opacity: isGenerating ? 0.3 : 1,
                      transition: 'opacity 0.3s ease',
                    }}
                    onLoad={() => {
                      // Loading state is managed by the fetch check
                    }}
                    onError={() => {
                      setIsGenerating(false);
                      setHasError(true);
                      setHasLoaded(false);
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Embed Code Section - Only show when username is generated, no error, and loaded */}
        {generatedUsername && !hasError && hasLoaded && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${colors.borderMuted}`,
          }}>
            <span style={{ color: colors.fgMuted, display: 'flex' }}>{Icons.code}</span>
            <h2 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: colors.fgDefault,
              margin: 0,
              fontFamily,
            }}>
              Embed Code
            </h2>
          </div>
          
          <div style={{
            backgroundColor: colors.canvasSubtle,
            border: `1px solid ${colors.borderDefault}`,
            borderRadius: '6px',
            padding: '16px',
          }}>
            {/* Markdown Code Block */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.fgMuted,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily,
              }}>
                Markdown
              </div>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  paddingRight: '56px',
                  backgroundColor: colors.canvasDefault,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: monoFontFamily,
                  color: colors.fgDefault,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.45,
                }}>
                  {isMounted ? getMarkdownCode() : 'Loading...'}
                </pre>
                <button
                  onClick={() => copyToClipboard(getMarkdownCode(), 'markdown')}
                  title={copied === 'markdown' ? 'Copied!' : 'Copy'}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: copied === 'markdown' ? colors.successFg : colors.fgMuted,
                    backgroundColor: colors.canvasSubtle,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.borderMuted;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.canvasSubtle;
                  }}
                >
                  {copied === 'markdown' ? Icons.check : Icons.copy}
                </button>
              </div>
            </div>

            {/* HTML Code Block */}
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.fgMuted,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily,
              }}>
                HTML
              </div>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  margin: 0,
                  padding: '16px',
                  paddingRight: '56px',
                  backgroundColor: colors.canvasDefault,
                  border: `1px solid ${colors.borderDefault}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: monoFontFamily,
                  color: colors.fgDefault,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  lineHeight: 1.45,
                }}>
                  {isMounted ? getHtmlCode() : 'Loading...'}
                </pre>
                <button
                  onClick={() => copyToClipboard(getHtmlCode(), 'html')}
                  title={copied === 'html' ? 'Copied!' : 'Copy'}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: copied === 'html' ? colors.successFg : colors.fgMuted,
                    backgroundColor: colors.canvasSubtle,
                    border: `1px solid ${colors.borderDefault}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = colors.borderMuted;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = colors.canvasSubtle;
                  }}
                >
                  {copied === 'html' ? Icons.check : Icons.copy}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <footer style={{
          paddingTop: '24px',
          borderTop: `1px solid ${colors.borderMuted}`,
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: colors.fgDefault,
            fontFamily,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 500,
          }}>
            Free and open source •{' '}
            <a
              href="https://github.com/nishatrhythm/GitHub-Insights"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.accentFg,
                textDecoration: 'none',
                fontWeight: 600,
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              Contribute on GitHub
            </a>
          </p>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: colors.fgMuted,
            fontFamily,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            Made with {Icons.heart} by{' '}
            <a
              href="https://github.com/nishatrhythm"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.accentFg,
                textDecoration: 'none',
                fontWeight: 600,
              }}
              onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
            >
              nishatrhythm
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
