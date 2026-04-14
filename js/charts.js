/**
 * STTS — Charts Module
 * Chart.js integration for data visualization.
 */
'use strict';

const Charts = (() => {
  let _barChart = null;
  let _radarChart = null;

  /**
   * Check if Chart.js is loaded.
   * @returns {boolean}
   */
  function isAvailable() {
    return typeof Chart !== 'undefined';
  }

  /**
   * Create/update the response distribution bar chart.
   * @param {string} canvasId - Canvas element ID
   * @param {Array} questionsData - Array of question data
   * @param {string[]} scaleLabels - Labels for each category
   * @param {Function} t - i18n translation function
   */
  function renderBarChart(canvasId, questionsData, scaleLabels, t) {
    if (!isAvailable()) return;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (_barChart) {
      _barChart.destroy();
      _barChart = null;
    }

    if (!questionsData || questionsData.length === 0) return;

    const colors = [
      'rgba(99, 102, 241, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(6, 182, 212, 0.8)'
    ];

    const borderColors = colors.map(c => c.replace('0.8', '1'));

    const datasets = questionsData.map((q, idx) => ({
      label: `${t('chart.question')} ${Utils.escapeHTML(String(q.questionNum))}`,
      data: q.counts,
      backgroundColor: colors[idx % colors.length],
      borderColor: borderColors[idx % borderColors.length],
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    }));

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    _barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scaleLabels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: t('chart.responseDistribution'),
            color: textColor,
            font: { size: 16, weight: '700' },
            padding: { bottom: 20 }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 12,
              font: { size: 12, weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            titleColor: isDark ? '#f1f5f9' : '#1e293b',
            bodyColor: isDark ? '#cbd5e1' : '#475569',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { weight: '500' } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor, stepSize: 1, font: { weight: '500' } }
          }
        }
      }
    });
  }

  /**
   * Create/update the question comparison radar chart.
   * @param {string} canvasId
   * @param {Array} questionsData
   * @param {Function} t
   */
  function renderRadarChart(canvasId, questionsData, t) {
    if (!isAvailable()) return;

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (_radarChart) {
      _radarChart.destroy();
      _radarChart = null;
    }

    if (!questionsData || questionsData.length < 2) return;

    const labels = questionsData.map(q =>
      `${t('chart.question')} ${Utils.escapeHTML(String(q.questionNum))}`
    );

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const textColor = isDark ? '#cbd5e1' : '#475569';

    const datasets = [
      {
        label: t('results.headers.mean'),
        data: questionsData.map(q => q.stats.mean),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointRadius: 4,
      },
      {
        label: t('results.headers.std'),
        data: questionsData.map(q => q.stats.std),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointRadius: 4,
      }
    ];

    _radarChart = new Chart(ctx, {
      type: 'radar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        plugins: {
          title: {
            display: true,
            text: t('chart.questionComparison'),
            color: textColor,
            font: { size: 16, weight: '700' },
            padding: { bottom: 20 }
          },
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              padding: 16,
              usePointStyle: true,
              font: { size: 12, weight: '500' }
            }
          }
        },
        scales: {
          r: {
            angleLines: { color: gridColor },
            grid: { color: gridColor },
            pointLabels: { color: textColor, font: { size: 11, weight: '500' } },
            ticks: { color: textColor, backdropColor: 'transparent' },
            beginAtZero: true
          }
        }
      }
    });
  }

  /**
   * Destroy all charts.
   */
  function destroyAll() {
    if (_barChart) { _barChart.destroy(); _barChart = null; }
    if (_radarChart) { _radarChart.destroy(); _radarChart = null; }
  }

  return {
    isAvailable,
    renderBarChart,
    renderRadarChart,
    destroyAll
  };
})();
