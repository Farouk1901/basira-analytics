/**
 * Basira Analytics — T-Test Module
 * Independent Samples T-Test & Paired Samples T-Test (pure JS)
 */
'use strict';

const TTest = (() => {

  /**
   * Independent samples t-test (Welch's t-test — doesn't assume equal variances).
   * @param {number[]} group1
   * @param {number[]} group2
   * @returns {Object}
   */
  function independent(group1, group2) {
    const n1 = group1.length, n2 = group2.length;
    if (n1 < 2 || n2 < 2) return null;

    const m1 = _mean(group1), m2 = _mean(group2);
    const v1 = _variance(group1), v2 = _variance(group2);
    const se = Math.sqrt(v1 / n1 + v2 / n2);

    if (se === 0) return null;

    const t = (m1 - m2) / se;

    // Welch–Satterthwaite degrees of freedom
    const num = Math.pow(v1 / n1 + v2 / n2, 2);
    const den = Math.pow(v1 / n1, 2) / (n1 - 1) + Math.pow(v2 / n2, 2) / (n2 - 1);
    const df = num / den;

    const p = _tDistPValue(Math.abs(t), df) * 2; // two-tailed

    // Cohen's d
    const pooledSD = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
    const cohensD = pooledSD > 0 ? (m1 - m2) / pooledSD : 0;

    return {
      test: 'Independent Samples T-Test (Welch)',
      t: _round(t), df: _round(df), p: _round(p, 6),
      mean1: _round(m1), mean2: _round(m2),
      std1: _round(Math.sqrt(v1)), std2: _round(Math.sqrt(v2)),
      n1, n2, meanDiff: _round(m1 - m2),
      cohensD: _round(cohensD),
      significant: p < 0.05
    };
  }

  /**
   * Paired samples t-test.
   * @param {number[]} before
   * @param {number[]} after
   * @returns {Object}
   */
  function paired(before, after) {
    if (before.length !== after.length) return null;
    const n = before.length;
    if (n < 2) return null;

    const diffs = before.map((v, i) => v - after[i]);
    const meanD = _mean(diffs);
    const sdD = Math.sqrt(_variance(diffs));
    const seD = sdD / Math.sqrt(n);

    if (seD === 0) return null;

    const t = meanD / seD;
    const df = n - 1;
    const p = _tDistPValue(Math.abs(t), df) * 2;

    const cohensD = sdD > 0 ? meanD / sdD : 0;

    return {
      test: 'Paired Samples T-Test',
      t: _round(t), df, p: _round(p, 6),
      meanDiff: _round(meanD),
      sdDiff: _round(sdD),
      seDiff: _round(seD),
      n,
      meanBefore: _round(_mean(before)),
      meanAfter: _round(_mean(after)),
      cohensD: _round(cohensD),
      significant: p < 0.05
    };
  }

  // === Helper functions ===

  function _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function _variance(arr) {
    const m = _mean(arr);
    return arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1);
  }

  function _round(v, d = 4) {
    return Number.isFinite(v) ? parseFloat(v.toFixed(d)) : 0;
  }

  /**
   * One-tailed p-value from t-distribution using the regularized incomplete beta function.
   * Approximation using the Abramowitz & Stegun method.
   */
  function _tDistPValue(t, df) {
    const x = df / (df + t * t);
    return _regIncBeta(df / 2, 0.5, x) / 2;
  }

  /**
   * Regularized incomplete beta function I_x(a, b).
   * Uses a continued fraction approximation (Lentz's method).
   */
  function _regIncBeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    // Use symmetry relation if needed
    if (x > (a + 1) / (a + b + 2)) {
      return 1 - _regIncBeta(b, a, 1 - x);
    }

    const lnBeta = _lnGamma(a) + _lnGamma(b) - _lnGamma(a + b);
    const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

    // Lentz's continued fraction
    let f = 1, c = 1, d = 1 - (a + b) * x / (a + 1);
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    f = d;

    for (let m = 1; m <= 200; m++) {
      // Even step
      let num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      f *= d * c;

      // Odd step
      num = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d;
      c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      f *= d * c;

      if (Math.abs(d * c - 1) < 1e-10) break;
    }

    return front * f;
  }

  /**
   * Log-gamma function (Stirling's approximation with Lanczos coefficients).
   */
  function _lnGamma(z) {
    if (z <= 0) return 0;
    const c = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.001208650973866179, -0.000005395239384953
    ];
    let x = z, y = z, tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += c[j] / ++y;
    return -tmp + Math.log(2.5066282746310005 * ser / x);
  }

  return { independent, paired, _tDistPValue, _regIncBeta, _lnGamma };
})();
