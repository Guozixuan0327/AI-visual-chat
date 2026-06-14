import React from 'react';
import { useExperimentStore } from '../../store/experimentStore';
import styles from '../CostPanel/CostPanel.module.css';

export const ExportPanel: React.FC = () => {
  const { entries, exportJSON, exportCSV } = useExperimentStore();

  if (entries.length === 0) return null;

  const blobAndDownload = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>实验数据导出</h3>
      <div className={styles.recordCount}>
        实验记录: {entries.length} 条
      </div>
      <div className={styles.exportRow}>
        <button
          onClick={() => blobAndDownload(exportJSON(), 'experiment_data.json', 'application/json')}
          className={styles.exportBtn}
        >
          导出 JSON
        </button>
        <button
          onClick={() => blobAndDownload(exportCSV(), 'experiment_data.csv', 'text/csv')}
          className={styles.exportBtn}
        >
          导出 CSV
        </button>
      </div>
    </div>
  );
};
