import React, { useState } from 'react';
import { MediaControls } from '../Controls/MediaControls';
import { CostPanel } from '../CostPanel/CostPanel';
import { ComparisonPanel } from '../ComparisonPanel/ComparisonPanel';
import styles from './PanelTabs.module.css';

interface PanelTabsProps {
  onClearHistory?: () => void;
}

type TabKey = 'settings' | 'cost' | 'comparison';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'settings', label: '设置' },
  { key: 'cost', label: '成本面板' },
  { key: 'comparison', label: '方案对比' },
];

export const PanelTabs: React.FC<PanelTabsProps> = ({ onClearHistory }) => {
  const [active, setActive] = useState<TabKey>('settings');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${active === t.key ? styles.tabActive : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        {active === 'settings' && <MediaControls onClearHistory={onClearHistory} />}
        {active === 'cost' && <CostPanel />}
        {active === 'comparison' && <ComparisonPanel />}
      </div>
    </div>
  );
};
