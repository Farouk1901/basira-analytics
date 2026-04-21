/**
 * Basira Analytics — Question Analysis
 * Per-question frequency tables, descriptive stats, and visualizations.
 * Analyzes each variable individually from the Data View data.
 */
'use strict';

const QuestionAnalysis = (() => {
  const M = SPSSDataModel;
  let _container = null;

  const _lang = () => (typeof I18n !== 'undefined' ? I18n.getLang() : 'ar');

  const _t = {
    ar: {
      title: '📊 تحليل الأسئلة',
      subtitle: 'تحليل التكرارات والنسب المئوية والإحصائيات الوصفية لكل سؤال',
      analyze: '📊 تحليل جميع الأسئلة',
      analyzeSingle: '📊 تحليل',
      selectVar: 'اختر المتغير:',
      all: 'جميع المتغيرات',
      noData: '⚠️ لا توجد بيانات. أدخل البيانات في "عرض البيانات" أولاً.',
      noVars: '⚠️ لم يتم تعريف متغيرات.',
      freqTable: 'جدول التكرارات',
      descriptive: 'الإحصائيات الوصفية',
      value: 'القيمة',
      label: 'التسمية',
      frequency: 'التكرار',
      percent: 'النسبة %',
      validPercent: 'النسبة الصالحة %',
      cumPercent: 'النسبة التراكمية %',
      valid: 'صالح',
      missing: 'مفقود',
      total: 'الإجمالي',
      mean: 'المتوسط الحسابي',
      median: 'الوسيط',
      mode: 'المنوال',
      stdDev: 'الانحراف المعياري',
      variance: 'التباين',
      min: 'أصغر قيمة',
      max: 'أكبر قيمة',
      range: 'المدى',
      skewness: 'الالتواء',
      kurtosis: 'التفلطح',
      n: 'عدد الحالات الصالحة',
      exportWord: '📄 تصدير إلى Word',
      interpretation: '📝 التفسير',
      levelVeryHigh: 'موافقة عالية جداً',
      levelHigh: 'موافقة عالية',
      levelMedium: 'موافقة متوسطة',
      levelLow: 'موافقة منخفضة',
      levelVeryLow: 'موافقة منخفضة جداً'
    },
    en: {
      title: '📊 Question Analysis',
      subtitle: 'Analyze frequencies, percentages, and descriptive statistics per question',
      analyze: '📊 Analyze All Questions',
      analyzeSingle: '📊 Analyze',
      selectVar: 'Select Variable:',
      all: 'All Variables',
      noData: '⚠️ No data found. Enter data in "Data View" first.',
      noVars: '⚠️ No variables defined.',
      freqTable: 'Frequency Table',
      descriptive: 'Descriptive Statistics',
      value: 'Value',
      label: 'Label',
      frequency: 'Frequency',
      percent: 'Percent',
      validPercent: 'Valid %',
      cumPercent: 'Cumulative %',
      valid: 'Valid',
      missing: 'Missing',
      total: 'Total',
      mean: 'Mean',
      median: 'Median',
      mode: 'Mode',
      stdDev: 'Std. Deviation',
      variance: 'Variance',
      min: 'Minimum',
      max: 'Maximum',
      range: 'Range',
      skewness: 'Skewness',
      kurtosis: 'Kurtosis',
      n: 'Valid Cases',
      exportWord: '📄 Export to Word',
      interpretation: '📝 Interpretation',
      levelVeryHigh: 'Very High Agreement',
      levelHigh: 'High Agreement',
      levelMedium: 'Moderate Agreement',
      levelLow: 'Low Agreement',
      levelVeryLow: 'Very Low Agreement'
    }
  };

  function t(key) { return (_t[_lang()] && _t[_lang()][key]) || (_t.en[key]) || key; }
  function fmt(v, d = 3) { return Number.isFinite(v) ? v.toFixed(d) : '—'; }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  function render(containerId) {
    _container = document.getElementById(containerId);
    if (!_container) return;

    const vars = M.getVariables();

    let html = `<div class="qa-toolbar">
      <select id="qaVarSelect" class="vv-select">
        <option value="all">${t('all')}</option>
        ${vars.map((v, i) => `<option value="${i}">${v.name}${v.label ? ' — ' + Utils.escapeHTML(v.label.substring(0, 40)) : ''}</option>`).join('')}
      </select>
      <button class="btn btn-primary" onclick="QuestionAnalysis.analyze()"><span>${t('analyze')}</span></button>
      <button class="btn btn-accent" onclick="QuestionAnalysis.exportAllToWord()"><span>${t('exportWord')}</span></button>
    </div>
    <div id="qaResults"></div>`;

    _container.innerHTML = html;
  }

  // ──────────────────────────────────────────────
  // Analysis
  // ──────────────────────────────────────────────
  function analyze() {
    const vars = M.getVariables();
    const results = document.getElementById('qaResults');
    if (!results) return;

    if (vars.length === 0) {
      results.innerHTML = `<div class="alert alert-error" style="display:block">${t('noVars')}</div>`;
      return;
    }

    const select = document.getElementById('qaVarSelect');
    const selection = select.value;

    let indices = [];
    if (selection === 'all') {
      indices = vars.map((_, i) => i);
    } else {
      indices = [parseInt(selection)];
    }

    // Check if there's any data
    const hasData = indices.some(i => M.getValidColumn(i).length > 0);
    if (!hasData) {
      results.innerHTML = `<div class="alert alert-error" style="display:block">${t('noData')}</div>`;
      return;
    }

    let html = '';
    indices.forEach(idx => {
      const freqTable = M.getFrequencyTable(idx);
      const stats = M.getDescriptiveStats(idx);
      if (!freqTable || freqTable.validCount === 0) return;

      const v = M.getVariable(idx);

      html += `<div class="qa-question-block">
        <h3 class="qa-question-title">${v.name}: ${Utils.escapeHTML(v.label || '—')}</h3>`;

      // Frequency Table
      html += `<div class="qa-section-title">${t('freqTable')}</div>
        <div class="table-container"><table class="qa-table">
          <thead><tr>
            <th></th><th>${t('value')}</th><th>${t('label')}</th>
            <th>${t('frequency')}</th><th>${t('percent')}</th>
            <th>${t('validPercent')}</th><th>${t('cumPercent')}</th>
          </tr></thead><tbody>`;

      freqTable.rows.forEach((r, ri) => {
        html += `<tr>
          <td class="qa-row-label">${ri === 0 ? t('valid') : ''}</td>
          <td>${r.value}</td>
          <td>${Utils.escapeHTML(r.valueLabel)}</td>
          <td><strong>${r.frequency}</strong></td>
          <td>${fmt(r.percent, 1)}</td>
          <td>${fmt(r.validPercent, 1)}</td>
          <td>${fmt(r.cumulativePercent, 1)}</td>
        </tr>`;
      });

      // Missing row
      if (freqTable.missingCount > 0) {
        html += `<tr class="qa-missing-row">
          <td class="qa-row-label">${t('missing')}</td>
          <td colspan="2">—</td>
          <td><strong>${freqTable.missingCount}</strong></td>
          <td>${fmt((freqTable.missingCount / freqTable.total) * 100, 1)}</td>
          <td>—</td><td>—</td>
        </tr>`;
      }

      // Total row
      html += `<tr class="summary-row">
          <td class="qa-row-label">${t('total')}</td>
          <td colspan="2"></td>
          <td><strong>${freqTable.total}</strong></td>
          <td><strong>100.0</strong></td>
          <td><strong>100.0</strong></td><td></td>
        </tr>`;

      html += `</tbody></table></div>`;

      // Descriptive Statistics
      if (stats) {
        html += `<div class="qa-section-title">${t('descriptive')}</div>
          <div class="qa-stats-grid">
            <div class="qa-stat"><span class="qa-stat-label">${t('n')}</span><span class="qa-stat-value">${stats.n}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('mean')}</span><span class="qa-stat-value">${fmt(stats.mean)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('median')}</span><span class="qa-stat-value">${fmt(stats.median)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('mode')}</span><span class="qa-stat-value">${stats.mode ? stats.mode.join(', ') : '—'}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('stdDev')}</span><span class="qa-stat-value">${fmt(stats.stdDev)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('variance')}</span><span class="qa-stat-value">${fmt(stats.variance)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('min')}</span><span class="qa-stat-value">${fmt(stats.min, 0)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('max')}</span><span class="qa-stat-value">${fmt(stats.max, 0)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('range')}</span><span class="qa-stat-value">${fmt(stats.range, 0)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('skewness')}</span><span class="qa-stat-value">${fmt(stats.skewness)}</span></div>
            <div class="qa-stat"><span class="qa-stat-label">${t('kurtosis')}</span><span class="qa-stat-value">${fmt(stats.kurtosis)}</span></div>
          </div>`;

        // Interpretation
        const interp = _interpretMean(stats.mean, v);
        if (interp) {
          html += `<div class="qa-interpretation">
            <div class="qa-section-title">${t('interpretation')}</div>
            <p>${interp}</p>
          </div>`;
        }
      }

      // Simple bar chart using CSS
      html += `<div class="qa-bar-chart">`;
      freqTable.rows.forEach(r => {
        html += `<div class="qa-bar-row">
          <span class="qa-bar-label">${Utils.escapeHTML(r.valueLabel)}</span>
          <div class="qa-bar-track">
            <div class="qa-bar-fill" style="width:${r.validPercent}%"></div>
          </div>
          <span class="qa-bar-value">${r.frequency} (${fmt(r.validPercent, 1)}%)</span>
        </div>`;
      });
      html += `</div>`;

      html += `</div>`; // .qa-question-block
    });

    results.innerHTML = html || `<div class="dv-empty">${t('noData')}</div>`;
  }

  // ──────────────────────────────────────────────
  // Interpretation
  // ──────────────────────────────────────────────
  function _interpretMean(mean, variable) {
    const valKeys = Object.keys(variable.values).map(Number).filter(Number.isFinite);
    if (valKeys.length === 0 || !Number.isFinite(mean)) return null;

    const maxVal = Math.max(...valKeys);
    const isAr = _lang() === 'ar';

    if (maxVal === 5) {
      // 5-point Likert interpretation
      if (mean >= 4.2) return isAr
        ? `المتوسط الحسابي (${fmt(mean)}) يشير إلى ${t('levelVeryHigh')} من قبل أفراد العينة على هذا البند. هذا يعكس اتجاهاً إيجابياً قوياً.`
        : `The mean (${fmt(mean)}) indicates ${t('levelVeryHigh')} among respondents on this item, reflecting a strong positive trend.`;
      if (mean >= 3.4) return isAr
        ? `المتوسط الحسابي (${fmt(mean)}) يشير إلى ${t('levelHigh')} من قبل أفراد العينة. هذا مؤشر إيجابي.`
        : `The mean (${fmt(mean)}) indicates ${t('levelHigh')} among respondents. This is a positive indicator.`;
      if (mean >= 2.6) return isAr
        ? `المتوسط الحسابي (${fmt(mean)}) يشير إلى ${t('levelMedium')}. العينة منقسمة في آرائها حول هذا البند.`
        : `The mean (${fmt(mean)}) indicates ${t('levelMedium')}. Respondents are divided on this item.`;
      if (mean >= 1.8) return isAr
        ? `المتوسط الحسابي (${fmt(mean)}) يشير إلى ${t('levelLow')}. غالبية العينة تميل نحو عدم الموافقة.`
        : `The mean (${fmt(mean)}) indicates ${t('levelLow')}. The majority tends toward disagreement.`;
      return isAr
        ? `المتوسط الحسابي (${fmt(mean)}) يشير إلى ${t('levelVeryLow')}. هناك رفض واضح لهذا البند.`
        : `The mean (${fmt(mean)}) indicates ${t('levelVeryLow')}. There is clear rejection of this item.`;
    }

    // Generic interpretation
    const ratio = mean / maxVal;
    if (ratio >= 0.8) return isAr ? `مستوى مرتفع (${fmt(mean)} من ${maxVal})` : `High level (${fmt(mean)} out of ${maxVal})`;
    if (ratio >= 0.6) return isAr ? `مستوى متوسط-مرتفع (${fmt(mean)} من ${maxVal})` : `Medium-high level (${fmt(mean)} out of ${maxVal})`;
    if (ratio >= 0.4) return isAr ? `مستوى متوسط (${fmt(mean)} من ${maxVal})` : `Medium level (${fmt(mean)} out of ${maxVal})`;
    return isAr ? `مستوى منخفض (${fmt(mean)} من ${maxVal})` : `Low level (${fmt(mean)} out of ${maxVal})`;
  }

  // ──────────────────────────────────────────────
  // Export to Word
  // ──────────────────────────────────────────────
  function exportAllToWord() {
    const vars = M.getVariables();
    if (vars.length === 0) return;

    const isRTL = _lang() === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const date = new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let tablesHtml = '';
    vars.forEach((v, idx) => {
      const freq = M.getFrequencyTable(idx);
      const stats = M.getDescriptiveStats(idx);
      if (!freq || freq.validCount === 0) return;

      tablesHtml += `<h3>${v.name}: ${v.label || '—'}</h3>`;
      tablesHtml += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse:collapse;width:100%">
        <tr style="background:#1e3a8a;color:white"><th>${t('value')}</th><th>${t('label')}</th><th>${t('frequency')}</th><th>${t('percent')}</th><th>${t('validPercent')}</th><th>${t('cumPercent')}</th></tr>`;
      freq.rows.forEach(r => {
        tablesHtml += `<tr><td>${r.value}</td><td>${r.valueLabel}</td><td>${r.frequency}</td><td>${fmt(r.percent, 1)}</td><td>${fmt(r.validPercent, 1)}</td><td>${fmt(r.cumulativePercent, 1)}</td></tr>`;
      });
      tablesHtml += `</table>`;

      if (stats) {
        tablesHtml += `<p><strong>${t('mean')}:</strong> ${fmt(stats.mean)} | <strong>${t('stdDev')}:</strong> ${fmt(stats.stdDev)} | <strong>${t('median')}:</strong> ${fmt(stats.median)}</p>`;
        const interp = _interpretMean(stats.mean, v);
        if (interp) tablesHtml += `<p style="background:#eff6ff;padding:8px;border:1px solid #93c5fd">${interp}</p>`;
      }
      tablesHtml += '<br/>';
    });

    const htmlDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>body{font-family:'Simplified Arabic',Arial;direction:${dir};padding:20px}table{margin:10px 0}th,td{text-align:center;font-size:10pt}h2{color:#1e3a8a;text-align:center}h3{color:#1e40af;margin-top:20px}</style>
</head><body>
<h2>Basira Analytics — بصيرة</h2>
<p style="text-align:center;color:#6b7280">${t('title')} — ${date}</p>
${tablesHtml}
<p style="text-align:center;color:#9ca3af;margin-top:30px;border-top:2px solid #e5e7eb;padding-top:10px">© ${new Date().getFullYear()} Engineer Ahmed Gohary — Basira Analytics</p>
</body></html>`;

    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Basira_Question_Analysis.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { render, analyze, exportAllToWord };
})();
