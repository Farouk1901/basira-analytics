/**
 * Basira Analytics — Axis Analysis
 * Group questions into thematic axes (محاور), calculate combined statistics,
 * and generate scholarly commentary with scientific justifications.
 */
'use strict';

const AxisAnalysis = (() => {
  const M = SPSSDataModel;
  let _container = null;

  const _lang = () => (typeof I18n !== 'undefined' ? I18n.getLang() : 'ar');

  const _t = {
    ar: {
      title: '🎯 تحليل المحاور',
      subtitle: 'قم بتجميع الأسئلة في محاور موضوعية وتحليلها كوحدة واحدة مع تعليق علمي شامل',
      addAxis: '➕ إضافة محور',
      removeAxis: '🗑️ حذف',
      axisName: 'اسم المحور (EN):',
      axisNameAr: 'اسم المحور (AR):',
      selectVars: 'اختر المتغيرات:',
      analyze: '📊 تحليل المحاور',
      exportWord: '📄 تصدير إلى Word',
      noAxes: 'لم يتم تعريف أي محور. انقر "إضافة محور" للبدء.',
      noData: '⚠️ لا توجد بيانات كافية للتحليل.',
      noVars: '⚠️ لم يتم تعريف متغيرات.',
      axisResult: 'نتائج المحور',
      question: 'السؤال',
      mean: 'المتوسط',
      stdDev: 'الانحراف المعياري',
      level: 'المستوى',
      rank: 'الترتيب',
      overallMean: 'المتوسط العام للمحور',
      overallStd: 'الانحراف المعياري العام',
      reliability: 'معامل الثبات (كرونباخ ألفا)',
      commentary: '📝 التعليق العلمي والتفسير',
      comparison: '📊 مقارنة المحاور',
      levelVeryHigh: 'مرتفع جداً',
      levelHigh: 'مرتفع',
      levelMedium: 'متوسط',
      levelLow: 'منخفض',
      levelVeryLow: 'منخفض جداً',
      strongestItem: 'أقوى بند',
      weakestItem: 'أضعف بند',
      confirmRemove: 'هل أنت متأكد من حذف هذا المحور؟'
    },
    en: {
      title: '🎯 Axis Analysis',
      subtitle: 'Group questions into thematic axes and analyze as a unit with comprehensive scholarly commentary',
      addAxis: '➕ Add Axis',
      removeAxis: '🗑️ Delete',
      axisName: 'Axis Name (EN):',
      axisNameAr: 'Axis Name (AR):',
      selectVars: 'Select Variables:',
      analyze: '📊 Analyze Axes',
      exportWord: '📄 Export to Word',
      noAxes: 'No axes defined. Click "Add Axis" to start.',
      noData: '⚠️ Not enough data for analysis.',
      noVars: '⚠️ No variables defined.',
      axisResult: 'Axis Results',
      question: 'Question',
      mean: 'Mean',
      stdDev: 'Std. Dev.',
      level: 'Level',
      rank: 'Rank',
      overallMean: 'Overall Axis Mean',
      overallStd: 'Overall Std. Dev.',
      reliability: 'Reliability (Cronbach\'s Alpha)',
      commentary: '📝 Scholarly Commentary & Interpretation',
      comparison: '📊 Axis Comparison',
      levelVeryHigh: 'Very High',
      levelHigh: 'High',
      levelMedium: 'Medium',
      levelLow: 'Low',
      levelVeryLow: 'Very Low',
      strongestItem: 'Strongest Item',
      weakestItem: 'Weakest Item',
      confirmRemove: 'Are you sure you want to delete this axis?'
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
    const axes = M.getAxes();

    let html = `<div class="ax-toolbar">
      <button class="btn btn-primary" onclick="AxisAnalysis.addAxis()"><span>${t('addAxis')}</span></button>
      <button class="btn btn-accent" onclick="AxisAnalysis.analyzeAll()"><span>${t('analyze')}</span></button>
      <button class="btn btn-secondary" onclick="AxisAnalysis.exportToWord()"><span>${t('exportWord')}</span></button>
    </div>`;

    if (vars.length === 0) {
      html += `<div class="dv-empty">${t('noVars')}</div>`;
      _container.innerHTML = html;
      return;
    }

    // Axis definitions
    if (axes.length === 0) {
      html += `<div class="dv-empty">${t('noAxes')}</div>`;
    } else {
      html += `<div class="ax-definitions">`;
      axes.forEach((axis, ai) => {
        html += `<div class="ax-def-card">
          <div class="ax-def-header">
            <strong>📌 ${_lang() === 'ar' ? (axis.nameAr || axis.name) : axis.name}</strong>
            <button class="btn btn-mini btn-danger" onclick="AxisAnalysis.removeAxis(${ai})">${t('removeAxis')}</button>
          </div>
          <div class="ax-def-body">
            <div class="ax-def-field">
              <label>${t('axisName')}</label>
              <input type="text" class="vv-input" value="${Utils.escapeHTML(axis.name)}" onchange="AxisAnalysis.updateAxis(${ai},'name',this.value)" />
            </div>
            <div class="ax-def-field">
              <label>${t('axisNameAr')}</label>
              <input type="text" class="vv-input" value="${Utils.escapeHTML(axis.nameAr || '')}" onchange="AxisAnalysis.updateAxis(${ai},'nameAr',this.value)" />
            </div>
            <div class="ax-def-field ax-var-select">
              <label>${t('selectVars')}</label>
              <div class="ax-var-checkboxes">
                ${vars.map((v, vi) => `<label class="ax-var-checkbox">
                  <input type="checkbox" value="${vi}" ${axis.variableIndices.includes(vi) ? 'checked' : ''}
                    onchange="AxisAnalysis.toggleVariable(${ai},${vi},this.checked)" />
                  <span>${v.name}</span>
                </label>`).join('')}
              </div>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `<div id="axResults"></div>`;
    _container.innerHTML = html;
  }

  // ──────────────────────────────────────────────
  // Axis CRUD
  // ──────────────────────────────────────────────
  function addAxis() {
    const idx = M.getAxes().length + 1;
    M.addAxis(`Axis ${idx}`, `المحور ${idx}`, []);
    render(_container.id);
  }

  function removeAxis(idx) {
    if (!confirm(t('confirmRemove'))) return;
    M.removeAxis(idx);
    render(_container.id);
  }

  function updateAxis(idx, field, value) {
    const axis = M.getAxes()[idx];
    if (!axis) return;
    axis[field] = value;
  }

  function toggleVariable(axisIdx, varIdx, checked) {
    const axis = M.getAxes()[axisIdx];
    if (!axis) return;
    if (checked && !axis.variableIndices.includes(varIdx)) {
      axis.variableIndices.push(varIdx);
      axis.variableIndices.sort((a, b) => a - b);
    } else if (!checked) {
      axis.variableIndices = axis.variableIndices.filter(i => i !== varIdx);
    }
  }

  // ──────────────────────────────────────────────
  // Analysis
  // ──────────────────────────────────────────────
  function analyzeAll() {
    const axes = M.getAxes();
    const results = document.getElementById('axResults');
    if (!results) return;

    if (axes.length === 0) {
      results.innerHTML = `<div class="alert alert-error" style="display:block">${t('noAxes')}</div>`;
      return;
    }

    let html = '';
    const axisResults = [];

    axes.forEach((axis, ai) => {
      if (axis.variableIndices.length === 0) return;

      const isAr = _lang() === 'ar';
      const axisName = isAr ? (axis.nameAr || axis.name) : axis.name;

      // Calculate per-item stats
      const items = [];
      axis.variableIndices.forEach(vi => {
        const stats = M.getDescriptiveStats(vi);
        const v = M.getVariable(vi);
        if (stats && v) {
          items.push({ index: vi, name: v.name, label: v.label, mean: stats.mean, stdDev: stats.stdDev, n: stats.n });
        }
      });

      if (items.length === 0) return;

      // Rank by mean (descending)
      const ranked = [...items].sort((a, b) => b.mean - a.mean);
      ranked.forEach((item, rank) => item.rank = rank + 1);

      // Overall axis stats
      const axisMean = items.reduce((s, i) => s + i.mean, 0) / items.length;
      const axisStd = Math.sqrt(items.reduce((s, i) => s + (i.mean - axisMean) ** 2, 0) / items.length);

      // Cronbach's Alpha
      const alpha = _cronbachAlpha(axis.variableIndices);

      const maxVal = _getMaxScale(axis.variableIndices[0]);
      const level = _getMeanLevel(axisMean, maxVal);

      axisResults.push({ axisName, axisMean, axisStd, alpha, level, items: ranked, maxVal });

      // Build table
      html += `<div class="ax-result-block">
        <h3 class="ax-result-title">📌 ${Utils.escapeHTML(axisName)}</h3>
        <div class="table-container"><table class="qa-table">
          <thead><tr>
            <th>${t('rank')}</th><th>${t('question')}</th>
            <th>${t('mean')}</th><th>${t('stdDev')}</th><th>${t('level')}</th>
          </tr></thead><tbody>`;

      ranked.forEach(item => {
        const lvl = _getMeanLevel(item.mean, maxVal);
        html += `<tr>
          <td>${item.rank}</td>
          <td>${item.name}: ${Utils.escapeHTML(item.label || '—')}</td>
          <td><strong>${fmt(item.mean)}</strong></td>
          <td>${fmt(item.stdDev)}</td>
          <td class="ax-level ax-level-${lvl.key}">${lvl.label}</td>
        </tr>`;
      });

      html += `<tr class="summary-row">
        <td colspan="2"><strong>${t('overallMean')}</strong></td>
        <td><strong>${fmt(axisMean)}</strong></td>
        <td><strong>${fmt(axisStd)}</strong></td>
        <td class="ax-level ax-level-${level.key}"><strong>${level.label}</strong></td>
      </tr></tbody></table></div>`;

      // Reliability
      if (alpha !== null) {
        html += `<div class="ax-stat-badge">${t('reliability')}: <strong>${fmt(alpha)}</strong> ${alpha >= 0.7 ? '✅' : alpha >= 0.5 ? '⚠️' : '❌'}</div>`;
      }

      // Commentary
      const commentary = _generateCommentary(axisName, axisMean, axisStd, alpha, ranked, maxVal);
      html += `<div class="ax-commentary">
        <div class="qa-section-title">${t('commentary')}</div>
        <div class="ax-commentary-text">${commentary}</div>
      </div>`;

      html += `</div>`; // .ax-result-block
    });

    // Cross-axis comparison
    if (axisResults.length > 1) {
      html += `<div class="ax-result-block">
        <h3 class="ax-result-title">${t('comparison')}</h3>
        <div class="table-container"><table class="qa-table">
          <thead><tr><th>${_lang() === 'ar' ? 'المحور' : 'Axis'}</th><th>${t('mean')}</th><th>${t('stdDev')}</th><th>${t('level')}</th><th>${t('reliability')}</th></tr></thead>
          <tbody>`;
      axisResults.sort((a, b) => b.axisMean - a.axisMean).forEach(ar => {
        html += `<tr>
          <td>${Utils.escapeHTML(ar.axisName)}</td>
          <td><strong>${fmt(ar.axisMean)}</strong></td>
          <td>${fmt(ar.axisStd)}</td>
          <td class="ax-level ax-level-${ar.level.key}">${ar.level.label}</td>
          <td>${ar.alpha !== null ? fmt(ar.alpha) : '—'}</td>
        </tr>`;
      });
      html += `</tbody></table></div></div>`;
    }

    results.innerHTML = html;
  }

  // ──────────────────────────────────────────────
  // Cronbach's Alpha
  // ──────────────────────────────────────────────
  function _cronbachAlpha(varIndices) {
    if (varIndices.length < 2) return null;

    const k = varIndices.length;
    const ss = M.getSampleSize();

    // Get column data
    const columns = varIndices.map(vi => M.getColumn(vi).map(v => v === null ? NaN : Number(v)));

    // Only use rows where ALL items have valid values
    const validRows = [];
    for (let r = 0; r < ss; r++) {
      if (columns.every(col => Number.isFinite(col[r]))) {
        validRows.push(r);
      }
    }
    if (validRows.length < 3) return null;

    // Item variances
    const itemVars = columns.map(col => {
      const valid = validRows.map(r => col[r]);
      const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
      return valid.reduce((s, v) => s + (v - mean) ** 2, 0) / (valid.length - 1);
    });

    // Total score variance
    const totals = validRows.map(r => columns.reduce((s, col) => s + col[r], 0));
    const totalMean = totals.reduce((a, b) => a + b, 0) / totals.length;
    const totalVar = totals.reduce((s, v) => s + (v - totalMean) ** 2, 0) / (totals.length - 1);

    if (totalVar === 0) return null;
    const sumItemVar = itemVars.reduce((a, b) => a + b, 0);
    const alpha = (k / (k - 1)) * (1 - sumItemVar / totalVar);

    return Math.max(0, Math.min(1, alpha));
  }

  // ──────────────────────────────────────────────
  // Mean Level Classification
  // ──────────────────────────────────────────────
  function _getMaxScale(varIdx) {
    const v = M.getVariable(varIdx);
    if (!v) return 5;
    const keys = Object.keys(v.values).map(Number).filter(Number.isFinite);
    return keys.length > 0 ? Math.max(...keys) : 5;
  }

  function _getMeanLevel(mean, maxVal) {
    if (maxVal === 5) {
      if (mean >= 4.2) return { key: 'vhigh', label: t('levelVeryHigh') };
      if (mean >= 3.4) return { key: 'high', label: t('levelHigh') };
      if (mean >= 2.6) return { key: 'medium', label: t('levelMedium') };
      if (mean >= 1.8) return { key: 'low', label: t('levelLow') };
      return { key: 'vlow', label: t('levelVeryLow') };
    }
    const ratio = mean / maxVal;
    if (ratio >= 0.84) return { key: 'vhigh', label: t('levelVeryHigh') };
    if (ratio >= 0.68) return { key: 'high', label: t('levelHigh') };
    if (ratio >= 0.52) return { key: 'medium', label: t('levelMedium') };
    if (ratio >= 0.36) return { key: 'low', label: t('levelLow') };
    return { key: 'vlow', label: t('levelVeryLow') };
  }

  // ──────────────────────────────────────────────
  // Commentary Generator (Bilingual)
  // ──────────────────────────────────────────────
  function _generateCommentary(axisName, axisMean, axisStd, alpha, rankedItems, maxVal) {
    const isAr = _lang() === 'ar';
    const level = _getMeanLevel(axisMean, maxVal);
    const strongest = rankedItems[0];
    const weakest = rankedItems[rankedItems.length - 1];

    let text = '';

    if (isAr) {
      text += `<p>تشير نتائج تحليل محور "<strong>${Utils.escapeHTML(axisName)}</strong>" إلى أن المتوسط الحسابي العام بلغ <strong>(${fmt(axisMean)})</strong> بانحراف معياري <strong>(${fmt(axisStd)})</strong>، وهو ما يُصنّف ضمن مستوى <strong>"${level.label}"</strong>.`;

      if (alpha !== null) {
        text += ` وقد بلغ معامل الثبات (كرونباخ ألفا) <strong>(${fmt(alpha)})</strong>، `;
        if (alpha >= 0.9) text += `وهي قيمة ممتازة تدل على اتساق داخلي عالٍ جداً للأداة.`;
        else if (alpha >= 0.8) text += `مما يشير إلى ثبات جيد جداً للأداة.`;
        else if (alpha >= 0.7) text += `وهي قيمة مقبولة تدل على ثبات جيد.`;
        else if (alpha >= 0.6) text += `وهي قيمة تستدعي الحذر في التفسير.`;
        else text += `وهي قيمة ضعيفة تستوجب مراجعة بنود المحور.`;
      }
      text += `</p>`;

      text += `<p>وقد جاء بند "<strong>${Utils.escapeHTML(strongest.label || strongest.name)}</strong>" في المرتبة الأولى بمتوسط حسابي <strong>(${fmt(strongest.mean)})</strong>، `;
      text += `مما قد يُعزى إلى إدراك أفراد العينة لأهمية هذا الجانب وتأثيره المباشر على أدائهم. `;
      text += `في المقابل، جاء بند "<strong>${Utils.escapeHTML(weakest.label || weakest.name)}</strong>" في المرتبة الأخيرة بمتوسط <strong>(${fmt(weakest.mean)})</strong>، `;
      text += `وهو ما قد يشير إلى وجود تحديات أو قصور في هذا المجال يتطلب مزيداً من الاهتمام.</p>`;

      if (axisStd < 0.5) {
        text += `<p>يُلاحظ أن الانحراف المعياري منخفض نسبياً، مما يدل على تجانس واتفاق واضح في استجابات أفراد العينة حول بنود هذا المحور.</p>`;
      } else if (axisStd > 1.0) {
        text += `<p>يُلاحظ ارتفاع الانحراف المعياري نسبياً، مما يشير إلى تباين في وجهات نظر أفراد العينة وعدم وجود إجماع واضح حول بنود هذا المحور.</p>`;
      }
    } else {
      text += `<p>The analysis of the "<strong>${Utils.escapeHTML(axisName)}</strong>" axis reveals an overall mean of <strong>(${fmt(axisMean)})</strong> with a standard deviation of <strong>(${fmt(axisStd)})</strong>, classified at the <strong>"${level.label}"</strong> level.`;

      if (alpha !== null) {
        text += ` Cronbach's Alpha reliability coefficient was <strong>(${fmt(alpha)})</strong>, `;
        if (alpha >= 0.9) text += `indicating excellent internal consistency.`;
        else if (alpha >= 0.8) text += `indicating very good reliability.`;
        else if (alpha >= 0.7) text += `indicating acceptable reliability.`;
        else if (alpha >= 0.6) text += `which warrants cautious interpretation.`;
        else text += `suggesting the axis items need revision.`;
      }
      text += `</p>`;

      text += `<p>The item "<strong>${Utils.escapeHTML(strongest.label || strongest.name)}</strong>" ranked first with a mean of <strong>(${fmt(strongest.mean)})</strong>, `;
      text += `which may be attributed to respondents' awareness of its importance and direct impact. `;
      text += `Conversely, "<strong>${Utils.escapeHTML(weakest.label || weakest.name)}</strong>" ranked last with a mean of <strong>(${fmt(weakest.mean)})</strong>, `;
      text += `potentially indicating challenges or deficiencies in this area requiring further attention.</p>`;

      if (axisStd < 0.5) {
        text += `<p>The relatively low standard deviation indicates strong consensus among respondents regarding this axis.</p>`;
      } else if (axisStd > 1.0) {
        text += `<p>The relatively high standard deviation suggests diverse perspectives among respondents, with no clear consensus on this axis.</p>`;
      }
    }

    return text;
  }

  // ──────────────────────────────────────────────
  // Export to Word
  // ──────────────────────────────────────────────
  function exportToWord() {
    const resultsEl = document.getElementById('axResults');
    if (!resultsEl || !resultsEl.innerHTML.trim()) {
      analyzeAll();
    }
    const content = document.getElementById('axResults');
    if (!content || !content.innerHTML.trim()) return;

    const isRTL = _lang() === 'ar';
    const dir = isRTL ? 'rtl' : 'ltr';
    const date = new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const htmlDoc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>body{font-family:'Simplified Arabic',Arial;direction:${dir};padding:20px;line-height:1.8}
table{border-collapse:collapse;width:100%;margin:10px 0}th,td{border:1px solid #374151;padding:6px;text-align:center;font-size:10pt}
th{background:#1e3a8a;color:white}h2{color:#1e3a8a;text-align:center}h3{color:#1e40af}
.summary-row td{background:#fef3c7;font-weight:bold}.ax-commentary-text{line-height:2;text-align:justify;margin:10px 20px}
.ax-stat-badge{background:#eff6ff;border:1px solid #93c5fd;padding:8px 12px;display:inline-block;margin:8px 0;border-radius:4px}</style>
</head><body>
<h2>Basira Analytics — بصيرة</h2>
<p style="text-align:center;color:#6b7280">${t('title')} — ${date}</p>
${content.innerHTML}
<p style="text-align:center;color:#9ca3af;margin-top:30px;border-top:2px solid #e5e7eb;padding-top:10px">© ${new Date().getFullYear()} Engineer Ahmed Gohary — Basira Analytics</p>
</body></html>`;

    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Basira_Axis_Analysis.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { render, addAxis, removeAxis, updateAxis, toggleVariable, analyzeAll, exportToWord };
})();
