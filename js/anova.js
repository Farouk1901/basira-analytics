/**
 * Basira Analytics — ANOVA Module
 * One-Way ANOVA with F-test (pure JS)
 */
'use strict';

const ANOVA = (() => {

  /**
   * One-way ANOVA.
   * @param {number[][]} groups - Array of arrays, each containing group data
   * @param {string[]} [groupNames] - Optional group labels
   * @returns {Object}
   */
  function oneWay(groups, groupNames) {
    if (!groups || groups.length < 2) return null;
    groups = groups.filter(g => g.length > 0);
    if (groups.length < 2) return null;

    const k = groups.length; // number of groups
    const allValues = groups.flat();
    const N = allValues.length; // total observations

    if (N < k + 1) return null;

    const grandMean = allValues.reduce((a, b) => a + b, 0) / N;

    // Group stats
    const groupStats = groups.map((g, i) => {
      const n = g.length;
      const mean = g.reduce((a, b) => a + b, 0) / n;
      const variance = n > 1
        ? g.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1)
        : 0;
      return {
        name: groupNames ? groupNames[i] : `Group ${i + 1}`,
        n, mean: _round(mean), stdDev: _round(Math.sqrt(variance)), variance: _round(variance)
      };
    });

    // Between-groups sum of squares (SSB)
    const SSB = groups.reduce((s, g) => {
      const gMean = g.reduce((a, b) => a + b, 0) / g.length;
      return s + g.length * Math.pow(gMean - grandMean, 2);
    }, 0);

    // Within-groups sum of squares (SSW)
    const SSW = groups.reduce((s, g) => {
      const gMean = g.reduce((a, b) => a + b, 0) / g.length;
      return s + g.reduce((ss, v) => ss + Math.pow(v - gMean, 2), 0);
    }, 0);

    const SST = SSB + SSW;

    const dfBetween = k - 1;
    const dfWithin = N - k;
    const dfTotal = N - 1;

    const MSB = SSB / dfBetween;
    const MSW = dfWithin > 0 ? SSW / dfWithin : 0;

    const F = MSW > 0 ? MSB / MSW : 0;

    // p-value from F-distribution
    const p = 1 - _fCDF(F, dfBetween, dfWithin);

    // Effect size: eta-squared
    const etaSquared = SST > 0 ? SSB / SST : 0;

    return {
      test: 'One-Way ANOVA',
      F: _round(F), p: _round(p, 6),
      dfBetween, dfWithin, dfTotal,
      SSB: _round(SSB), SSW: _round(SSW), SST: _round(SST),
      MSB: _round(MSB), MSW: _round(MSW),
      etaSquared: _round(etaSquared),
      grandMean: _round(grandMean),
      groupStats,
      significant: p < 0.05
    };
  }

  /**
   * F-distribution CDF using the regularized incomplete beta function.
   */
  function _fCDF(f, d1, d2) {
    if (f <= 0) return 0;
    const x = d1 * f / (d1 * f + d2);
    return 1 - TTest._regIncBeta(d2 / 2, d1 / 2, 1 - x);
  }

  function _round(v, d = 4) {
    return Number.isFinite(v) ? parseFloat(v.toFixed(d)) : 0;
  }

  return { oneWay };
})();
