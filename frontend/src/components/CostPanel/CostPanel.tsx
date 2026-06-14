import React from 'react';
import { useCostStore } from '../../store/costStore';
import styles from './CostPanel.module.css';

export const CostPanel: React.FC = () => {
  const stats = useCostStore();

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>成本统计</h3>
      <div className={styles.row}>
        <span className={styles.label}>对话轮数</span>
        <span className={styles.value}>{stats.turnCount}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>已发送图像</span>
        <span className={styles.value}>{stats.imagesSentCount} 次</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>节省发送</span>
        <span className={styles.value}>{stats.imagesSkippedCount} 次</span>
      </div>
      <hr className={styles.divider} />
      <div className={styles.row}>
        <span className={styles.label}>累计输入 Token</span>
        <span className={styles.value}>{stats.totalInputTokens.toLocaleString()}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>累计输出 Token</span>
        <span className={styles.value}>{stats.totalOutputTokens.toLocaleString()}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>累计预估费用</span>
        <span className={styles.valueHighlight}>${stats.totalCostUSD.toFixed(5)}</span>
      </div>
    </div>
  );
};
