/**
 * Basira Analytics — Export Module
 * Export to Word (.doc), CSV, and JSON.
 * Based on the proven export pattern from the original statistical tool.
 */
'use strict';

const Export = (() => {

  /**
   * Export results table and analysis to a Word document (.doc).
   * Replicates the exact export pattern from the reference implementation.
   */
  function toWord(tableEl, analysisEl, t, isRTL) {
    // Clone table and remove action columns
    const tableClone = tableEl.cloneNode(true);
    _removeActionColumns(tableClone);

    const direction = isRTL ? 'rtl' : 'ltr';
    const textAlign = isRTL ? 'right' : 'left';

    // Construct full HTML document — identical structure to the working reference
    const htmlContent = `
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body {
                direction: ${direction};
                font-family: 'Simplified Arabic', 'Cairo', Arial, sans-serif;
                padding: 20px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                direction: ${direction};
            }
            th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: center;
                font-size: 11pt;
            }
            th {
                background-color: #2874a6;
                color: white;
                font-weight: bold;
            }
            .summary-row td {
                background-color: #fef9e7;
                font-weight: bold;
            }
            h2 {
                text-align: center;
                color: #1e3a8a;
            }
            .analytical-text {
                text-align: justify;
                line-height: 2;
                margin: 20px 30px;
                font-size: 12pt;
            }
        </style>
    </head>
    <body>
        <h2>${Utils.escapeHTML(t('export.wordTitle'))}</h2>
        ${tableClone.outerHTML}
        <br/>
        ${analysisEl ? analysisEl.innerHTML : ''}
    </body>
    </html>`;

    // Create Blob with BOM for Arabic support — exact same pattern as reference
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });

    // Download using the proven method
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Basira_Statistical_Results.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export results to CSV file.
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

    // BOM + headers + rows
    let csv = '\ufeff' + headers.map(_csvEscape).join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(_csvEscape).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Basira_Statistical_Results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Export to JSON file.
   */
  function toJSON(appState, t) {
    const blob = Storage.exportJSON(appState);

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Basira_Data_Export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Escape a value for CSV format.
   */
  function _csvEscape(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Remove action columns (edit/delete buttons) from a cloned table.
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
