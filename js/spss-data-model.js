/**
 * Basira Analytics — SPSS Data Model
 * Core data model mirroring SPSS Variable View + Data View structure.
 * Manages variable definitions and case (respondent) data entirely client-side.
 */
'use strict';

const SPSSDataModel = (() => {
  // ──────────────────────────────────────────────
  // Default constants
  // ──────────────────────────────────────────────
  const VARIABLE_TYPES = ['Numeric', 'Comma', 'Dot', 'Scientific notation', 'Date', 'Dollar', 'Custom currency', 'String', 'Restricted Numeric'];
  const MEASURE_TYPES  = ['Scale', 'Ordinal', 'Nominal'];
  const ROLE_TYPES     = ['Input', 'Target', 'Both', 'None', 'Partition', 'Split'];
  const ALIGN_TYPES    = ['Right', 'Left', 'Center'];

  const LIKERT_PRESETS = {
    binary: { points: 2, labels: { 1: 'موافق / Agree', 2: 'لا أوافق / Disagree' } },
    likert3: { points: 3, labels: { 1: 'موافق / Agree', 2: 'محايد / Neutral', 3: 'لا أوافق / Disagree' } },
    likert4: { points: 4, labels: { 1: 'موافق بشدة / Strongly Agree', 2: 'موافق / Agree', 3: 'لا أوافق / Disagree', 4: 'لا أوافق بشدة / Strongly Disagree' } },
    likert5: { points: 5, labels: { 1: 'موافق بشدة / Strongly Agree', 2: 'موافق / Agree', 3: 'محايد / Neutral', 4: 'لا أوافق / Disagree', 5: 'لا أوافق بشدة / Strongly Disagree' } },
    likert7: { points: 7, labels: { 1: 'موافق بشدة جداً', 2: 'موافق بشدة', 3: 'موافق', 4: 'محايد', 5: 'لا أوافق', 6: 'لا أوافق بشدة', 7: 'لا أوافق بشدة جداً' } }
  };

  // ──────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────
  let _variables = [];   // Array<VariableDef>
  let _cases     = [];   // Array<Array<number|string|null>> — [row][col]
  let _sampleSize = 100; // Default respondent count
  let _axes      = [];   // Array<{ name, nameAr, variableIndices[] }>

  // ──────────────────────────────────────────────
  // Variable Definition Factory
  // ──────────────────────────────────────────────
  function createVariable(overrides = {}) {
    return {
      name:     overrides.name     || `V${_variables.length + 1}`,
      type:     overrides.type     || 'Numeric',
      width:    overrides.width    ?? 8,
      decimals: overrides.decimals ?? 0,
      label:    overrides.label    || '',
      values:   overrides.values   || {},  // { 1: 'label', 2: 'label', ... }
      missing:  overrides.missing  || 'None',
      columns:  overrides.columns  ?? 8,
      align:    overrides.align    || 'Right',
      measure:  overrides.measure  || 'Nominal',
      role:     overrides.role     || 'Input'
    };
  }

  // ──────────────────────────────────────────────
  // Variable CRUD
  // ──────────────────────────────────────────────
  function addVariable(def = {}) {
    const v = createVariable(def);
    _variables.push(v);
    // Extend all existing cases with null for the new variable
    _cases.forEach(row => row.push(null));
    return _variables.length - 1;
  }

  function addVariables(count, defaults = {}) {
    const startIdx = _variables.length;
    for (let i = 0; i < count; i++) {
      addVariable({ ...defaults, name: defaults.namePrefix ? `${defaults.namePrefix}${startIdx + i + 1}` : `V${startIdx + i + 1}` });
    }
    return startIdx;
  }

  function removeVariable(index) {
    if (index < 0 || index >= _variables.length) return false;
    _variables.splice(index, 1);
    _cases.forEach(row => row.splice(index, 1));
    // Update axis indices
    _axes.forEach(axis => {
      axis.variableIndices = axis.variableIndices
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i);
    });
    return true;
  }

  function updateVariable(index, field, value) {
    if (index < 0 || index >= _variables.length) return false;
    if (_variables[index].hasOwnProperty(field)) {
      _variables[index][field] = value;
      return true;
    }
    return false;
  }

  function getVariable(index) {
    return _variables[index] || null;
  }

  function getVariables() {
    return _variables;
  }

  function getVariableCount() {
    return _variables.length;
  }

  // ──────────────────────────────────────────────
  // Case (Respondent) Data
  // ──────────────────────────────────────────────
  function setSampleSize(n) {
    n = Math.max(1, Math.min(1000, parseInt(n) || 100));
    _sampleSize = n;
    // Resize cases array
    while (_cases.length < n) {
      _cases.push(new Array(_variables.length).fill(null));
    }
    if (_cases.length > n) {
      _cases.length = n;
    }
  }

  function getSampleSize() {
    return _sampleSize;
  }

  function setCellValue(rowIdx, colIdx, value) {
    if (rowIdx < 0 || rowIdx >= _cases.length) return false;
    if (colIdx < 0 || colIdx >= _variables.length) return false;

    const v = _variables[colIdx];

    // Validate based on type
    if (v.type === 'Numeric' || v.type === 'Comma' || v.type === 'Dot' || v.type === 'Scientific notation' || v.type === 'Restricted Numeric') {
      if (value === null || value === '' || value === undefined) {
        _cases[rowIdx][colIdx] = null;
        return true;
      }
      const num = parseFloat(value);
      if (!Number.isFinite(num)) return false;
      _cases[rowIdx][colIdx] = num;
    } else if (v.type === 'String') {
      _cases[rowIdx][colIdx] = value === null ? null : String(value);
    } else {
      _cases[rowIdx][colIdx] = value;
    }
    return true;
  }

  function getCellValue(rowIdx, colIdx) {
    if (rowIdx < 0 || rowIdx >= _cases.length) return null;
    if (colIdx < 0 || colIdx >= _variables.length) return null;
    return _cases[rowIdx][colIdx];
  }

  function getRow(rowIdx) {
    return _cases[rowIdx] || null;
  }

  function getColumn(colIdx) {
    if (colIdx < 0 || colIdx >= _variables.length) return [];
    return _cases.map(row => row[colIdx]);
  }

  function getValidColumn(colIdx) {
    return getColumn(colIdx).filter(v => v !== null && v !== undefined && v !== '');
  }

  function getCases() {
    return _cases;
  }

  // ──────────────────────────────────────────────
  // Axis (محور) Management
  // ──────────────────────────────────────────────
  function addAxis(name, nameAr, variableIndices = []) {
    const axis = { name, nameAr, variableIndices: [...variableIndices] };
    _axes.push(axis);
    return _axes.length - 1;
  }

  function removeAxis(index) {
    if (index < 0 || index >= _axes.length) return false;
    _axes.splice(index, 1);
    return true;
  }

  function updateAxis(index, updates) {
    if (index < 0 || index >= _axes.length) return false;
    Object.assign(_axes[index], updates);
    return true;
  }

  function getAxes() {
    return _axes;
  }

  function getAxisData(axisIndex) {
    const axis = _axes[axisIndex];
    if (!axis) return null;

    return {
      ...axis,
      variables: axis.variableIndices.map(i => ({
        index: i,
        variable: _variables[i],
        data: getValidColumn(i)
      }))
    };
  }

  // ──────────────────────────────────────────────
  // Import / Export
  // ──────────────────────────────────────────────
  function exportDataset() {
    return {
      version: 2,
      tool: 'Basira Analytics (بصيرة)',
      exportedAt: new Date().toISOString(),
      sampleSize: _sampleSize,
      variables: JSON.parse(JSON.stringify(_variables)),
      cases: JSON.parse(JSON.stringify(_cases)),
      axes: JSON.parse(JSON.stringify(_axes))
    };
  }

  function importDataset(data) {
    if (!data || !data.variables) return false;
    _variables = data.variables.map(v => createVariable(v));
    _sampleSize = data.sampleSize || 100;
    _cases = data.cases || [];
    _axes = data.axes || [];
    // Ensure cases match dimensions
    setSampleSize(_sampleSize);
    _cases.forEach(row => {
      while (row.length < _variables.length) row.push(null);
      if (row.length > _variables.length) row.length = _variables.length;
    });
    return true;
  }

  function clear() {
    _variables = [];
    _cases = [];
    _axes = [];
    _sampleSize = 100;
  }

  // ──────────────────────────────────────────────
  // Likert Preset Loader
  // ──────────────────────────────────────────────
  function applyLikertPreset(presetKey, variableIndices) {
    const preset = LIKERT_PRESETS[presetKey];
    if (!preset) return false;
    variableIndices.forEach(idx => {
      if (_variables[idx]) {
        _variables[idx].values = { ...preset.labels };
        _variables[idx].type = 'Numeric';
        _variables[idx].measure = preset.points <= 2 ? 'Nominal' : 'Ordinal';
      }
    });
    return true;
  }

  // ──────────────────────────────────────────────
  // Statistics Helpers
  // ──────────────────────────────────────────────
  function getFrequencyTable(colIdx) {
    const variable = _variables[colIdx];
    if (!variable) return null;

    const allValues = getColumn(colIdx);
    const total = allValues.length;
    const validValues = allValues.filter(v => v !== null && v !== undefined && v !== '');
    const validCount = validValues.length;
    const missingCount = total - validCount;

    // Count frequencies
    const freq = {};
    validValues.forEach(v => {
      const key = String(v);
      freq[key] = (freq[key] || 0) + 1;
    });

    // Sort by value (numeric)
    const sortedKeys = Object.keys(freq).sort((a, b) => {
      const na = parseFloat(a), nb = parseFloat(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });

    // Build table rows
    let cumPercent = 0;
    const rows = sortedKeys.map(key => {
      const count = freq[key];
      const percent = (count / total) * 100;
      const validPercent = (count / validCount) * 100;
      cumPercent += validPercent;
      return {
        value: key,
        valueLabel: variable.values[key] || variable.values[parseInt(key)] || key,
        frequency: count,
        percent: percent,
        validPercent: validPercent,
        cumulativePercent: cumPercent
      };
    });

    return {
      variableName: variable.name,
      variableLabel: variable.label,
      total,
      validCount,
      missingCount,
      rows
    };
  }

  function getDescriptiveStats(colIdx) {
    const data = getValidColumn(colIdx).map(Number).filter(Number.isFinite);
    if (data.length === 0) return null;

    const n = data.length;
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sorted = [...data].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];

    // Mode
    const freqMap = {};
    data.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freqMap));
    const modes = Object.keys(freqMap).filter(k => freqMap[k] === maxFreq).map(Number);

    // Variance & StdDev
    const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    // Skewness & Kurtosis
    const m3 = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 3, 0) / n;
    const m4 = data.reduce((s, v) => s + ((v - mean) / stdDev) ** 4, 0) / n - 3;

    return {
      n, sum, mean, median, mode: modes.length === n ? null : modes,
      variance, stdDev, se: stdDev / Math.sqrt(n),
      min: sorted[0], max: sorted[n - 1], range: sorted[n - 1] - sorted[0],
      skewness: n > 2 ? m3 : null,
      kurtosis: n > 3 ? m4 : null,
      q1: sorted[Math.floor(n * 0.25)],
      q3: sorted[Math.floor(n * 0.75)]
    };
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────
  return {
    // Constants
    VARIABLE_TYPES, MEASURE_TYPES, ROLE_TYPES, ALIGN_TYPES, LIKERT_PRESETS,

    // Variable management
    createVariable, addVariable, addVariables, removeVariable,
    updateVariable, getVariable, getVariables, getVariableCount,

    // Case management
    setSampleSize, getSampleSize,
    setCellValue, getCellValue, getRow, getColumn, getValidColumn, getCases,

    // Axis management
    addAxis, removeAxis, updateAxis, getAxes, getAxisData,

    // Import/Export
    exportDataset, importDataset, clear,

    // Presets
    applyLikertPreset,

    // Statistics
    getFrequencyTable, getDescriptiveStats
  };
})();
