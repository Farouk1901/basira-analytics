/**
 * Basira Analytics — Export Module
 * Export to Word (.doc), CSV, and JSON with proper formatting.
 * Implements MSO-compatible HTML structure for Word, BOM for Arabic CSV,
 * and Basira Analytics branding throughout.
 */
'use strict';

const Export = (() => {

  /**
   * Export results table and analysis to a Word document (.doc).
   * Uses proper XML namespaces and MSO conditional comments for
   * correct rendering in Microsoft Word.
   *
   * @param {HTMLElement} tableEl - Results table element
   * @param {HTMLElement} analysisEl - Analytical text element
   * @param {Function} t - i18n translation function
   * @param {boolean} isRTL - Whether current language is RTL
   */
  function toWord(tableEl, analysisEl, t, isRTL) {
    // Clone table and strip ALL non-data columns (actions, buttons, etc.)
    const tableClone = tableEl.cloneNode(true);
    _removeNonDataColumns(tableClone);

    const direction = isRTL ? 'rtl' : 'ltr';
    const fontFamily = isRTL
      ? "'Simplified Arabic', 'Cairo', 'Traditional Arabic', Arial, sans-serif"
      : "'Calibri', 'Segoe UI', 'Inter', Arial, sans-serif";
    const align = isRTL ? 'right' : 'left';
    const exportDate = new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Full MSO-compatible HTML document structure
    const htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]>
<xml>
  <o:DocumentProperties>
    <o:Author>Basira Analytics</o:Author>
    <o:LastAuthor>Basira Analytics</o:LastAuthor>
    <o:Company>Basira Analytics — بصيرة</o:Company>
    <o:Created>${new Date().toISOString()}</o:Created>
  </o:DocumentProperties>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<title>${Utils.escapeHTML(t('export.wordTitle'))} — Basira Analytics</title>
<style>
  /* Page Setup */
  @page {
    size: A4;
    margin: 2cm;
    mso-header-margin: 1cm;
    mso-footer-margin: 1cm;
  }
  @page Section1 {
    mso-page-orientation: landscape;
  }
  div.Section1 {
    page: Section1;
  }

  /* Body */
  body {
    font-family: ${fontFamily};
    direction: ${direction};
    text-align: ${align};
    padding: 20px;
    color: #1a1a2e;
    line-height: 1.6;
    mso-default-font-family: ${fontFamily};
  }

  /* Header Branding */
  .report-header {
    text-align: center;
    padding: 20px 0 15px;
    border-bottom: 3px solid #2563eb;
    margin-bottom: 25px;
  }
  .report-header h1 {
    color: #1e3a8a;
    font-size: 20pt;
    margin: 0 0 5px;
    mso-style-type: personal-compose;
  }
  .report-header .subtitle {
    color: #6b7280;
    font-size: 11pt;
    margin: 0;
  }
  .report-header .date {
    color: #9ca3af;
    font-size: 9pt;
    margin: 8px 0 0;
  }

  /* Data Table */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px auto;
    direction: ${direction};
    mso-table-layout: fixed;
  }
  th, td {
    border: 1px solid #374151;
    padding: 8px 6px;
    text-align: center;
    font-size: 10pt;
    mso-number-format: '\\@';
  }
  th {
    background-color: #1e3a8a;
    color: white;
    font-weight: bold;
    font-size: 10pt;
    mso-pattern: #1e3a8a;
  }
  tr:nth-child(even) td {
    background-color: #f3f4f6;
  }
  .summary-row td {
    background-color: #fef3c7;
    font-weight: bold;
    border-top: 2px solid #1e3a8a;
  }

  /* Analysis Section */
  h2 {
    color: #1e3a8a;
    text-align: center;
    font-size: 16pt;
    margin: 30px 0 15px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 8px;
  }
  h3 {
    color: #1e40af;
    font-size: 13pt;
    margin: 20px 0 8px;
  }
  .analytical-text {
    text-align: justify;
    line-height: 2;
    margin: 15px 20px;
    font-size: 12pt;
  }
  .note-box {
    background-color: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 4px;
    padding: 10px 15px;
    margin: 10px 0;
    font-size: 10pt;
  }
  .conclusion {
    background-color: #eff6ff;
    border: 1px solid #93c5fd;
    border-radius: 4px;
    padding: 12px 15px;
    margin: 15px 0;
  }

  /* Footer */
  .report-footer {
    text-align: center;
    margin-top: 30px;
    padding-top: 15px;
    border-top: 2px solid #e5e7eb;
    font-size: 9pt;
    color: #9ca3af;
  }
</style>
</head>
<body>
<div class="Section1">
  <!-- Report Header with Branding -->
  <div class="report-header">
    <h1>Basira Analytics — بصيرة</h1>
    <p class="subtitle">${Utils.escapeHTML(t('export.wordTitle'))}</p>
    <p class="date">${exportDate}</p>
  </div>

  <!-- Results Table -->
  <h2>${Utils.escapeHTML(t('export.wordTitle'))}</h2>
  ${tableClone.outerHTML}

  <!-- Analysis -->
  ${analysisEl && analysisEl.innerHTML.trim() ? '<br/>' + analysisEl.innerHTML : ''}

  <!-- Footer -->
  <div class="report-footer">
    <p>Basira Analytics — بصيرة | © ${new Date().getFullYear()} Engineer Ahmed Gohary</p>
  </div>
</div>
</body>
</html>`;

    // Create Blob with BOM for Arabic support
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    // Localized filename from locale, fallback to safe default
    const baseName = t('export.wordFilename');
    const fileName = (baseName && !baseName.includes('.'))
      ? baseName + '.doc'
      : 'Basira_Analytics_Report.doc';

    _downloadFile(blob, fileName);
  }

  /**
   * Export results to CSV file.
   * Includes BOM for Arabic/UTF-8 Excel compatibility.
   *
   * @param {Array} questionsData - Array of question data objects
   * @param {string[]} scaleLabels - Category labels (e.g. ['Agree','Disagree'])
   * @param {Function} t - i18n translation function
   */
  function toCSV(questionsData, scaleLabels, t) {
    if (!questionsData || questionsData.length === 0) return;

    const headers = [
      t('results.headers.questionNum'),
      t('results.headers.sampleSize'),
      t('results.headers.scaleType'),
      ...scaleLabels,
      t('results.headers.mean'),
      t('results.headers.std'),
      t('results.headers.variance'),
      t('results.headers.cv'),
      t('results.headers.median')
    ];

    const rows = questionsData.map(q => [
      q.questionNum,
      q.sampleSize,
      `${q.scaleVal} ${t('scale.points')}`,
      ...q.counts,
      q.stats.mean.toFixed(3),
      q.stats.std.toFixed(3),
      q.stats.variance.toFixed(3),
      q.stats.cv.toFixed(2) + '%',
      q.stats.median.toFixed(3)
    ]);

    // BOM + headers + data rows
    let csv = '\ufeff' + headers.map(_csvEscape).join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(_csvEscape).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    const baseName = t('export.csvFilename');
    const fileName = (baseName && !baseName.includes('.'))
      ? baseName + '.csv'
      : 'Basira_Analytics_Data.csv';

    _downloadFile(blob, fileName);
  }

  /**
   * Export application state to JSON file.
   *
   * @param {Object} appState - Current application state
   * @param {Function} t - i18n translation function
   */
  function toJSON(appState, t) {
    const blob = Storage.exportJSON(appState);

    const baseName = t('export.jsonFilename');
    const fileName = (baseName && !baseName.includes('.'))
      ? baseName + '.json'
      : 'Basira_Analytics_Export.json';

    _downloadFile(blob, fileName);
  }

  // ===========================================================
  // Private Helpers
  // ===========================================================

  /**
   * Trigger a file download using the standard anchor approach.
   * This is the same proven pattern used in the reference implementation.
   *
   * @param {Blob} blob - File content as Blob
   * @param {string} filename - Full filename with extension
   */
  function _downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape a value for CSV format.
   * Handles commas, semicolons, quotes, newlines, and leading/trailing spaces.
   *
   * @param {*} value
   * @returns {string}
   */
  function _csvEscape(value) {
    const str = String(value);
    // Wrap in quotes if contains: comma, semicolon, quote, newline, or leading/trailing whitespace
    if (str.includes(',') || str.includes(';') || str.includes('"') ||
        str.includes('\n') || str.includes('\r') || str !== str.trim()) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Remove ALL non-data columns from a cloned table.
   * Targets: .action-column, buttons, links, elements with onclick,
   * and the last column if it contains interactive elements.
   *
   * @param {HTMLElement} tableClone
   */
  function _removeNonDataColumns(tableClone) {
    // 1. Remove elements explicitly marked as action columns
    tableClone.querySelectorAll('.action-column').forEach(el => el.remove());

    // 2. Remove any cells containing buttons or action links
    tableClone.querySelectorAll('td, th').forEach(cell => {
      if (cell.querySelector('button, a.btn, .btn-delete, .btn-edit')) {
        cell.remove();
      }
    });

    // 3. Check if the last column in each row has interactive elements
    const rows = tableClone.querySelectorAll('tr');
    if (rows.length > 0) {
      const firstRow = rows[0];
      const cells = firstRow.querySelectorAll('th, td');
      if (cells.length > 0) {
        const lastCell = cells[cells.length - 1];
        const hasInteractive = lastCell.querySelector('button, a, [onclick]');
        if (hasInteractive || lastCell.textContent.trim() === '') {
          // Remove last cell from all rows
          rows.forEach(row => {
            const rowCells = row.querySelectorAll('th, td');
            if (rowCells.length > 0) {
              rowCells[rowCells.length - 1].remove();
            }
          });
        }
      }
    }

    // 4. Remove any remaining onclick attributes (cleanup)
    tableClone.querySelectorAll('[onclick]').forEach(el => {
      el.removeAttribute('onclick');
    });

    // 5. Remove all button elements that might remain
    tableClone.querySelectorAll('button').forEach(el => el.remove());
  }

  return {
    toWord,
    toCSV,
    toJSON
  };
})();
