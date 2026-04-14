/**
 * STTS — Statistics Computation Module
 * Pure functions for Likert scale statistical analysis.
 */
'use strict';

const Statistics = (() => {
  /**
   * Calculate all statistical indicators for a set of frequency counts and weights.
   * @param {number[]} counts - Array of frequency counts per category
   * @param {number[]} weights - Array of weights per category
   * @param {boolean} useSampleVariance - If true, divide by (N-1); if false, divide by N
   * @returns {{ mean: number, std: number, variance: number, cv: number, median: number }}
   */
  function calculate(counts, weights, useSampleVariance = true) {
    if (!counts || !weights || counts.length !== weights.length) {
      return { mean: 0, std: 0, variance: 0, cv: 0, median: 0 };
    }

    const total = counts.reduce((sum, c) => sum + c, 0);

    if (total === 0) {
      return { mean: 0, std: 0, variance: 0, cv: 0, median: 0 };
    }

    // Weighted mean
    const weightedSum = counts.reduce((sum, c, i) => sum + c * weights[i], 0);
    const mean = weightedSum / total;

    // Variance
    let varianceSum = 0;
    for (let i = 0; i < counts.length; i++) {
      varianceSum += counts[i] * Math.pow(weights[i] - mean, 2);
    }

    // Use N-1 for sample variance, N for population variance
    const divisor = useSampleVariance && total > 1 ? (total - 1) : total;
    const variance = varianceSum / divisor;
    const std = Math.sqrt(variance);

    // Coefficient of Variation
    const cv = mean !== 0 ? (std / mean) * 100 : 0;

    // Median
    const median = _calculateMedian(counts, weights);

    return { mean, std, variance, cv, median };
  }

  /**
   * Calculate the median from frequency counts and weights.
   * @param {number[]} counts
   * @param {number[]} weights
   * @returns {number}
   */
  function _calculateMedian(counts, weights) {
    const valuesArray = [];
    for (let i = 0; i < counts.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        valuesArray.push(weights[i]);
      }
    }

    if (valuesArray.length === 0) return 0;

    valuesArray.sort((a, b) => a - b);

    const len = valuesArray.length;
    if (len % 2 === 0) {
      return (valuesArray[len / 2 - 1] + valuesArray[len / 2]) / 2;
    }
    return valuesArray[Math.floor(len / 2)];
  }

  /**
   * Calculate overall statistics by combining all questions' counts.
   * @param {Array} questionsData - Array of question data objects
   * @param {number[]} weights - Fixed weights
   * @param {boolean} useSampleVariance
   * @returns {Object|null}
   */
  function calculateOverall(questionsData, weights, useSampleVariance = true) {
    if (!questionsData || questionsData.length === 0 || !weights) {
      return null;
    }

    const combinedCounts = new Array(weights.length).fill(0);

    questionsData.forEach(q => {
      q.counts.forEach((count, i) => {
        if (i < combinedCounts.length) {
          combinedCounts[i] += count;
        }
      });
    });

    return calculate(combinedCounts, weights, useSampleVariance);
  }

  /**
   * Get combined counts from all questions.
   * @param {Array} questionsData
   * @param {number} numCategories
   * @returns {number[]}
   */
  function getCombinedCounts(questionsData, numCategories) {
    const combined = new Array(numCategories).fill(0);
    questionsData.forEach(q => {
      q.counts.forEach((count, i) => {
        if (i < combined.length) {
          combined[i] += count;
        }
      });
    });
    return combined;
  }

  /**
   * Determine agreement level based on normalized mean.
   * @param {number} normalizedMean - Mean as percentage (0-100)
   * @param {Function} t - Translation function
   * @returns {{ level: string, desc: string }}
   */
  function getAgreementLevel(normalizedMean, t) {
    if (normalizedMean >= 80) {
      return { level: t('analysis.agreementVeryHigh'), desc: t('analysis.agreementVeryHighDesc') };
    } else if (normalizedMean >= 70) {
      return { level: t('analysis.agreementHigh'), desc: t('analysis.agreementHighDesc') };
    } else if (normalizedMean >= 60) {
      return { level: t('analysis.agreementMedium'), desc: t('analysis.agreementMediumDesc') };
    } else if (normalizedMean >= 50) {
      return { level: t('analysis.agreementLow'), desc: t('analysis.agreementLowDesc') };
    } else {
      return { level: t('analysis.agreementDisagree'), desc: t('analysis.agreementDisagreeDesc') };
    }
  }

  /**
   * Determine homogeneity level based on standard deviation.
   * @param {number} std
   * @param {Function} t
   * @returns {{ level: string, desc: string }}
   */
  function getHomogeneityLevel(std, t) {
    if (std < 0.5) {
      return { level: t('analysis.homogeneityVeryHigh'), desc: t('analysis.homogeneityVeryHighDesc') };
    } else if (std < 1.0) {
      return { level: t('analysis.homogeneityGood'), desc: t('analysis.homogeneityGoodDesc') };
    } else if (std < 1.5) {
      return { level: t('analysis.homogeneityMedium'), desc: t('analysis.homogeneityMediumDesc') };
    } else {
      return { level: t('analysis.homogeneityLow'), desc: t('analysis.homogeneityLowDesc') };
    }
  }

  /**
   * Determine consistency level based on coefficient of variation.
   * @param {number} cv
   * @param {Function} t
   * @returns {{ level: string, desc: string }}
   */
  function getConsistencyLevel(cv, t) {
    if (cv < 15) {
      return { level: t('analysis.consistencyExcellent'), desc: t('analysis.consistencyExcellentDesc') };
    } else if (cv < 25) {
      return { level: t('analysis.consistencyGood'), desc: t('analysis.consistencyGoodDesc') };
    } else if (cv < 35) {
      return { level: t('analysis.consistencyAcceptable'), desc: t('analysis.consistencyAcceptableDesc') };
    } else {
      return { level: t('analysis.consistencyLow'), desc: t('analysis.consistencyLowDesc') };
    }
  }

  /**
   * Determine range description based on difference between max and min means.
   * @param {number} range
   * @param {Function} t
   * @returns {string}
   */
  function getRangeDescription(range, t) {
    if (range < 1) return t('analysis.rangeClose');
    if (range < 2) return t('analysis.rangeModerate');
    return t('analysis.rangeWide');
  }

  /**
   * Default weights for each scale type.
   */
  const DEFAULT_WEIGHTS = {
    2: [2, 1],
    3: [3, 2, 1],
    5: [5, 4, 3, 2, 1]
  };

  return {
    calculate,
    calculateOverall,
    getCombinedCounts,
    getAgreementLevel,
    getHomogeneityLevel,
    getConsistencyLevel,
    getRangeDescription,
    DEFAULT_WEIGHTS
  };
})();
