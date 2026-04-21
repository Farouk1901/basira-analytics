/**
 * Basira Analytics — UI Controller
 * Handles tab navigation and all new statistical module interactions.
 * The Likert tab is still managed by app.js (preserved).
 */
'use strict';

const BasiraUI = (() => {
  const _lang = () => I18n.getLang();

  // ============================================
  // Tab Navigation
  // ============================================
  function _initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        // Deactivate all
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        // Activate clicked
        btn.classList.add('active');
        const panel = document.getElementById(`panel-${tabId}`);
        if (panel) panel.classList.add('active');

        // Initialize tab-specific UI
        if (tabId === 'anova') buildAnovaInputs();
        if (tabId === 'chisquare') buildChiTable();
      });
    });
  }

  // ============================================
  // i18n for new tabs
  // ============================================
  const _i18n = {
    ar: {
      'tabs.varview': 'عرض المتغيرات',
      'tabs.dataview': 'عرض البيانات',
      'tabs.qanalysis': 'تحليل الأسئلة',
      'tabs.axisanalysis': 'تحليل المحاور',
      'varview.subtitle': 'عرّف متغيرات الاستبيان — اسم المتغير، النوع، التسمية، قيم ليكرت، ومستوى القياس',
      'dataview.subtitle': 'أدخل استجابات أفراد العينة — كل صف يمثل مستجيب وكل عمود يمثل متغير (سؤال)',
      'qanalysis.subtitle': 'تحليل التكرارات والنسب المئوية والإحصائيات الوصفية لكل سؤال',
      'axisanalysis.subtitle': 'قم بتجميع الأسئلة في محاور موضوعية وتحليلها مع تعليق علمي شامل',
      'tabs.likert': 'ليكرت',
      'tabs.descriptive': 'وصفي',
      'tabs.ttest': 'اختبار T',
      'tabs.anova': 'ANOVA',
      'tabs.correlation': 'ارتباط',
      'tabs.chisquare': 'مربع كاي',
      'desc.title': '📊 الإحصاء الوصفي',
      'desc.subtitle': 'أدخل البيانات الرقمية لحساب المؤشرات الإحصائية الأساسية.',
      'desc.inputLabel': '📝 أدخل البيانات (رقم واحد في كل سطر، أو مفصولة بفاصلة):',
      'desc.hint': 'يمكنك لصق البيانات من Excel أو إدخالها يدوياً',
      'desc.calculate': '📊 حساب الإحصائيات',
      'ttest.title': '🔬 اختبار T',
      'ttest.typeLabel': 'نوع الاختبار:',
      'ttest.independent': 'عينتان مستقلتان (Independent)',
      'ttest.paired': 'عينتان مزدوجتان (Paired)',
      'ttest.group1': '📝 المجموعة الأولى:',
      'ttest.group2': '📝 المجموعة الثانية:',
      'ttest.before': '📝 القياس القبلي:',
      'ttest.after': '📝 القياس البعدي:',
      'ttest.calculate': '🔬 تنفيذ الاختبار',
      'anova.title': '📈 تحليل التباين الأحادي (ANOVA)',
      'anova.subtitle': 'قارن متوسطات ثلاث مجموعات أو أكثر.',
      'anova.groupCount': 'عدد المجموعات:',
      'anova.groupLabel': 'المجموعة {n}:',
      'anova.calculate': '📈 تنفيذ ANOVA',
      'corr.title': '🔗 تحليل الارتباط',
      'corr.typeLabel': 'نوع الارتباط:',
      'corr.varX': '📝 المتغير X:',
      'corr.varY': '📝 المتغير Y:',
      'corr.calculate': '🔗 حساب الارتباط',
      'chi.title': '🎲 اختبار مربع كاي (Chi-Square)',
      'chi.subtitle': 'اختبار الاستقلالية بين المتغيرات الفئوية.',
      'chi.rows': 'عدد الصفوف:',
      'chi.cols': 'عدد الأعمدة:',
      'chi.calculate': '🎲 تنفيذ الاختبار',
      'chi.observed': 'التكرارات المشاهدة:',
      'chi.expected': 'التكرارات المتوقعة:',
      'common.uploadCSV': '📂 تحميل CSV',
      'common.error': '⚠️ يرجى إدخال بيانات صحيحة.',
      'common.errorPaired': '⚠️ يجب أن يكون حجم العينتين متساوياً.',
      'common.errorMin': '⚠️ يجب إدخال 3 قيم على الأقل.',
      'common.errorGroups': '⚠️ يجب إدخال بيانات لكل مجموعة.',
      'common.errorChi': '⚠️ يرجى إدخال جميع قيم الجدول.',
      'r.n': 'عدد الملاحظات', 'r.mean': 'المتوسط الحسابي', 'r.median': 'الوسيط',
      'r.mode': 'المنوال', 'r.stdDev': 'الانحراف المعياري', 'r.variance': 'التباين',
      'r.min': 'أصغر قيمة', 'r.max': 'أكبر قيمة', 'r.range': 'المدى',
      'r.skewness': 'الالتواء', 'r.kurtosis': 'التفلطح', 'r.se': 'الخطأ المعياري',
      'r.q1': 'الربيع الأول', 'r.q3': 'الربيع الثالث', 'r.iqr': 'المدى الربيعي',
      'r.sum': 'المجموع', 'r.t': 'قيمة T', 'r.df': 'درجات الحرية', 'r.p': 'القيمة الاحتمالية (p)',
      'r.mean1': 'متوسط المجموعة 1', 'r.mean2': 'متوسط المجموعة 2',
      'r.meanDiff': 'فرق المتوسطات', 'r.cohensD': "حجم التأثير (Cohen's d)",
      'r.meanBefore': 'متوسط القبلي', 'r.meanAfter': 'متوسط البعدي',
      'r.F': 'قيمة F', 'r.SSB': 'مجموع المربعات بين المجموعات',
      'r.SSW': 'مجموع المربعات داخل المجموعات', 'r.MSB': 'متوسط المربعات بين',
      'r.MSW': 'متوسط المربعات داخل', 'r.etaSquared': 'مربع إيتا (η²)',
      'r.r': 'معامل الارتباط (r)', 'r.rSquared': 'معامل التحديد (R²)',
      'r.chiSquare': 'قيمة مربع كاي (χ²)', 'r.cramersV': "معامل كرامر (Cramér's V)",
      'r.significant': 'الدلالة الإحصائية', 'r.yes': '✅ دال إحصائياً', 'r.no': '❌ غير دال',
    },
    en: {
      'tabs.varview': 'Variable View',
      'tabs.dataview': 'Data View',
      'tabs.qanalysis': 'Question Analysis',
      'tabs.axisanalysis': 'Axis Analysis',
      'varview.subtitle': 'Define questionnaire variables — name, type, label, Likert values, and measurement level',
      'dataview.subtitle': 'Enter respondent data — each row is a respondent, each column is a variable (question)',
      'qanalysis.subtitle': 'Analyze frequencies, percentages, and descriptive statistics per question',
      'axisanalysis.subtitle': 'Group questions into thematic axes and analyze with comprehensive scholarly commentary',
      'tabs.likert': 'Likert',
      'tabs.descriptive': 'Descriptive',
      'tabs.ttest': 'T-Test',
      'tabs.anova': 'ANOVA',
      'tabs.correlation': 'Correlation',
      'tabs.chisquare': 'Chi-Square',
      'desc.title': '📊 Descriptive Statistics',
      'desc.subtitle': 'Enter numeric data to calculate basic statistical indicators.',
      'desc.inputLabel': '📝 Enter data (one number per line, or comma-separated):',
      'desc.hint': 'You can paste data from Excel or enter manually',
      'desc.calculate': '📊 Calculate Statistics',
      'ttest.title': '🔬 T-Test',
      'ttest.typeLabel': 'Test Type:',
      'ttest.independent': 'Independent Samples',
      'ttest.paired': 'Paired Samples',
      'ttest.group1': '📝 Group 1:',
      'ttest.group2': '📝 Group 2:',
      'ttest.before': '📝 Pre-test:',
      'ttest.after': '📝 Post-test:',
      'ttest.calculate': '🔬 Run Test',
      'anova.title': '📈 One-Way ANOVA',
      'anova.subtitle': 'Compare means of three or more groups.',
      'anova.groupCount': 'Number of Groups:',
      'anova.groupLabel': 'Group {n}:',
      'anova.calculate': '📈 Run ANOVA',
      'corr.title': '🔗 Correlation Analysis',
      'corr.typeLabel': 'Correlation Type:',
      'corr.varX': '📝 Variable X:',
      'corr.varY': '📝 Variable Y:',
      'corr.calculate': '🔗 Calculate Correlation',
      'chi.title': '🎲 Chi-Square Test',
      'chi.subtitle': 'Test of independence between categorical variables.',
      'chi.rows': 'Number of Rows:',
      'chi.cols': 'Number of Columns:',
      'chi.calculate': '🎲 Run Test',
      'chi.observed': 'Observed Frequencies:',
      'chi.expected': 'Expected Frequencies:',
      'common.uploadCSV': '📂 Upload CSV',
      'common.error': '⚠️ Please enter valid data.',
      'common.errorPaired': '⚠️ Both samples must have equal size.',
      'common.errorMin': '⚠️ Enter at least 3 values.',
      'common.errorGroups': '⚠️ Enter data for all groups.',
      'common.errorChi': '⚠️ Please fill all table cells.',
      'r.n': 'Observations', 'r.mean': 'Mean', 'r.median': 'Median',
      'r.mode': 'Mode', 'r.stdDev': 'Std. Deviation', 'r.variance': 'Variance',
      'r.min': 'Minimum', 'r.max': 'Maximum', 'r.range': 'Range',
      'r.skewness': 'Skewness', 'r.kurtosis': 'Kurtosis', 'r.se': 'Std. Error',
      'r.q1': 'Q1 (25th)', 'r.q3': 'Q3 (75th)', 'r.iqr': 'IQR',
      'r.sum': 'Sum', 'r.t': 'T-Statistic', 'r.df': 'Degrees of Freedom', 'r.p': 'P-Value',
      'r.mean1': 'Mean Group 1', 'r.mean2': 'Mean Group 2',
      'r.meanDiff': 'Mean Difference', 'r.cohensD': "Cohen's d",
      'r.meanBefore': 'Pre-test Mean', 'r.meanAfter': 'Post-test Mean',
      'r.F': 'F-Statistic', 'r.SSB': 'SS Between', 'r.SSW': 'SS Within',
      'r.MSB': 'MS Between', 'r.MSW': 'MS Within', 'r.etaSquared': 'Eta Squared (η²)',
      'r.r': 'Correlation (r)', 'r.rSquared': 'R-Squared (R²)',
      'r.chiSquare': 'Chi-Square (χ²)', 'r.cramersV': "Cramér's V",
      'r.significant': 'Significance', 'r.yes': '✅ Significant', 'r.no': '❌ Not Significant',
    }
  };

  function _t(key) {
    const lang = _lang();
    return (_i18n[lang] && _i18n[lang][key]) || (_i18n.en[key]) || key;
  }

  function _updateTabTexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = _t(key);
    });
  }

  // ============================================
  // Parse Data Helper
  // ============================================
  function _parseData(text) {
    if (!text || !text.trim()) return [];
    return text.split(/[\n,;\t]+/)
      .map(s => parseFloat(s.trim()))
      .filter(v => Number.isFinite(v));
  }

  function _fmt(v, d = 4) {
    return Number.isFinite(v) ? v.toFixed(d) : '—';
  }

  function _sigClass(p) {
    if (p < 0.05) return 'sig-yes';
    if (p < 0.1) return 'sig-marginal';
    return 'sig-no';
  }

  // ============================================
  // Build Result HTML
  // ============================================
  function _resultRow(label, value, extraClass = '') {
    return `<div class="result-row">
      <span class="result-label">${Utils.escapeHTML(label)}</span>
      <span class="result-value ${extraClass}">${Utils.escapeHTML(String(value))}</span>
    </div>`;
  }

  function _resultBox(title, rows, insightText) {
    return `<div class="result-box">
      <h4>${Utils.escapeHTML(title)}</h4>
      ${rows}
    </div>
    ${insightText ? `<div class="insight-card">${Utils.escapeHTML(insightText)}</div>` : ''}`;
  }

  // ============================================
  // DESCRIPTIVE STATISTICS
  // ============================================
  function runDescriptive() {
    const data = _parseData(document.getElementById('descData').value);
    if (data.length < 2) {
      document.getElementById('descResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    const r = Descriptive.analyze(data);
    if (!r) return;

    const modeStr = r.mode ? (Array.isArray(r.mode) ? r.mode.join(', ') : String(r.mode)) : '—';

    const html = _resultBox(`📊 ${_t('desc.title')}`, [
      _resultRow(_t('r.n'), r.n),
      _resultRow(_t('r.sum'), _fmt(r.sum, 2)),
      _resultRow(_t('r.mean'), _fmt(r.mean)),
      _resultRow(_t('r.median'), _fmt(r.median)),
      _resultRow(_t('r.mode'), modeStr),
      _resultRow(_t('r.stdDev'), _fmt(r.stdDev)),
      _resultRow(_t('r.variance'), _fmt(r.variance)),
      _resultRow(_t('r.se'), _fmt(r.se)),
      _resultRow(_t('r.min'), _fmt(r.min, 2)),
      _resultRow(_t('r.max'), _fmt(r.max, 2)),
      _resultRow(_t('r.range'), _fmt(r.range, 2)),
      _resultRow(_t('r.q1'), _fmt(r.q1)),
      _resultRow(_t('r.q3'), _fmt(r.q3)),
      _resultRow(_t('r.iqr'), _fmt(r.iqr)),
      _resultRow(_t('r.skewness'), _fmt(r.skewness)),
      _resultRow(_t('r.kurtosis'), _fmt(r.kurtosis)),
    ].join(''), Insights.descriptive(r, _lang()));

    document.getElementById('descResults').innerHTML = html;
  }

  // ============================================
  // T-TEST
  // ============================================
  function toggleTTestType() {
    const type = document.getElementById('ttestType').value;
    const label1 = document.getElementById('ttest-label1');
    const label2 = document.getElementById('ttest-label2');
    if (type === 'paired') {
      label1.textContent = _t('ttest.before');
      label2.textContent = _t('ttest.after');
    } else {
      label1.textContent = _t('ttest.group1');
      label2.textContent = _t('ttest.group2');
    }
  }

  function runTTest() {
    const type = document.getElementById('ttestType').value;
    const g1 = _parseData(document.getElementById('ttestGroup1').value);
    const g2 = _parseData(document.getElementById('ttestGroup2').value);

    if (g1.length < 2 || g2.length < 2) {
      document.getElementById('ttestResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    let result;
    if (type === 'paired') {
      if (g1.length !== g2.length) {
        document.getElementById('ttestResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.errorPaired')}</div>`;
        return;
      }
      result = TTest.paired(g1, g2);
    } else {
      result = TTest.independent(g1, g2);
    }

    if (!result) {
      document.getElementById('ttestResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    const rows = type === 'paired' ? [
      _resultRow(_t('r.n'), result.n),
      _resultRow(_t('r.meanBefore'), _fmt(result.meanBefore)),
      _resultRow(_t('r.meanAfter'), _fmt(result.meanAfter)),
      _resultRow(_t('r.meanDiff'), _fmt(result.meanDiff)),
      _resultRow(_t('r.t'), _fmt(result.t)),
      _resultRow(_t('r.df'), result.df),
      _resultRow(_t('r.p'), _fmt(result.p, 6), _sigClass(result.p)),
      _resultRow(_t('r.cohensD'), _fmt(result.cohensD)),
      _resultRow(_t('r.significant'), result.significant ? _t('r.yes') : _t('r.no'), _sigClass(result.p)),
    ] : [
      _resultRow(`${_t('r.n')} (G1, G2)`, `${result.n1}, ${result.n2}`),
      _resultRow(_t('r.mean1'), _fmt(result.mean1)),
      _resultRow(_t('r.mean2'), _fmt(result.mean2)),
      _resultRow(_t('r.meanDiff'), _fmt(result.meanDiff)),
      _resultRow(_t('r.t'), _fmt(result.t)),
      _resultRow(_t('r.df'), _fmt(result.df, 2)),
      _resultRow(_t('r.p'), _fmt(result.p, 6), _sigClass(result.p)),
      _resultRow(_t('r.cohensD'), _fmt(result.cohensD)),
      _resultRow(_t('r.significant'), result.significant ? _t('r.yes') : _t('r.no'), _sigClass(result.p)),
    ];

    const insight = Insights.significance(result.p, _lang()) + '\n' + Insights.cohensD(result.cohensD, _lang());
    document.getElementById('ttestResults').innerHTML = _resultBox(`🔬 ${result.test}`, rows.join(''), insight);
  }

  // ============================================
  // ANOVA
  // ============================================
  function buildAnovaInputs() {
    const count = parseInt(document.getElementById('anovaGroupCount').value) || 3;
    const container = document.getElementById('anovaInputs');
    let html = '<div class="grid-2">';
    for (let i = 1; i <= count; i++) {
      html += `<div class="form-group">
        <label>${_t('anova.groupLabel').replace('{n}', i)}</label>
        <textarea id="anovaGroup${i}" rows="4" placeholder="5, 8, 12, 7, 9"></textarea>
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function runANOVA() {
    const count = parseInt(document.getElementById('anovaGroupCount').value) || 3;
    const groups = [];
    const names = [];

    for (let i = 1; i <= count; i++) {
      const el = document.getElementById(`anovaGroup${i}`);
      if (!el) continue;
      const data = _parseData(el.value);
      if (data.length < 2) {
        document.getElementById('anovaResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.errorGroups')}</div>`;
        return;
      }
      groups.push(data);
      names.push(`Group ${i}`);
    }

    const result = ANOVA.oneWay(groups, names);
    if (!result) {
      document.getElementById('anovaResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    // ANOVA table
    let anovaTable = `<div class="table-container" style="margin-top:16px">
      <table>
        <thead><tr>
          <th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th><th>p</th>
        </tr></thead>
        <tbody>
          <tr><td>Between Groups</td><td>${_fmt(result.SSB)}</td><td>${result.dfBetween}</td><td>${_fmt(result.MSB)}</td><td><strong>${_fmt(result.F)}</strong></td><td class="${_sigClass(result.p)}"><strong>${_fmt(result.p, 6)}</strong></td></tr>
          <tr><td>Within Groups</td><td>${_fmt(result.SSW)}</td><td>${result.dfWithin}</td><td>${_fmt(result.MSW)}</td><td>—</td><td>—</td></tr>
          <tr class="summary-row"><td>Total</td><td>${_fmt(result.SST)}</td><td>${result.dfTotal}</td><td>—</td><td>—</td><td>—</td></tr>
        </tbody>
      </table>
    </div>`;

    // Group stats table
    let groupTable = `<div class="table-container" style="margin-top:16px">
      <table>
        <thead><tr><th>Group</th><th>N</th><th>Mean</th><th>Std. Dev.</th></tr></thead>
        <tbody>
          ${result.groupStats.map(g => `<tr><td>${Utils.escapeHTML(g.name)}</td><td>${g.n}</td><td>${_fmt(g.mean)}</td><td>${_fmt(g.stdDev)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;

    const rows = [
      _resultRow(_t('r.F'), _fmt(result.F)),
      _resultRow(_t('r.p'), _fmt(result.p, 6), _sigClass(result.p)),
      _resultRow(_t('r.etaSquared'), _fmt(result.etaSquared)),
      _resultRow(_t('r.significant'), result.significant ? _t('r.yes') : _t('r.no'), _sigClass(result.p)),
    ].join('');

    const insight = Insights.significance(result.p, _lang()) + '\n' + Insights.etaSquared(result.etaSquared, _lang());

    document.getElementById('anovaResults').innerHTML =
      _resultBox(`📈 ${result.test}`, rows, insight) + anovaTable + groupTable;
  }

  // ============================================
  // CORRELATION
  // ============================================
  function runCorrelation() {
    const type = document.getElementById('corrType').value;
    const x = _parseData(document.getElementById('corrX').value);
    const y = _parseData(document.getElementById('corrY').value);

    if (x.length < 3 || y.length < 3) {
      document.getElementById('corrResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.errorMin')}</div>`;
      return;
    }
    if (x.length !== y.length) {
      document.getElementById('corrResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.errorPaired')}</div>`;
      return;
    }

    const result = type === 'spearman' ? Correlation.spearman(x, y) : Correlation.pearson(x, y);
    if (!result) {
      document.getElementById('corrResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    const rows = [
      _resultRow(_t('r.n'), result.n),
      _resultRow(_t('r.r'), _fmt(result.r), _sigClass(result.p)),
      _resultRow(_t('r.rSquared'), _fmt(result.rSquared)),
      _resultRow(_t('r.t'), _fmt(result.t)),
      _resultRow(_t('r.df'), result.df),
      _resultRow(_t('r.p'), _fmt(result.p, 6), _sigClass(result.p)),
      _resultRow(_t('r.significant'), result.significant ? _t('r.yes') : _t('r.no'), _sigClass(result.p)),
    ].join('');

    const insight = Insights.significance(result.p, _lang()) + '\n' + Insights.correlationStrength(result.r, _lang());

    document.getElementById('corrResults').innerHTML = _resultBox(`🔗 ${result.test}`, rows, insight);
  }

  // ============================================
  // CHI-SQUARE
  // ============================================
  function buildChiTable() {
    const nRows = parseInt(document.getElementById('chiRows').value) || 2;
    const nCols = parseInt(document.getElementById('chiCols').value) || 2;
    const container = document.getElementById('chiTableContainer');

    let html = `<label style="margin-top:16px;display:block">${_t('chi.observed')}</label>`;
    html += '<div class="table-container chi-input-table"><table><thead><tr><th></th>';
    for (let c = 1; c <= nCols; c++) html += `<th>Col ${c}</th>`;
    html += '</tr></thead><tbody>';

    for (let r = 1; r <= nRows; r++) {
      html += `<tr><th>Row ${r}</th>`;
      for (let c = 1; c <= nCols; c++) {
        html += `<td><input type="number" id="chi_${r}_${c}" min="0" value="0" /></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  function runChiSquare() {
    const nRows = parseInt(document.getElementById('chiRows').value) || 2;
    const nCols = parseInt(document.getElementById('chiCols').value) || 2;

    const observed = [];
    for (let r = 1; r <= nRows; r++) {
      const row = [];
      for (let c = 1; c <= nCols; c++) {
        const val = parseInt(document.getElementById(`chi_${r}_${c}`).value);
        if (!Number.isFinite(val) || val < 0) {
          document.getElementById('chiResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.errorChi')}</div>`;
          return;
        }
        row.push(val);
      }
      observed.push(row);
    }

    const result = ChiSquare.independence(observed);
    if (!result) {
      document.getElementById('chiResults').innerHTML = `<div class="alert alert-error" style="display:block">${_t('common.error')}</div>`;
      return;
    }

    // Expected frequencies table
    let expectedTable = `<label style="margin-top:16px;display:block">${_t('chi.expected')}</label>`;
    expectedTable += '<div class="table-container"><table><thead><tr><th></th>';
    for (let c = 0; c < result.expected[0].length; c++) expectedTable += `<th>${result.colLabels[c]}</th>`;
    expectedTable += '<th>Total</th></tr></thead><tbody>';
    for (let r = 0; r < result.expected.length; r++) {
      expectedTable += `<tr><th>${result.rowLabels[r]}</th>`;
      result.expected[r].forEach(v => expectedTable += `<td>${v}</td>`);
      expectedTable += `<td><strong>${result.rowTotals[r]}</strong></td></tr>`;
    }
    expectedTable += `<tr class="summary-row"><th>Total</th>`;
    result.colTotals.forEach(v => expectedTable += `<td><strong>${v}</strong></td>`);
    expectedTable += `<td><strong>${result.grandTotal}</strong></td></tr>`;
    expectedTable += '</tbody></table></div>';

    const rows = [
      _resultRow(_t('r.chiSquare'), _fmt(result.chiSquare)),
      _resultRow(_t('r.df'), result.df),
      _resultRow(_t('r.p'), _fmt(result.p, 6), _sigClass(result.p)),
      _resultRow(_t('r.cramersV'), _fmt(result.cramersV)),
      _resultRow(_t('r.significant'), result.significant ? _t('r.yes') : _t('r.no'), _sigClass(result.p)),
    ].join('');

    const insight = Insights.significance(result.p, _lang()) + '\n' + Insights.cramersV(result.cramersV, _lang());

    document.getElementById('chiResults').innerHTML = _resultBox(`🎲 ${result.test}`, rows, insight) + expectedTable;
  }

  // ============================================
  // CSV Upload
  // ============================================
  async function uploadCSVFor(targetModule) {
    const result = await CSVParser.uploadAndParse();
    if (!result || result.headers.length === 0) return;

    // Find first numeric column
    const types = CSVParser.detectTypes(result.rows, result.headers);
    const numericCols = result.headers.filter(h => types[h] === 'numeric');

    if (numericCols.length === 0) {
      alert(_lang() === 'ar' ? 'لم يتم العثور على أعمدة رقمية.' : 'No numeric columns found.');
      return;
    }

    const values = CSVParser.getNumericColumn(result.rows, numericCols[0]);
    if (targetModule === 'descriptive') {
      document.getElementById('descData').value = values.join(', ');
      runDescriptive();
    }
  }

  // ============================================
  // Init
  // ============================================
  function init() {
    _initTabs();
    _updateTabTexts();
    buildAnovaInputs();
    buildChiTable();

    // Re-translate on language change
    I18n.onLanguageChange(() => {
      _updateTabTexts();
      toggleTTestType();
      buildAnovaInputs();
      buildChiTable();
    });
  }

  // Auto-init after DOM is ready (app.js init runs first)
  const _origDCL = document.addEventListener;
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100); // Ensure app.js inits first
  });

  return {
    runDescriptive, runTTest, toggleTTestType,
    runANOVA, buildAnovaInputs,
    runCorrelation,
    runChiSquare, buildChiTable,
    uploadCSVFor
  };
})();
