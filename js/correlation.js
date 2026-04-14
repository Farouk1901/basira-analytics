/**
 * Basira Analytics — Correlation Module
 * Pearson & Spearman correlation (pure JS)
 */
'use strict';

const Correlation = (() => {

  /**
   * Pearson correlation coefficient.
   * @param {number[]} x
   * @param {number[]} y
   * @returns {Object}
   */
  function pearson(x, y) {
    if (x.length !== y.length || x.length < 3) return null;
    const n = x.length;

    const mx = _mean(x), my = _mean(y);
    let ssxy = 0, ssx = 0, ssy = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      ssxy += dx * dy;
      ssx += dx * dx;
      ssy += dy * dy;
    }

    if (ssx === 0 || ssy === 0) return null;

    const r = ssxy / Math.sqrt(ssx * ssy);
    const df = n - 2;

    // t-statistic for significance testing
    const t = r * Math.sqrt(df / (1 - r * r));
    const p = TTest._tDistPValue(Math.abs(t), df) * 2;

    // R-squared
    const rSquared = r * r;

    return {
      test: 'Pearson Correlation',
      r: _round(r), rSquared: _round(rSquared),
      t: _round(t), df, p: _round(p, 6),
      n,
      strength: _interpretStrength(Math.abs(r)),
      direction: r > 0 ? 'positive' : r < 0 ? 'negative' : 'none',
      significant: p < 0.05
    };
  }

  /**
   * Spearman rank correlation coefficient.
   * @param {number[]} x
   * @param {number[]} y
   * @returns {Object}
   */
  function spearman(x, y) {
    if (x.length !== y.length || x.length < 3) return null;

    const rankX = _rank(x);
    const rankY = _rank(y);

    // Use Pearson on ranks
    const result = pearson(rankX, rankY);
    if (!result) return null;

    result.test = 'Spearman Rank Correlation';
    result.rho = result.r;
    return result;
  }

  /**
   * Assign ranks (average ranks for ties).
   */
  function _rank(arr) {
    const indexed = arr.map((v, i) => ({ v, i }));
    indexed.sort((a, b) => a.v - b.v);

    const ranks = new Array(arr.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
      const avgRank = (i + j + 1) / 2; // 1-based average rank
      for (let k = i; k < j; k++) {
        ranks[indexed[k].i] = avgRank;
      }
      i = j;
    }
    return ranks;
  }

  function _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function _round(v, d = 4) {
    return Number.isFinite(v) ? parseFloat(v.toFixed(d)) : 0;
  }

  function _interpretStrength(absR) {
    if (absR >= 0.9) return 'very strong';
    if (absR >= 0.7) return 'strong';
    if (absR >= 0.5) return 'moderate';
    if (absR >= 0.3) return 'weak';
    return 'very weak';
  }

  return { pearson, spearman };
})();
