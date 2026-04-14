/**
 * Basira Analytics — Chi-Square Module
 * Chi-Square Test of Independence (pure JS)
 */
'use strict';

const ChiSquare = (() => {

  /**
   * Chi-square test of independence from a contingency table.
   * @param {number[][]} observed - 2D array [rows][cols] of observed counts
   * @param {string[]} [rowLabels]
   * @param {string[]} [colLabels]
   * @returns {Object}
   */
  function independence(observed, rowLabels, colLabels) {
    if (!observed || observed.length < 2) return null;
    const nRows = observed.length;
    const nCols = observed[0].length;
    if (nCols < 2) return null;

    // Validate all rows have same column count
    for (const row of observed) {
      if (row.length !== nCols) return null;
    }

    // Row totals, column totals, grand total
    const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0));
    const colTotals = new Array(nCols).fill(0);
    for (let c = 0; c < nCols; c++) {
      for (let r = 0; r < nRows; r++) {
        colTotals[c] += observed[r][c];
      }
    }
    const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

    if (grandTotal === 0) return null;

    // Expected frequencies
    const expected = [];
    for (let r = 0; r < nRows; r++) {
      expected[r] = [];
      for (let c = 0; c < nCols; c++) {
        expected[r][c] = (rowTotals[r] * colTotals[c]) / grandTotal;
      }
    }

    // Chi-square statistic
    let chiSq = 0;
    for (let r = 0; r < nRows; r++) {
      for (let c = 0; c < nCols; c++) {
        const e = expected[r][c];
        if (e > 0) {
          chiSq += Math.pow(observed[r][c] - e, 2) / e;
        }
      }
    }

    const df = (nRows - 1) * (nCols - 1);

    // p-value from chi-square distribution
    const p = 1 - _chiSqCDF(chiSq, df);

    // Cramér's V (effect size)
    const minDim = Math.min(nRows, nCols) - 1;
    const cramersV = minDim > 0 && grandTotal > 0
      ? Math.sqrt(chiSq / (grandTotal * minDim))
      : 0;

    return {
      test: 'Chi-Square Test of Independence',
      chiSquare: _round(chiSq),
      df,
      p: _round(p, 6),
      cramersV: _round(cramersV),
      grandTotal,
      observed,
      expected: expected.map(row => row.map(v => _round(v, 2))),
      rowTotals,
      colTotals,
      rowLabels: rowLabels || Array.from({ length: nRows }, (_, i) => `Row ${i + 1}`),
      colLabels: colLabels || Array.from({ length: nCols }, (_, i) => `Col ${i + 1}`),
      significant: p < 0.05,
      strengthLabel: _interpretCramer(cramersV, minDim)
    };
  }

  /**
   * Chi-square CDF using the regularized lower incomplete gamma function.
   */
  function _chiSqCDF(x, k) {
    if (x <= 0 || k <= 0) return 0;
    return _gammainc(k / 2, x / 2);
  }

  /**
   * Regularized lower incomplete gamma P(a, x).
   * Uses series expansion for small x, continued fraction for large x.
   */
  function _gammainc(a, x) {
    if (x < 0) return 0;
    if (x === 0) return 0;
    if (!Number.isFinite(x)) return 1;

    const lnGammaA = TTest._lnGamma(a);

    // Use continued fraction for x >= a + 1
    if (x >= a + 1) {
      return 1 - _upperGammaCF(a, x, lnGammaA);
    }

    // Series expansion for x < a + 1
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-14 * Math.abs(sum)) break;
    }

    const logP = -x + a * Math.log(x) - lnGammaA + Math.log(sum);
    const result = Math.exp(logP);
    return Math.min(Math.max(result, 0), 1);
  }

  /**
   * Upper regularized gamma Q(a,x) via continued fraction.
   */
  function _upperGammaCF(a, x, lnGammaA) {
    const TINY = 1e-30;
    let b = x + 1 - a;
    let c = 1 / TINY;
    let d = 1 / b;
    let h = d;

    for (let i = 1; i <= 200; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < TINY) d = TINY;
      c = b + an / c;
      if (Math.abs(c) < TINY) c = TINY;
      d = 1 / d;
      const delta = d * c;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) break;
    }

    const logQ = -x + a * Math.log(x) - lnGammaA + Math.log(h);
    const result = Math.exp(logQ);
    return Math.min(Math.max(result, 0), 1);
  }

  function _round(v, d = 4) {
    return Number.isFinite(v) ? parseFloat(v.toFixed(d)) : 0;
  }

  function _interpretCramer(v, minDim) {
    // Cohen's guidelines adjusted for df
    if (v >= 0.5) return 'large';
    if (v >= 0.3) return 'medium';
    if (v >= 0.1) return 'small';
    return 'negligible';
  }

  return { independence };
})();

