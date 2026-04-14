/**
 * STTS — Export Module
 * Export to Word, PDF, CSV, Excel, and JSON.
 */
'use strict';

const Export = (() => {

  /**
   * Export results table and analysis to a Word document (.doc).
   * @param {HTMLElement} tableEl - Results table element
   * @param {HTMLElement} analysisEl - Analytical text element
   * @param {Function} t - i18n translation function
   * @param {boolean} isRTL - Whether current language is RTL
   */
  function toWord(tableEl, analysisEl, t, isRTL) {
    // Clone table and remove action columns
    const tableClone = tableEl.cloneNode(true);
    _removeActionColumns(tableClone);

    const direction = isRTL ? 'rtl' : 'ltr';
    const fontFamily = isRTL ? "'Simplified Arabic', 'Cairo', Arial" : "'Inter', 'Segoe UI', Arial";

    const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <title>${Utils.escapeHTML(t('export.wordTitle'))}</title>
      <style>
        body {
          font-family: ${fontFamily};
          direction: ${direction};
          text-align: center;
          padding: 20px;
        }
        table {
          border-collapse: collapse;
          width: 95%;
          margin: 20px auto;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px 6px;
          text-align: center;
          font-size: 11pt;
        }
        th {
          background-color: #2563eb;
          color: white;
          font-weight: bold;
        }
        .summary-row td {
          background-color: #fef9e7;
          font-weight: bold;
        }
        h2 {
          color: #1e3a8a;
          text-align: center;
          font-size: 18pt;
          margin-bottom: 10px;
        }
        .analytical-text {
          text-align: justify;
          line-height: 2;
          margin: 20px 30px;
          font-size: 12pt;
        }
        .highlight {
          color: #2563eb;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h2>${Utils.escapeHTML(t('export.wordTitle'))}</h2>
      ${tableClone.outerHTML}
      <br/>
      ${analysisEl ? analysisEl.innerHTML : ''}
    </body>
    </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    Utils.downloadBlob(blob, `${t('export.wordFilename')}.doc`);
  }

  /**
   * Export results to CSV.
   * @param {Array} questionsData - Array of question data
   * @param {string[]} scaleLabels - Category labels
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

    // Add BOM for Excel Arabic support
    let csv = '\ufeff' + headers.map(_csvEscape).join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(_csvEscape).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    Utils.downloadBlob(blob, `${t('export.csvFilename')}.csv`);
  }

  /**
   * Export to JSON file for data sharing.
   * @param {Object} appState - Current application state
   * @param {Function} t
   */
  function toJSON(appState, t) {
    const blob = Storage.exportJSON(appState);
    Utils.downloadBlob(blob, `${t('export.jsonFilename')}.json`);
  }

  /**
   * Escape a value for CSV format.
   * @param {*} value
   * @returns {string}
   */
  function _csvEscape(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Remove action columns from a cloned table.
   * @param {HTMLElement} tableClone
   */
  function _removeActionColumns(tableClone) {
    tableClone.querySelectorAll('.action-column').forEach(el => el.remove());
  }

  return {
    toWord,
    toCSV,
    toJSON
  };
})();
