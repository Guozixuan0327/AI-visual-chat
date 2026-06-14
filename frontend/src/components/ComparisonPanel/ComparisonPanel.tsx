import React from 'react';
import { useCostStore } from '../../store/costStore';
import styles from './ComparisonPanel.module.css';

export const ComparisonPanel: React.FC = () => {
  const { getComparison } = useCostStore();
  const c = getComparison();

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>方案对比</h3>
      <p className={styles.subtitle}>
        模拟值：假设连接期间以 1fps 持续发送图像
      </p>

      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>方案A：持续发送 (1fps)</div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>图像发送次数</span>
            <span className={styles.cardValue}>{c.planA.frameCount} 次</span>
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>估算图像 Token</span>
            <span className={styles.cardValue}>{c.planA.totalImageTokens.toLocaleString()}</span>
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>估算费用</span>
            <span className={styles.cardValue}>${c.planA.estimatedCostUSD.toFixed(5)}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>方案B：按需发送（本方案）</div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>图像发送次数</span>
            <span className={styles.cardValue}>{c.planB.frameCount} 次</span>
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>实际输入 Token</span>
            <span className={styles.cardValue}>{c.planB.totalInputTokens.toLocaleString()}</span>
          </div>
          <div className={styles.cardRow}>
            <span className={styles.cardLabel}>实际费用</span>
            <span className={styles.cardValue}>${c.planB.totalCostUSD.toFixed(5)}</span>
          </div>
        </div>
      </div>

      <div className={styles.saving}>
        本方案节省约 {c.savingPercent.toFixed(1)}% 的图像调用成本
      </div>
    </div>
  );
};
