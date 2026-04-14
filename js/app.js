/**
 * STTS — Main Application Controller
 * Orchestrates all modules: i18n, statistics, storage, charts, export.
 */
'use strict';

const App = (() => {
  // ============================================
  // State
  // ============================================
  let fixedWeights = null;
  let questionsData = [];
  let editingIndex = -1;
  let useSampleVariance = true;

  // ============================================
  // DOM Element References
  // ============================================
  let els = {};

  function _cacheElements() {
    els = {
      sampleSize: document.getElementById('sampleSize'),
      scaleType: document.getElementById('scaleType'),
      questionNumber: document.getElementById('questionNumber'),
      varianceType: document.getElementById('varianceType'),
      weightInputsContainer: document.getElementById('weightInputsContainer'),
      inputsContainer: document.getElementById('inputsContainer'),
      resultsTable: document.getElementById('resultsTable'),
      resultsBody: document.querySelector('#resultsTable tbody'),
      resultsTableHead: document.getElementById('resultsTableHead'),
      errorMessage: document.getElementById('errorMessage'),
      successMessage: document.getElementById('successMessage'),
      warningMessage: document.getElementById('warningMessage'),
      summarySection: document.getElementById('summarySection'),
      summaryGrid: document.getElementById('summaryGrid'),
      analyticalText: document.getElementById('analyticalText'),
      chartSection: document.getElementById('chartSection'),
      btnText: document.getElementById('btnText'),
      calculateBtn: document.getElementById('calculateQuestionBtn'),
      resetBtn: document.getElementById('resetBtn'),
      saveDataBtn: document.getElementById('saveDataBtn'),
      loadDataBtn: document.getElementById('loadDataBtn'),
      questionsCount: document.getElementById('questionsCount'),
      langToggleBtn: document.getElementById('langToggleBtn'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      exportWordBtn: document.getElementById('exportWordBtn'),
      exportCSVBtn: document.getElementById('exportCSVBtn'),
      exportJSONBtn: document.getElementById('exportJSONBtn'),
      importJSONBtn: document.getElementById('importJSONBtn'),
    };
  }

  // ============================================
  // Initialization
  // ============================================

  async function init() {
    _cacheElements();

    // Initialize i18n
    const savedLang = I18n.getSavedLang();
    await I18n.init(savedLang);

    // Initialize theme
    const savedTheme = Storage.loadTheme();
    _applyTheme(savedTheme);

    // Bind events
    _bindEvents();

    // Render UI text
    _renderUIText();

    // Register language change handler
    I18n.onLanguageChange(() => {
      _renderUIText();
      _rebuildDynamicUI();
    });
  }

  // ============================================
  // Event Binding
  // ============================================

  function _bindEvents() {
    // Language toggle
    els.langToggleBtn.addEventListener('click', async () => {
      await I18n.toggle();
    });

    // Theme toggle
    els.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      _applyTheme(next);
      Storage.saveTheme(next);
      // Re-render charts with new theme colors
      _renderCharts();
    });

    // Scale type change
    els.scaleType.addEventListener('change', _onScaleChange);

    // Variance type change
    els.varianceType.addEventListener('change', () => {
      useSampleVariance = els.varianceType.value === 'sample';
      // Recalculate existing data
      if (questionsData.length > 0 && fixedWeights) {
        questionsData.forEach(q => {
          q.stats = Statistics.calculate(q.counts, fixedWeights, useSampleVariance);
        });
        _renderTable();
        _updateSummary();
      }
    });

    // Add/Update question
    els.calculateBtn.addEventListener('click', _onAddQuestion);

    // Reset
    els.resetBtn.addEventListener('click', _onReset);

    // Save/Load
    els.saveDataBtn.addEventListener('click', _saveData);
    els.loadDataBtn.addEventListener('click', _loadData);

    // Export buttons
    els.exportWordBtn.addEventListener('click', _exportWord);
    els.exportCSVBtn.addEventListener('click', _exportCSV);
    els.exportJSONBtn.addEventListener('click', _exportJSON);
    els.importJSONBtn.addEventListener('click', _importJSON);
  }

  // ============================================
  // Theme
  // ============================================

  function _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (els.themeToggleBtn) {
      const icon = theme === 'dark' ? '☀️' : '🌙';
      const label = theme === 'dark' ? I18n.t('app.themeToggleLight') : I18n.t('app.themeToggle');
      els.themeToggleBtn.innerHTML = `<span class="icon">${icon}</span> ${Utils.escapeHTML(label)}`;
    }
  }

  // ============================================
  // UI Text Rendering (i18n)
  // ============================================

  function _renderUIText() {
    const t = I18n.t.bind(I18n);

    // Header
    Utils.setText(document.getElementById('appTitle'), t('app.title'));
    Utils.setText(document.getElementById('appSubtitle'), t('app.subtitle'));

    // Language toggle
    if (els.langToggleBtn) {
      els.langToggleBtn.innerHTML = `<span class="icon">🌍</span> ${Utils.escapeHTML(t('app.langToggle'))}`;
    }

    // Theme toggle refresh
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    _applyTheme(currentTheme);

    // Settings section
    Utils.setText(document.getElementById('settingsTitle'), t('settings.title'));
    Utils.setText(document.getElementById('sampleSizeLabel'), '');
    document.getElementById('sampleSizeLabel').innerHTML = `${t('settings.sampleSize')} <span class="tooltip" data-tooltip="${Utils.escapeHTML(t('settings.sampleSizeTip'))}">ℹ️</span>`;
    els.sampleSize.placeholder = t('settings.sampleSizePlaceholder');

    Utils.setText(document.getElementById('scaleTypeLabel'), '');
    document.getElementById('scaleTypeLabel').innerHTML = `${t('settings.scaleType')} <span class="tooltip" data-tooltip="${Utils.escapeHTML(t('settings.scaleTypeTip'))}">ℹ️</span>`;

    // Scale options
    const scaleOptions = els.scaleType.querySelectorAll('option');
    if (scaleOptions[0]) scaleOptions[0].textContent = t('settings.scaleTypeDefault');
    if (scaleOptions[1]) scaleOptions[1].textContent = t('settings.scaleBinary');
    if (scaleOptions[2]) scaleOptions[2].textContent = t('settings.scaleTernary');
    if (scaleOptions[3]) scaleOptions[3].textContent = t('settings.scaleFive');

    Utils.setText(document.getElementById('questionNumberLabel'), '');
    document.getElementById('questionNumberLabel').innerHTML = `${t('settings.questionNumber')} <span class="tooltip" data-tooltip="${Utils.escapeHTML(t('settings.questionNumberTip'))}">ℹ️</span>`;
    els.questionNumber.placeholder = t('settings.questionNumberPlaceholder');

    // Variance type
    Utils.setText(document.getElementById('varianceTypeLabel'), '');
    document.getElementById('varianceTypeLabel').innerHTML = `${t('settings.varianceType')} <span class="tooltip" data-tooltip="${Utils.escapeHTML(t('settings.varianceTypeTip'))}">ℹ️</span>`;
    const varianceOptions = els.varianceType.querySelectorAll('option');
    if (varianceOptions[0]) varianceOptions[0].textContent = t('settings.varianceSample');
    if (varianceOptions[1]) varianceOptions[1].textContent = t('settings.variancePopulation');

    // Buttons
    if (editingIndex < 0) {
      Utils.setText(els.btnText, t('buttons.addQuestion'));
    } else {
      Utils.setText(els.btnText, t('buttons.updateQuestion'));
    }

    Utils.setText(document.getElementById('saveDataText'), t('buttons.saveData'));
    Utils.setText(document.getElementById('loadDataText'), t('buttons.loadData'));

    // Results section
    Utils.setText(document.getElementById('resultsTitle'), t('results.title'));

    // Export buttons
    Utils.setText(document.getElementById('exportWordText'), t('buttons.exportWord'));
    Utils.setText(document.getElementById('exportCSVText'), t('buttons.exportCSV'));
    Utils.setText(document.getElementById('exportJSONText'), t('buttons.exportJSON'));
    Utils.setText(document.getElementById('importJSONText'), t('buttons.importJSON'));
    Utils.setText(document.getElementById('resetText'), t('buttons.reset'));

    // Summary section
    Utils.setText(document.getElementById('summaryTitle'), t('summary.title'));

    // Charts section
    Utils.setText(document.getElementById('chartTitle'), t('chart.responseDistribution'));

    // Footer
    const footerEl = document.getElementById('footerText');
    if (footerEl) {
      footerEl.innerHTML = I18n.t('footer.copyright', { year: new Date().getFullYear() });
    }

    // Update table headers if scale is set
    if (els.scaleType.value) {
      _updateTableHeaders();
    }

    // Update questions count badge
    _updateQuestionsCount();
  }

  function _rebuildDynamicUI() {
    const scaleVal = els.scaleType.value;
    if (scaleVal) {
      const scale = I18n.getScaleOptions()[scaleVal];
      if (scale) {
        _createWeightInputs(scale, scaleVal);
        _createCountInputs(scale);
        // If weights are locked, disable them
        if (fixedWeights) {
          els.weightInputsContainer.querySelectorAll('input[type="number"]').forEach(inp => inp.disabled = true);
        }
        // Restore count values if in edit mode
        if (editingIndex >= 0 && questionsData[editingIndex]) {
          const countInputs = els.inputsContainer.querySelectorAll('input[type="number"]');
          questionsData[editingIndex].counts.forEach((c, i) => {
            if (countInputs[i]) countInputs[i].value = c;
          });
        }
      }
      _updateTableHeaders();
    }
    _renderTable();
    _updateSummary();
    _renderCharts();
  }

  // ============================================
  // Scale Change Handler
  // ============================================

  function _onScaleChange() {
    const scaleVal = els.scaleType.value;
    const t = I18n.t.bind(I18n);

    if (questionsData.length > 0) {
      _showMessage(t('messages.cantChangeScale'), 'error');
      els.scaleType.value = questionsData[0].scaleVal;
      return;
    }

    if (fixedWeights !== null) {
      _showMessage(t('messages.cantChangeWeights'), 'error');
      els.scaleType.value = els.scaleType.dataset.currentValue || '';
      return;
    }

    _hideAllMessages();

    if (!scaleVal) {
      els.weightInputsContainer.classList.add('hidden');
      els.inputsContainer.classList.add('hidden');
      return;
    }

    els.scaleType.dataset.currentValue = scaleVal;
    const scale = I18n.getScaleOptions()[scaleVal];

    _updateTableHeaders();
    _createWeightInputs(scale, scaleVal);
    _createCountInputs(scale);

    _showMessage(t('messages.defaultWeightsSet'), 'success');
  }

  // ============================================
  // UI Builders
  // ============================================

  function _updateTableHeaders() {
    const scaleVal = els.scaleType.value;
    const scale = I18n.getScaleOptions()[scaleVal];
    const t = I18n.t.bind(I18n);

    els.resultsTableHead.innerHTML = '';
    if (!scale) return;

    const headerRow = document.createElement('tr');

    // Fixed columns
    [t('results.headers.questionNum'), t('results.headers.sampleSize'), t('results.headers.scaleType')].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });

    // Scale category columns
    scale.forEach(label => {
      const th = document.createElement('th');
      th.textContent = label;
      headerRow.appendChild(th);
    });

    // Statistical indicator columns
    [
      { key: 'mean', text: t('results.headers.mean') },
      { key: 'std', text: t('results.headers.std') },
      { key: 'variance', text: t('results.headers.variance') },
      { key: 'cv', text: t('results.headers.cv') },
      { key: 'median', text: t('results.headers.median') }
    ].forEach(({ text }) => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });

    // Actions column
    const thActions = document.createElement('th');
    thActions.textContent = t('results.headers.actions');
    thActions.className = 'action-column';
    headerRow.appendChild(thActions);

    els.resultsTableHead.appendChild(headerRow);
  }

  function _createWeightInputs(scale, scaleVal) {
    const t = I18n.t.bind(I18n);

    els.weightInputsContainer.innerHTML = `<h4 style="color:var(--primary-700);margin-top:0">${Utils.escapeHTML(t('weights.title'))}</h4>`;

    // Note box
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-box';
    noteDiv.innerHTML = `
      <strong>${Utils.escapeHTML(t('weights.noteTitle'))}</strong>
      ${Utils.escapeHTML(t('weights.noteText', { max: scale.length }))}
      <br>${Utils.escapeHTML(t('weights.noteExample'))}
    `;
    els.weightInputsContainer.appendChild(noteDiv);

    // Weight input grid
    const weightsGrid = document.createElement('div');
    weightsGrid.className = 'grid-2';

    scale.forEach((label, idx) => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const lbl = document.createElement('label');
      lbl.textContent = `${label}:`;

      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.placeholder = t('weights.weightFor', { label });
      input.dataset.index = idx;
      input.value = Statistics.DEFAULT_WEIGHTS[scaleVal][idx];
      input.required = true;
      input.id = `weight_${idx}`;

      formGroup.appendChild(lbl);
      formGroup.appendChild(input);
      weightsGrid.appendChild(formGroup);
    });

    els.weightInputsContainer.appendChild(weightsGrid);
    els.weightInputsContainer.classList.remove('hidden');
  }

  function _createCountInputs(scale) {
    const t = I18n.t.bind(I18n);

    els.inputsContainer.innerHTML = `<h4 style="color:var(--primary-700);margin-top:0">${Utils.escapeHTML(t('counts.title'))}</h4>`;

    const countsGrid = document.createElement('div');
    countsGrid.className = 'grid-2';

    scale.forEach((label, idx) => {
      const formGroup = document.createElement('div');
      formGroup.className = 'form-group';

      const lbl = document.createElement('label');
      lbl.textContent = `${label}:`;

      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.placeholder = t('counts.countFor', { label });
      input.required = true;
      input.id = `count_${idx}`;
      input.addEventListener('input', _validateCountsSum);

      formGroup.appendChild(lbl);
      formGroup.appendChild(input);
      countsGrid.appendChild(formGroup);
    });

    els.inputsContainer.appendChild(countsGrid);

    // Progress bar
    const progressDiv = document.createElement('div');
    progressDiv.innerHTML = `
      <div style="margin-top:12px;font-size:0.88rem;color:var(--text-secondary);display:flex;gap:4px">
        <span id="countsSum">${Utils.escapeHTML(t('counts.sum', { sum: 0 }))}</span>
        <span id="countsTarget">${Utils.escapeHTML(t('counts.target', { target: 0 }))}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width:0%"></div>
      </div>
    `;
    els.inputsContainer.appendChild(progressDiv);
    els.inputsContainer.classList.remove('hidden');
  }

  function _validateCountsSum() {
    const t = I18n.t.bind(I18n);
    const sampleSize = Utils.safeInt(els.sampleSize.value);
    const countInputs = els.inputsContainer.querySelectorAll('input[type="number"]');
    const counts = Array.from(countInputs).map(inp => Utils.safeInt(inp.value));
    const sum = counts.reduce((a, b) => a + b, 0);

    const sumEl = document.getElementById('countsSum');
    const targetEl = document.getElementById('countsTarget');
    const fillEl = document.getElementById('progressFill');

    if (sumEl) sumEl.textContent = t('counts.sum', { sum });
    if (targetEl) targetEl.textContent = t('counts.target', { target: sampleSize });

    if (fillEl && sampleSize > 0) {
      const pct = Math.min((sum / sampleSize) * 100, 100);
      fillEl.style.width = `${pct}%`;

      if (sum === sampleSize) {
        fillEl.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
      } else if (sum > sampleSize) {
        fillEl.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
      } else {
        fillEl.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
      }
    }
  }

  // ============================================
  // Add / Edit / Delete Question
  // ============================================

  function _onAddQuestion() {
    const t = I18n.t.bind(I18n);
    _hideAllMessages();

    const questionNum = els.questionNumber.value.trim();
    const sampleSize = Utils.safeInt(els.sampleSize.value);
    const scaleVal = els.scaleType.value;

    // Validate
    if (!questionNum) { _showMessage(t('messages.enterQuestionNum'), 'error'); return; }
    if (!sampleSize || sampleSize <= 0) { _showMessage(t('messages.enterSampleSize'), 'error'); return; }
    if (!scaleVal) { _showMessage(t('messages.selectScale'), 'error'); return; }

    const countInputs = els.inputsContainer.querySelectorAll('input[type="number"]');
    const weightInputs = els.weightInputsContainer.querySelectorAll('input[type="number"]');

    // Lock weights on first question
    if (!fixedWeights) {
      fixedWeights = Array.from(weightInputs).map(inp => Utils.safeFloat(inp.value));

      if (fixedWeights.some(isNaN) || fixedWeights.some(w => w === 0)) {
        _showMessage(t('messages.enterWeights'), 'error');
        fixedWeights = null;
        return;
      }

      Array.from(weightInputs).forEach(inp => inp.disabled = true);
      els.sampleSize.disabled = true;
      els.scaleType.disabled = true;
      els.varianceType.disabled = true;

      els.saveDataBtn.classList.remove('hidden');
      els.loadDataBtn.classList.remove('hidden');

      _showMessage(t('messages.weightsLocked'), 'success');
    }

    // Collect counts
    const counts = Array.from(countInputs).map(inp => Utils.safeInt(inp.value));

    if (counts.every(c => c === 0)) {
      _showMessage(t('messages.enterCounts'), 'error');
      return;
    }

    const total = counts.reduce((a, b) => a + b, 0);
    if (total !== sampleSize) {
      _showMessage(
        t('messages.countsMismatch', { total, sample: sampleSize, diff: Math.abs(total - sampleSize) }),
        'error'
      );
      return;
    }

    // Calculate
    const stats = Statistics.calculate(counts, fixedWeights, useSampleVariance);

    const questionData = {
      questionNum: Utils.escapeHTML(questionNum),
      sampleSize,
      scaleVal,
      counts: [...counts],
      stats
    };

    if (editingIndex >= 0) {
      questionsData[editingIndex] = questionData;
      editingIndex = -1;
      Utils.setText(els.btnText, t('buttons.addQuestion'));
      _showMessage(t('messages.questionUpdated'), 'success');
    } else {
      questionsData.push(questionData);
      const nextNum = parseInt(questionNum) + 1;
      if (!isNaN(nextNum)) {
        els.questionNumber.value = nextNum;
      }
      _showMessage(t('messages.questionAdded'), 'success');
    }

    _renderTable();
    _updateSummary();
    _renderCharts();
    _resetInputFields();
    _saveData();
  }

  window.editQuestion = function (index) {
    const t = I18n.t.bind(I18n);
    const data = questionsData[index];
    if (!data) return;

    els.questionNumber.value = data.questionNum;

    const countInputs = els.inputsContainer.querySelectorAll('input[type="number"]');
    data.counts.forEach((count, i) => {
      if (countInputs[i]) countInputs[i].value = count;
    });

    editingIndex = index;
    Utils.setText(els.btnText, t('buttons.updateQuestion'));
    _showMessage(t('messages.editMode'), 'success');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    _validateCountsSum();
  };

  window.deleteQuestion = function (index) {
    const t = I18n.t.bind(I18n);
    if (!questionsData[index]) return;

    if (confirm(t('messages.confirmDelete', { num: questionsData[index].questionNum }))) {
      questionsData.splice(index, 1);
      _renderTable();
      _updateSummary();
      _renderCharts();
      _showMessage(t('messages.questionDeleted'), 'success');

      if (questionsData.length === 0) {
        _resetAll();
      } else {
        _saveData();
      }
    }
  };

  // ============================================
  // Table Rendering
  // ============================================

  function _renderTable() {
    const t = I18n.t.bind(I18n);
    els.resultsBody.innerHTML = '';

    questionsData.forEach((data, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${t('results.questionPrefix')}${Utils.escapeHTML(String(data.questionNum))}</strong></td>
        <td>${Utils.escapeHTML(String(data.sampleSize))}</td>
        <td>${Utils.escapeHTML(String(data.scaleVal))} ${Utils.escapeHTML(t('scale.points'))}</td>
        ${data.counts.map(c => `<td>${Utils.escapeHTML(String(c))}</td>`).join('')}
        <td><strong>${Utils.formatNumber(data.stats.mean)}</strong></td>
        <td>${Utils.formatNumber(data.stats.std)}</td>
        <td>${Utils.formatNumber(data.stats.variance)}</td>
        <td>${Utils.formatNumber(data.stats.cv, 2)}%</td>
        <td>${Utils.formatNumber(data.stats.median)}</td>
        <td class="action-column">
          <div class="action-buttons">
            <button class="btn-edit" onclick="editQuestion(${index})" title="${Utils.escapeHTML(t('results.edit'))}">
              ${Utils.escapeHTML(t('results.edit'))}
            </button>
            <button class="btn-delete" onclick="deleteQuestion(${index})" title="${Utils.escapeHTML(t('results.delete'))}">
              ${Utils.escapeHTML(t('results.delete'))}
            </button>
          </div>
        </td>
      `;
      els.resultsBody.appendChild(row);
    });

    // Summary row
    if (questionsData.length > 0 && fixedWeights) {
      const overallStats = Statistics.calculateOverall(questionsData, fixedWeights, useSampleVariance);
      if (overallStats) {
        const combinedCounts = Statistics.getCombinedCounts(questionsData, fixedWeights.length);
        const summaryRow = document.createElement('tr');
        summaryRow.className = 'summary-row';
        summaryRow.innerHTML = `
          <td colspan="3"><strong>${Utils.escapeHTML(t('results.overallLabel'))}</strong></td>
          ${combinedCounts.map(c => `<td>${Utils.escapeHTML(String(c))}</td>`).join('')}
          <td><strong>${Utils.formatNumber(overallStats.mean)}</strong></td>
          <td><strong>${Utils.formatNumber(overallStats.std)}</strong></td>
          <td><strong>${Utils.formatNumber(overallStats.variance)}</strong></td>
          <td><strong>${Utils.formatNumber(overallStats.cv, 2)}%</strong></td>
          <td><strong>${Utils.formatNumber(overallStats.median)}</strong></td>
          <td class="action-column">-</td>
        `;
        els.resultsBody.appendChild(summaryRow);
      }
    }

    _updateQuestionsCount();
  }

  function _updateQuestionsCount() {
    const t = I18n.t.bind(I18n);
    const count = questionsData.length;
    if (count > 0) {
      els.questionsCount.innerHTML = `
        <span class="badge badge-primary">${Utils.escapeHTML(t('results.questionsCount', { count }))}</span>
        ${fixedWeights ? `<span class="badge badge-primary">${Utils.escapeHTML(t('results.scaleTypeBadge', { type: els.scaleType.value }))}</span>` : ''}
        ${fixedWeights ? `<span class="badge badge-primary">${Utils.escapeHTML(t('results.sampleSizeBadge', { size: els.sampleSize.value }))}</span>` : ''}
      `;
    } else {
      els.questionsCount.innerHTML = '';
    }
  }

  // ============================================
  // Summary & Analysis
  // ============================================

  function _updateSummary() {
    const t = I18n.t.bind(I18n);

    if (questionsData.length === 0) {
      els.summarySection.classList.add('hidden');
      els.chartSection.classList.add('hidden');
      return;
    }

    els.summarySection.classList.remove('hidden');
    els.chartSection.classList.remove('hidden');

    const overallStats = Statistics.calculateOverall(questionsData, fixedWeights, useSampleVariance);
    if (!overallStats) return;

    const means = questionsData.map(q => q.stats.mean);
    const maxMean = Math.max(...means);
    const minMean = Math.min(...means);

    // Summary cards
    const cards = [
      { label: t('summary.totalQuestions'), value: questionsData.length },
      { label: t('summary.overallMean'), value: Utils.formatNumber(overallStats.mean, 2) },
      { label: t('summary.overallStd'), value: Utils.formatNumber(overallStats.std, 2) },
      { label: t('summary.overallVariance'), value: Utils.formatNumber(overallStats.variance, 2) },
      { label: t('summary.overallCV'), value: Utils.formatNumber(overallStats.cv, 2) + '%' },
      { label: t('summary.overallMedian'), value: Utils.formatNumber(overallStats.median, 2) },
      { label: t('summary.maxMean'), value: Utils.formatNumber(maxMean, 2) },
      { label: t('summary.minMean'), value: Utils.formatNumber(minMean, 2) }
    ];

    els.summaryGrid.innerHTML = cards.map(c => `
      <div class="summary-card">
        <h4>${Utils.escapeHTML(c.label)}</h4>
        <div class="value">${Utils.escapeHTML(String(c.value))}</div>
      </div>
    `).join('');

    // Analytical text
    _generateAnalyticalText(overallStats, maxMean, minMean);
  }

  function _generateAnalyticalText(stats, maxMean, minMean) {
    const t = I18n.t.bind(I18n);
    const { mean, std, variance, cv, median } = stats;
    const totalQuestions = questionsData.length;
    const maxWeight = Math.max(...fixedWeights);
    const normalizedMean = (mean / maxWeight) * 100;

    const agreement = Statistics.getAgreementLevel(normalizedMean, t);
    const homogeneity = Statistics.getHomogeneityLevel(std, t);
    const consistency = Statistics.getConsistencyLevel(cv, t);
    const range = maxMean - minMean;
    const rangeDesc = Statistics.getRangeDescription(range, t);

    let conclusionText;
    if (normalizedMean >= 70 && cv < 25) {
      conclusionText = t('analysis.conclusionPositive');
    } else if (normalizedMean >= 60) {
      conclusionText = t('analysis.conclusionNeutral');
    } else {
      conclusionText = t('analysis.conclusionNegative');
    }

    const highCVNote = cv > 30 ? `<br><br><em>${Utils.escapeHTML(t('analysis.highCVNote'))}</em>` : '';

    els.analyticalText.innerHTML = `
      <div class="analytical-text">
        <h3>${Utils.escapeHTML(t('analysis.title'))}</h3>

        <div class="note-box" style="background:var(--success-bg);border-color:var(--success)">
          <strong>${Utils.escapeHTML(t('analysis.methodNote'))}</strong>
          ${Utils.escapeHTML(t('analysis.methodText'))}
        </div>

        <p>
          <strong style="color:var(--primary-700)">${Utils.escapeHTML(t('analysis.sectionOverview'))}</strong><br/>
          ${t('analysis.overviewText', {
      totalQ: totalQuestions,
      mean: Utils.formatNumber(mean, 2),
      maxWeight,
      agreementLevel: agreement.level,
      agreementDesc: agreement.desc
    })}
        </p>

        <p>
          <strong style="color:var(--primary-700)">${Utils.escapeHTML(t('analysis.sectionHomogeneity'))}</strong><br/>
          ${t('analysis.homogeneityText', {
      std: Utils.formatNumber(std, 2),
      homogeneityLevel: homogeneity.level,
      homogeneityDesc: homogeneity.desc,
      variance: Utils.formatNumber(variance, 2)
    })}
        </p>

        <p>
          <strong style="color:var(--primary-700)">${Utils.escapeHTML(t('analysis.sectionConsistency'))}</strong><br/>
          ${t('analysis.consistencyText', {
      cv: Utils.formatNumber(cv, 2),
      consistencyLevel: consistency.level,
      consistencyDesc: consistency.desc
    })}
        </p>

        <p>
          <strong style="color:var(--primary-700)">${Utils.escapeHTML(t('analysis.sectionRange'))}</strong><br/>
          ${t('analysis.rangeText', {
      minMean: Utils.formatNumber(minMean, 2),
      maxMean: Utils.formatNumber(maxMean, 2),
      rangeDesc,
      median: Utils.formatNumber(median, 2)
    })}
        </p>

        <div class="conclusion">
          <strong style="color:var(--primary-700)">${Utils.escapeHTML(t('analysis.conclusion'))}</strong><br/>
          ${conclusionText}
          ${highCVNote}
        </div>
      </div>
    `;
  }

  // ============================================
  // Charts
  // ============================================

  function _renderCharts() {
    if (questionsData.length === 0 || !fixedWeights) return;

    const scaleLabels = I18n.getScaleOptions()[els.scaleType.value] || [];
    const t = I18n.t.bind(I18n);

    Charts.renderBarChart('barChart', questionsData, scaleLabels, t);
    Charts.renderRadarChart('radarChart', questionsData, t);
  }

  // ============================================
  // Messages
  // ============================================

  function _showMessage(message, type = 'success') {
    _hideAllMessages();
    const map = { error: els.errorMessage, success: els.successMessage, warning: els.warningMessage };
    const el = map[type];
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
      if (type === 'success') {
        setTimeout(() => { el.style.display = 'none'; }, 5000);
      }
    }
  }

  function _hideAllMessages() {
    els.errorMessage.style.display = 'none';
    els.successMessage.style.display = 'none';
    els.warningMessage.style.display = 'none';
  }

  // ============================================
  // Reset
  // ============================================

  function _resetInputFields() {
    const countInputs = els.inputsContainer.querySelectorAll('input[type="number"]');
    countInputs.forEach(inp => inp.value = '');
    _validateCountsSum();
  }

  function _onReset() {
    const t = I18n.t.bind(I18n);
    if (questionsData.length > 0) {
      if (!confirm(t('messages.confirmReset'))) return;
    }
    _resetAll();
    _showMessage(t('messages.resetDone'), 'success');
  }

  function _resetAll() {
    fixedWeights = null;
    questionsData = [];
    editingIndex = -1;

    els.sampleSize.disabled = false;
    els.scaleType.disabled = false;
    els.varianceType.disabled = false;
    els.sampleSize.value = '';
    els.scaleType.value = '';
    els.questionNumber.value = '';

    els.weightInputsContainer.innerHTML = '';
    els.inputsContainer.innerHTML = '';
    els.resultsBody.innerHTML = '';
    els.resultsTableHead.innerHTML = '';
    els.summaryGrid.innerHTML = '';
    els.analyticalText.innerHTML = '';

    els.weightInputsContainer.classList.add('hidden');
    els.inputsContainer.classList.add('hidden');
    els.summarySection.classList.add('hidden');
    els.chartSection.classList.add('hidden');
    els.saveDataBtn.classList.add('hidden');
    els.loadDataBtn.classList.add('hidden');

    Utils.setText(els.btnText, I18n.t('buttons.addQuestion'));
    els.scaleType.dataset.currentValue = '';

    _hideAllMessages();
    _updateQuestionsCount();
    Charts.destroyAll();
    Storage.clear();
  }

  // ============================================
  // Save / Load / Import / Export
  // ============================================

  function _saveData() {
    const t = I18n.t.bind(I18n);
    const success = Storage.save({
      questionsData,
      fixedWeights,
      sampleSize: els.sampleSize.value,
      scaleType: els.scaleType.value,
      questionNumber: els.questionNumber.value,
      useSampleVariance
    });
    if (success) {
      _showMessage(t('messages.dataSaved'), 'success');
    } else {
      _showMessage(t('messages.saveError'), 'error');
    }
  }

  function _loadData() {
    const t = I18n.t.bind(I18n);
    const data = Storage.load();

    if (!data) {
      _showMessage(t('messages.noSavedData'), 'warning');
      return;
    }

    if (!confirm(t('messages.confirmLoad'))) return;

    _restoreState(data);
    _showMessage(t('messages.dataLoaded'), 'success');
  }

  function _restoreState(data) {
    questionsData = data.questionsData || [];
    fixedWeights = data.fixedWeights;
    useSampleVariance = data.useSampleVariance !== undefined ? data.useSampleVariance : true;

    els.sampleSize.value = data.sampleSize || '';
    els.scaleType.value = data.scaleType || '';
    els.questionNumber.value = data.questionNumber || '';
    els.varianceType.value = useSampleVariance ? 'sample' : 'population';

    if (fixedWeights) {
      els.sampleSize.disabled = true;
      els.scaleType.disabled = true;
      els.varianceType.disabled = true;
      els.saveDataBtn.classList.remove('hidden');
      els.loadDataBtn.classList.remove('hidden');
    }

    if (data.scaleType) {
      const scale = I18n.getScaleOptions()[data.scaleType];
      if (scale) {
        _updateTableHeaders();
        _createWeightInputs(scale, data.scaleType);
        _createCountInputs(scale);
        if (fixedWeights) {
          els.weightInputsContainer.querySelectorAll('input[type="number"]').forEach((inp, i) => {
            if (fixedWeights[i] !== undefined) inp.value = fixedWeights[i];
            inp.disabled = true;
          });
        }
      }
    }

    _renderTable();
    _updateSummary();
    _renderCharts();
    _updateQuestionsCount();
  }

  function _exportWord() {
    const t = I18n.t.bind(I18n);
    if (questionsData.length === 0) { _showMessage(t('messages.noDataExport'), 'warning'); return; }
    Export.toWord(els.resultsTable, els.analyticalText, t, I18n.isRTL());
    _showMessage(t('messages.exportSuccess'), 'success');
  }

  function _exportCSV() {
    const t = I18n.t.bind(I18n);
    if (questionsData.length === 0) { _showMessage(t('messages.noDataExport'), 'warning'); return; }
    const scaleLabels = I18n.getScaleOptions()[els.scaleType.value] || [];
    Export.toCSV(questionsData, scaleLabels, t);
    _showMessage(t('messages.exportSuccess'), 'success');
  }

  function _exportJSON() {
    const t = I18n.t.bind(I18n);
    if (questionsData.length === 0) { _showMessage(t('messages.noDataExport'), 'warning'); return; }
    Export.toJSON({
      questionsData,
      fixedWeights,
      sampleSize: els.sampleSize.value,
      scaleType: els.scaleType.value,
      useSampleVariance
    }, t);
    _showMessage(t('messages.exportSuccess'), 'success');
  }

  async function _importJSON() {
    const t = I18n.t.bind(I18n);
    try {
      const file = await Utils.pickFile('.json');
      if (!file) return;

      const text = await Utils.readFileAsText(file);
      const data = Storage.importJSON(text);

      if (!data) {
        _showMessage(t('messages.importError'), 'error');
        return;
      }

      _restoreState(data);
      _showMessage(t('messages.importSuccess', { count: data.questionsData.length }), 'success');
    } catch {
      _showMessage(t('messages.importError'), 'error');
    }
  }

  // ============================================
  // Public API
  // ============================================

  return { init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
