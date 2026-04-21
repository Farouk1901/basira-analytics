/**
 * Basira Analytics — Data View
 * SPSS-style data entry grid: respondents (rows) × variables (columns).
 * Supports numeric entry, dropdown value labels, keyboard navigation, and CSV import.
 */
'use strict';

const DataView_ = (() => {  // Using DataView_ to avoid conflict with built-in DataView
  const M = SPSSDataModel;
  let _container = null;
  let _activeRow = 0;
  let _activeCol = 0;
  let _viewStart = 0;
  const PAGE_SIZE = 25; // Rows visible at a time

  const _lang = () => (typeof I18n !== 'undefined' ? I18n.getLang() : 'ar');

  const _t = {
    ar: {
      title: '📝 عرض البيانات (Data View)',
      subtitle: 'أدخل استجابات أفراد العينة — كل صف يمثل مستجيب وكل عمود يمثل متغير (سؤال)',
      sampleSize: 'حجم العينة:',
      applySS: 'تطبيق',
      showLabels: 'عرض التسميات',
      showValues: 'عرض القيم',
      importCSV: '📂 استيراد CSV',
      exportCSV: '📊 تصدير البيانات CSV',
      clearData: '🗑️ مسح البيانات',
      noVars: '⚠️ لم يتم تعريف متغيرات. انتقل إلى "عرض المتغيرات" أولاً.',
      respondent: 'المستجيب',
      filled: 'مكتمل',
      empty: 'فارغ',
      confirmClear: 'هل أنت متأكد من مسح جميع البيانات؟',
      prev: '⬆️ السابق',
      next: '⬇️ التالي',
      page: 'الصفحة',
      of: 'من',
      fillRandom: '🎲 تعبئة عشوائية (تجريبي)',
      stats: 'الإحصائيات'
    },
    en: {
      title: '📝 Data View',
      subtitle: 'Enter respondent data — each row is a respondent, each column is a variable (question)',
      sampleSize: 'Sample Size:',
      applySS: 'Apply',
      showLabels: 'Show Labels',
      showValues: 'Show Values',
      importCSV: '📂 Import CSV',
      exportCSV: '📊 Export Data CSV',
      clearData: '🗑️ Clear Data',
      noVars: '⚠️ No variables defined. Go to "Variable View" first.',
      respondent: 'Respondent',
      filled: 'Filled',
      empty: 'Empty',
      confirmClear: 'Are you sure you want to clear all data?',
      prev: '⬆️ Previous',
      next: '⬇️ Next',
      page: 'Page',
      of: 'of',
      fillRandom: '🎲 Fill Random (Demo)',
      stats: 'Statistics'
    }
  };

  function t(key) {
    const lang = _lang();
    return (_t[lang] && _t[lang][key]) || (_t.en[key]) || key;
  }

  let _showLabels = false;

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────
  function render(containerId) {
    _container = document.getElementById(containerId);
    if (!_container) return;

    const vars = M.getVariables();
    const ss = M.getSampleSize();

    // Toolbar
    let html = `<div class="dv-toolbar">
      <div class="dv-ss-group">
        <label>${t('sampleSize')}</label>
        <input type="number" id="dvSampleSize" value="${ss}" min="1" max="1000" class="vv-input vv-narrow" />
        <button class="btn btn-primary btn-mini" onclick="DataView_.applySampleSize()">${t('applySS')}</button>
      </div>
      <button class="btn btn-mini ${_showLabels ? 'btn-accent' : 'btn-secondary'}" onclick="DataView_.toggleLabels()">
        ${_showLabels ? t('showValues') : t('showLabels')}
      </button>
      <button class="btn btn-mini btn-secondary" onclick="DataView_.fillRandom()">${t('fillRandom')}</button>
      <button class="btn btn-mini btn-secondary" onclick="DataView_.importCSV()">${t('importCSV')}</button>
      <button class="btn btn-mini btn-accent" onclick="DataView_.exportCSV()">${t('exportCSV')}</button>
      <button class="btn btn-mini btn-danger" onclick="DataView_.clearData()" style="margin-inline-start:auto">${t('clearData')}</button>
    </div>`;

    if (vars.length === 0) {
      html += `<div class="dv-empty">${t('noVars')}</div>`;
      _container.innerHTML = html;
      return;
    }

    // Pagination
    const totalPages = Math.ceil(ss / PAGE_SIZE);
    const currentPage = Math.floor(_viewStart / PAGE_SIZE) + 1;
    const rowStart = _viewStart;
    const rowEnd = Math.min(_viewStart + PAGE_SIZE, ss);

    // Progress indicator
    const cases = M.getCases();
    let filledCells = 0, totalCells = ss * vars.length;
    cases.forEach(row => row.forEach(v => { if (v !== null && v !== undefined && v !== '') filledCells++; }));
    const progress = totalCells > 0 ? ((filledCells / totalCells) * 100).toFixed(1) : 0;

    html += `<div class="dv-progress-bar">
      <div class="dv-progress-fill" style="width:${progress}%"></div>
      <span class="dv-progress-text">${t('filled')}: ${filledCells}/${totalCells} (${progress}%)</span>
    </div>`;

    // Data table
    html += `<div class="dv-table-wrap"><table class="dv-table" id="dvTable">
      <thead><tr>
        <th class="dv-row-num">#</th>`;

    // Column headers
    vars.forEach((v, ci) => {
      const tooltip = v.label ? Utils.escapeHTML(v.label) : '';
      html += `<th class="dv-col-header" title="${tooltip}">${Utils.escapeHTML(v.name)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    // Data rows (only visible page)
    for (let ri = rowStart; ri < rowEnd; ri++) {
      html += `<tr>`;
      html += `<td class="dv-row-num">${ri + 1}</td>`;

      vars.forEach((v, ci) => {
        const val = M.getCellValue(ri, ci);
        const isActive = (ri === _activeRow && ci === _activeCol);
        const cellClass = `dv-cell ${isActive ? 'dv-cell-active' : ''} ${val === null || val === undefined || val === '' ? 'dv-cell-empty' : ''}`;
        const hasValues = Object.keys(v.values).length > 0;

        let cellContent = '';
        if (hasValues && _showLabels && val !== null && val !== undefined && val !== '') {
          cellContent = v.values[val] || v.values[String(val)] || String(val);
        } else {
          cellContent = val !== null && val !== undefined && val !== '' ? String(val) : '';
        }

        html += `<td class="${cellClass}" 
          data-row="${ri}" data-col="${ci}"
          onclick="DataView_.focusCell(${ri},${ci})"
          >${hasValues && !_showLabels
            ? `<input type="number" class="dv-cell-input" value="${cellContent}" 
                min="1" max="${Math.max(...Object.keys(v.values).map(Number).filter(Number.isFinite), 99)}"
                data-row="${ri}" data-col="${ci}"
                onfocus="DataView_.focusCell(${ri},${ci})"
                onchange="DataView_.onCellChange(${ri},${ci},this.value)"
                onkeydown="DataView_.onCellKeydown(event,${ri},${ci})" />`
            : `<input type="text" class="dv-cell-input" value="${Utils.escapeHTML(cellContent)}"
                data-row="${ri}" data-col="${ci}"
                onfocus="DataView_.focusCell(${ri},${ci})"
                onchange="DataView_.onCellChange(${ri},${ci},this.value)"
                onkeydown="DataView_.onCellKeydown(event,${ri},${ci})" />`
          }</td>`;
      });
      html += `</tr>`;
    }

    html += `</tbody></table></div>`;

    // Pagination controls
    html += `<div class="dv-pagination">
      <button class="btn btn-mini btn-secondary" onclick="DataView_.prevPage()" ${currentPage <= 1 ? 'disabled' : ''}>${t('prev')}</button>
      <span class="dv-page-info">${t('page')} ${currentPage} ${t('of')} ${totalPages}</span>
      <button class="btn btn-mini btn-secondary" onclick="DataView_.nextPage()" ${currentPage >= totalPages ? 'disabled' : ''}>${t('next')}</button>
    </div>`;

    _container.innerHTML = html;
  }

  // ──────────────────────────────────────────────
  // Cell Interaction
  // ──────────────────────────────────────────────
  function focusCell(row, col) {
    _activeRow = row;
    _activeCol = col;
  }

  function onCellChange(row, col, value) {
    M.setCellValue(row, col, value === '' ? null : value);
    // Update progress bar without full re-render
    _updateProgressBar();
  }

  function onCellKeydown(e, row, col) {
    const vars = M.getVariables();
    const ss = M.getSampleSize();
    let newRow = row, newCol = col;

    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        newCol--;
        if (newCol < 0) { newCol = vars.length - 1; newRow--; }
      } else {
        newCol++;
        if (newCol >= vars.length) { newCol = 0; newRow++; }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      newRow++;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      newRow--;
    } else if (e.key === 'ArrowRight') {
      if (e.target.selectionStart === e.target.value.length || e.target.type === 'number') {
        e.preventDefault();
        newCol += (_lang() === 'ar' ? -1 : 1);
      } else return;
    } else if (e.key === 'ArrowLeft') {
      if (e.target.selectionStart === 0 || e.target.type === 'number') {
        e.preventDefault();
        newCol += (_lang() === 'ar' ? 1 : -1);
      } else return;
    } else {
      return;
    }

    // Clamp
    newRow = Math.max(0, Math.min(ss - 1, newRow));
    newCol = Math.max(0, Math.min(vars.length - 1, newCol));

    // Check if we need to change page
    if (newRow < _viewStart || newRow >= _viewStart + PAGE_SIZE) {
      _viewStart = Math.floor(newRow / PAGE_SIZE) * PAGE_SIZE;
      _activeRow = newRow;
      _activeCol = newCol;
      render(_container.id);
    } else {
      _activeRow = newRow;
      _activeCol = newCol;
      // Focus the target cell input
      const input = document.querySelector(`input[data-row="${newRow}"][data-col="${newCol}"]`);
      if (input) {
        input.focus();
        if (input.select) input.select();
      }
    }
  }

  function _updateProgressBar() {
    const vars = M.getVariables();
    const ss = M.getSampleSize();
    const cases = M.getCases();
    let filled = 0, total = ss * vars.length;
    cases.forEach(row => row.forEach(v => { if (v !== null && v !== undefined && v !== '') filled++; }));
    const pct = total > 0 ? ((filled / total) * 100).toFixed(1) : 0;
    const fill = document.querySelector('.dv-progress-fill');
    const text = document.querySelector('.dv-progress-text');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = `${t('filled')}: ${filled}/${total} (${pct}%)`;
  }

  // ──────────────────────────────────────────────
  // Toolbar Actions
  // ──────────────────────────────────────────────
  function applySampleSize() {
    const input = document.getElementById('dvSampleSize');
    const n = parseInt(input.value) || 100;
    M.setSampleSize(n);
    _viewStart = 0;
    render(_container.id);
  }

  function toggleLabels() {
    _showLabels = !_showLabels;
    render(_container.id);
  }

  function clearData() {
    if (!confirm(t('confirmClear'))) return;
    const ss = M.getSampleSize();
    const vars = M.getVariables();
    for (let r = 0; r < ss; r++) {
      for (let c = 0; c < vars.length; c++) {
        M.setCellValue(r, c, null);
      }
    }
    render(_container.id);
  }

  function fillRandom() {
    const vars = M.getVariables();
    const ss = M.getSampleSize();
    for (let r = 0; r < ss; r++) {
      for (let c = 0; c < vars.length; c++) {
        const v = vars[c];
        const valKeys = Object.keys(v.values).map(Number).filter(Number.isFinite);
        if (valKeys.length > 0) {
          const randVal = valKeys[Math.floor(Math.random() * valKeys.length)];
          M.setCellValue(r, c, randVal);
        } else if (v.type === 'Numeric') {
          M.setCellValue(r, c, Math.floor(Math.random() * 5) + 1);
        }
      }
    }
    render(_container.id);
  }

  // ──────────────────────────────────────────────
  // CSV Import / Export
  // ──────────────────────────────────────────────
  function importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        _parseAndImportCSV(text);
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  }

  function _parseAndImportCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;

    // First line = headers (variable names)
    const headers = lines[0].split(/[,;\t]/).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const vars = M.getVariables();

    // If no variables defined, create them from headers
    if (vars.length === 0) {
      headers.forEach(h => M.addVariable({ name: h, label: h }));
    }

    const currentVars = M.getVariables();

    // Map CSV columns to variable indices
    const colMap = headers.map(h => currentVars.findIndex(v => v.name === h));

    // Parse data rows
    const dataRows = lines.slice(1);
    M.setSampleSize(Math.max(M.getSampleSize(), dataRows.length));

    dataRows.forEach((line, ri) => {
      const cells = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      cells.forEach((val, ci) => {
        const varIdx = colMap[ci] !== undefined && colMap[ci] >= 0 ? colMap[ci] : ci;
        if (varIdx < currentVars.length) {
          M.setCellValue(ri, varIdx, val === '' ? null : val);
        }
      });
    });

    render(_container.id);
  }

  function exportCSV() {
    const vars = M.getVariables();
    const ss = M.getSampleSize();
    if (vars.length === 0) return;

    let csv = '\ufeff'; // BOM for Arabic
    // Headers
    csv += vars.map(v => `"${v.name}"`).join(',') + '\n';
    // Data
    for (let r = 0; r < ss; r++) {
      const row = [];
      for (let c = 0; c < vars.length; c++) {
        const val = M.getCellValue(r, c);
        row.push(val !== null && val !== undefined ? String(val) : '');
      }
      csv += row.map(v => `"${v}"`).join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Basira_DataView_Export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ──────────────────────────────────────────────
  // Pagination
  // ──────────────────────────────────────────────
  function prevPage() {
    _viewStart = Math.max(0, _viewStart - PAGE_SIZE);
    render(_container.id);
  }

  function nextPage() {
    const ss = M.getSampleSize();
    if (_viewStart + PAGE_SIZE < ss) {
      _viewStart += PAGE_SIZE;
      render(_container.id);
    }
  }

  // ──────────────────────────────────────────────
  return {
    render, focusCell, onCellChange, onCellKeydown,
    applySampleSize, toggleLabels, clearData, fillRandom,
    importCSV, exportCSV,
    prevPage, nextPage
  };
})();
