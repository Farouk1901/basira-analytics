/**
 * Basira Analytics — Variable View
 * SPSS-style editable Variable View spreadsheet.
 * Allows defining variables: Name, Type, Width, Decimals, Label, Values, Missing, Columns, Align, Measure, Role.
 */
'use strict';

const VariableView = (() => {
  const M = SPSSDataModel;
  let _container = null;
  let _activeCell = null;
  let _valuesModal = null;

  const _lang = () => (typeof I18n !== 'undefined' ? I18n.getLang() : 'ar');

  const _t = {
    ar: {
      title: '📋 عرض المتغيرات (Variable View)',
      subtitle: 'عرّف متغيرات الاستبيان — اسم المتغير، النوع، التسمية، قيم ليكرت، ومستوى القياس',
      addVar: '➕ إضافة متغير',
      addBatch: '➕ إضافة 10 متغيرات',
      removeVar: '🗑️ حذف',
      clearAll: '🗑️ مسح الكل',
      applyPreset: '⚡ تطبيق مقياس ليكرت',
      preset_binary: 'ثنائي (2 نقاط)',
      preset_likert3: '3 نقاط',
      preset_likert4: '4 نقاط',
      preset_likert5: '5 نقاط (ليكرت الخماسي)',
      preset_likert7: '7 نقاط',
      valuesTitle: '⚙️ تعريف قيم المتغير',
      valValue: 'القيمة',
      valLabel: 'التسمية',
      valAdd: '➕ إضافة قيمة',
      valSave: '💾 حفظ',
      valCancel: '❌ إلغاء',
      colName: 'الاسم', colType: 'النوع', colWidth: 'العرض', colDecimals: 'الكسور',
      colLabel: 'التسمية (السؤال)', colValues: 'القيم', colMissing: 'المفقودة',
      colColumns: 'الأعمدة', colAlign: 'المحاذاة', colMeasure: 'المقياس', colRole: 'الدور',
      measureScale: '📏 مقياس', measureOrdinal: '📊 ترتيبي', measureNominal: '🏷️ اسمي',
      noVars: 'لا توجد متغيرات. انقر "إضافة متغير" للبدء.',
      confirmClear: 'هل أنت متأكد من مسح جميع المتغيرات؟'
    },
    en: {
      title: '📋 Variable View',
      subtitle: 'Define questionnaire variables — name, type, label, Likert values, and measurement level',
      addVar: '➕ Add Variable',
      addBatch: '➕ Add 10 Variables',
      removeVar: '🗑️ Delete',
      clearAll: '🗑️ Clear All',
      applyPreset: '⚡ Apply Likert Scale',
      preset_binary: 'Binary (2 points)',
      preset_likert3: '3-point',
      preset_likert4: '4-point',
      preset_likert5: '5-point (Likert)',
      preset_likert7: '7-point',
      valuesTitle: '⚙️ Define Variable Values',
      valValue: 'Value',
      valLabel: 'Label',
      valAdd: '➕ Add Value',
      valSave: '💾 Save',
      valCancel: '❌ Cancel',
      colName: 'Name', colType: 'Type', colWidth: 'Width', colDecimals: 'Decimals',
      colLabel: 'Label (Question)', colValues: 'Values', colMissing: 'Missing',
      colColumns: 'Columns', colAlign: 'Align', colMeasure: 'Measure', colRole: 'Role',
      measureScale: '📏 Scale', measureOrdinal: '📊 Ordinal', measureNominal: '🏷️ Nominal',
      noVars: 'No variables defined. Click "Add Variable" to start.',
      confirmClear: 'Are you sure you want to clear all variables?'
    }
  };

  function t(key) {
    const lang = _lang();
    return (_t[lang] && _t[lang][key]) || (_t.en[key]) || key;
  }

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  function render(containerId) {
    _container = document.getElementById(containerId);
    if (!_container) return;

    const vars = M.getVariables();

    let html = `
      <div class="vv-toolbar">
        <button class="btn btn-primary" onclick="VariableView.addVariable()"><span>${t('addVar')}</span></button>
        <button class="btn btn-secondary" onclick="VariableView.addBatch()"><span>${t('addBatch')}</span></button>
        <div class="vv-preset-group">
          <select id="vvPresetSelect" class="vv-select">
            <option value="">${t('applyPreset')}</option>
            <option value="binary">${t('preset_binary')}</option>
            <option value="likert3">${t('preset_likert3')}</option>
            <option value="likert4">${t('preset_likert4')}</option>
            <option value="likert5">${t('preset_likert5')}</option>
            <option value="likert7">${t('preset_likert7')}</option>
          </select>
          <button class="btn btn-accent" onclick="VariableView.applyPreset()">⚡</button>
        </div>
        <button class="btn btn-danger" onclick="VariableView.clearAll()" style="margin-inline-start:auto">${t('clearAll')}</button>
      </div>`;

    if (vars.length === 0) {
      html += `<div class="vv-empty">${t('noVars')}</div>`;
    } else {
      html += `<div class="vv-table-wrap"><table class="vv-table">
        <thead><tr>
          <th class="vv-row-num">#</th>
          <th>${t('colName')}</th>
          <th>${t('colType')}</th>
          <th>${t('colWidth')}</th>
          <th>${t('colDecimals')}</th>
          <th class="vv-col-label">${t('colLabel')}</th>
          <th>${t('colValues')}</th>
          <th>${t('colMissing')}</th>
          <th>${t('colColumns')}</th>
          <th>${t('colAlign')}</th>
          <th>${t('colMeasure')}</th>
          <th>${t('colRole')}</th>
          <th></th>
        </tr></thead>
        <tbody>`;

      vars.forEach((v, i) => {
        const measureIcon = v.measure === 'Scale' ? '📏' : v.measure === 'Ordinal' ? '📊' : '🏷️';
        const valCount = Object.keys(v.values).length;
        const valSummary = valCount > 0
          ? `{${Object.entries(v.values).slice(0, 2).map(([k,l]) => `${k}, ${l}`).join('; ')}${valCount > 2 ? '...' : ''}}`
          : 'None';

        html += `<tr data-idx="${i}">
          <td class="vv-row-num">${i + 1}</td>
          <td><input type="text" class="vv-input vv-name" value="${Utils.escapeHTML(v.name)}" onchange="VariableView.updateField(${i},'name',this.value)" /></td>
          <td><select class="vv-select" onchange="VariableView.updateField(${i},'type',this.value)">
            ${M.VARIABLE_TYPES.map(vt => `<option value="${vt}" ${vt === v.type ? 'selected' : ''}>${vt}</option>`).join('')}
          </select></td>
          <td><input type="number" class="vv-input vv-narrow" value="${v.width}" min="1" max="40" onchange="VariableView.updateField(${i},'width',parseInt(this.value))" /></td>
          <td><input type="number" class="vv-input vv-narrow" value="${v.decimals}" min="0" max="16" onchange="VariableView.updateField(${i},'decimals',parseInt(this.value))" /></td>
          <td><input type="text" class="vv-input vv-label" value="${Utils.escapeHTML(v.label)}" onchange="VariableView.updateField(${i},'label',this.value)" placeholder="..." /></td>
          <td><button class="btn btn-mini btn-outline" onclick="VariableView.openValuesDialog(${i})">${Utils.escapeHTML(valSummary)}</button></td>
          <td><input type="text" class="vv-input vv-narrow" value="${Utils.escapeHTML(v.missing)}" onchange="VariableView.updateField(${i},'missing',this.value)" /></td>
          <td><input type="number" class="vv-input vv-narrow" value="${v.columns}" min="1" max="40" onchange="VariableView.updateField(${i},'columns',parseInt(this.value))" /></td>
          <td><select class="vv-select vv-narrow" onchange="VariableView.updateField(${i},'align',this.value)">
            ${M.ALIGN_TYPES.map(a => `<option value="${a}" ${a === v.align ? 'selected' : ''}>${a}</option>`).join('')}
          </select></td>
          <td><select class="vv-select" onchange="VariableView.updateField(${i},'measure',this.value)">
            ${M.MEASURE_TYPES.map(m => `<option value="${m}" ${m === v.measure ? 'selected' : ''}>${measureIcon} ${m}</option>`).join('')}
          </select></td>
          <td><select class="vv-select vv-narrow" onchange="VariableView.updateField(${i},'role',this.value)">
            ${M.ROLE_TYPES.map(r => `<option value="${r}" ${r === v.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select></td>
          <td><button class="btn btn-mini btn-danger" onclick="VariableView.removeVariable(${i})">🗑️</button></td>
        </tr>`;
      });

      html += '</tbody></table></div>';
    }

    // Values dialog (hidden)
    html += `<div id="vvValuesModal" class="vv-modal" style="display:none">
      <div class="vv-modal-content">
        <h3>${t('valuesTitle')}</h3>
        <div id="vvValuesBody"></div>
        <div class="vv-modal-actions">
          <button class="btn btn-primary" onclick="VariableView.saveValues()">${t('valSave')}</button>
          <button class="btn btn-secondary" onclick="VariableView.closeValuesDialog()">${t('valCancel')}</button>
        </div>
      </div>
    </div>`;

    _container.innerHTML = html;
  }

  // ──────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────
  function addVariable() {
    M.addVariable();
    render(_container.id);
  }

  function addBatch() {
    M.addVariables(10);
    render(_container.id);
  }

  function removeVariable(idx) {
    M.removeVariable(idx);
    render(_container.id);
  }

  function updateField(idx, field, value) {
    M.updateVariable(idx, field, value);
    // Don't re-render for simple text changes (it would lose focus)
  }

  function clearAll() {
    if (!confirm(t('confirmClear'))) return;
    M.clear();
    render(_container.id);
  }

  function applyPreset() {
    const select = document.getElementById('vvPresetSelect');
    const preset = select.value;
    if (!preset) return;

    const vars = M.getVariables();
    if (vars.length === 0) {
      alert(_lang() === 'ar' ? 'أضف متغيرات أولاً' : 'Add variables first');
      return;
    }

    const indices = vars.map((_, i) => i);
    M.applyLikertPreset(preset, indices);
    render(_container.id);
  }

  // ──────────────────────────────────────────────
  // Values Dialog
  // ──────────────────────────────────────────────
  let _editingVarIdx = -1;

  function openValuesDialog(idx) {
    _editingVarIdx = idx;
    const v = M.getVariable(idx);
    if (!v) return;

    const modal = document.getElementById('vvValuesModal');
    const body = document.getElementById('vvValuesBody');

    let html = `<div class="vv-values-list">`;
    const entries = Object.entries(v.values);

    if (entries.length === 0) {
      // Add a few empty rows to start
      for (let i = 1; i <= 5; i++) {
        html += _valueRow(i, '');
      }
    } else {
      entries.forEach(([key, label]) => {
        html += _valueRow(key, label);
      });
    }
    html += `</div>
      <button class="btn btn-mini btn-secondary" onclick="VariableView.addValueRow()" style="margin-top:8px">${t('valAdd')}</button>`;

    body.innerHTML = html;
    modal.style.display = 'flex';
  }

  function _valueRow(key, label) {
    return `<div class="vv-value-row">
      <input type="number" class="vv-input vv-narrow vv-val-key" value="${key}" min="0" />
      <span class="vv-value-eq">=</span>
      <input type="text" class="vv-input vv-val-label" value="${Utils.escapeHTML(label)}" placeholder="..." />
      <button class="btn btn-mini btn-danger" onclick="this.parentElement.remove()">✕</button>
    </div>`;
  }

  function addValueRow() {
    const list = document.querySelector('.vv-values-list');
    if (!list) return;
    const rows = list.querySelectorAll('.vv-value-row');
    const nextKey = rows.length + 1;
    list.insertAdjacentHTML('beforeend', _valueRow(nextKey, ''));
  }

  function saveValues() {
    if (_editingVarIdx < 0) return;
    const rows = document.querySelectorAll('.vv-value-row');
    const values = {};
    rows.forEach(row => {
      const key = row.querySelector('.vv-val-key').value;
      const label = row.querySelector('.vv-val-label').value.trim();
      if (key !== '' && label !== '') {
        values[key] = label;
      }
    });
    M.updateVariable(_editingVarIdx, 'values', values);
    closeValuesDialog();
    render(_container.id);
  }

  function closeValuesDialog() {
    const modal = document.getElementById('vvValuesModal');
    if (modal) modal.style.display = 'none';
    _editingVarIdx = -1;
  }

  // ──────────────────────────────────────────────
  return {
    render, addVariable, addBatch, removeVariable, updateField,
    clearAll, applyPreset,
    openValuesDialog, addValueRow, saveValues, closeValuesDialog
  };
})();
