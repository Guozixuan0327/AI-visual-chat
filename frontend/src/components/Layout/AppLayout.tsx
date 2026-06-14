import React from 'react';
import styles from './AppLayout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#logoGrad)" />
              <path d="M2 17l10 5 10-5" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
              <path d="M2 12l10 5 10-5" stroke="url(#logoGrad)" strokeWidth="2" fill="none" />
              <defs>
                <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.title}>AI 视觉对话助手</h1>
          <span className={styles.badge}>Qwen-VL</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.statusDot}></span>
          <span className={styles.status}>在线</span>
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};
