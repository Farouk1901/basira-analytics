/**
 * Basira Analytics — Descriptive Statistics Module
 * Mean, Median, Mode, Std Dev, Variance, Range, Skewness, Kurtosis
 */
'use strict';

const Descriptive = (() => {

  function analyze(data) {
    const nums = data.filter(v => Number.isFinite(v));
    if (nums.length === 0) return null;

    const n = nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Median
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Mode
    const freq = {};
    nums.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(k => freq[k] === maxFreq).map(Number);
    const mode = maxFreq === 1 ? null : (modes.length === n ? null : modes);

    // Variance & Std Dev (sample: N-1)
    const ssq = nums.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
    const variance = n > 1 ? ssq / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);

    // Range
    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    // Skewness (Fisher's)
    let skewness = 0;
    if (n >= 3 && stdDev > 0) {
      const m3 = nums.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0);
      skewness = (n / ((n - 1) * (n - 2))) * m3;
    }

    // Kurtosis (excess kurtosis, Fisher's)
    let kurtosis = 0;
    if (n >= 4 && stdDev > 0) {
      const m4 = nums.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 4), 0);
      const k = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * m4;
      kurtosis = k - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
    }

    // Standard Error
    const se = stdDev / Math.sqrt(n);

    // Quartiles
    const q1 = _percentile(sorted, 25);
    const q3 = _percentile(sorted, 75);
    const iqr = q3 - q1;

    return {
      n, mean, median, mode, stdDev, variance, min, max, range,
      skewness, kurtosis, se, q1, q3, iqr, sum
    };
  }

  function _percentile(sorted, p) {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }

  /**
   * Frequency table for categorical data.
   */
  function frequencyTable(data) {
    const freq = {};
    data.forEach(v => {
      const key = String(v).trim();
      if (key) freq[key] = (freq[key] || 0) + 1;
    });
    const total = Object.values(freq).reduce((a, b) => a + b, 0);
    const table = Object.entries(freq).map(([value, count]) => ({
      value, count, percent: ((count / total) * 100).toFixed(1)
    }));
    table.sort((a, b) => b.count - a.count);
    return { table, total };
  }

  return { analyze, frequencyTable };
})();
