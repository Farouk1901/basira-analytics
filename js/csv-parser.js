/**
 * Basira Analytics — CSV Parser Module
 * Simple CSV upload and parsing (pure JS, no dependencies)
 */
'use strict';

const CSVParser = (() => {

  /**
   * Parse CSV text into an array of objects.
   * @param {string} text - Raw CSV text
   * @param {string} [delimiter=','] - Column separator
   * @returns {{ headers: string[], rows: Object[], rawRows: string[][] }}
   */
  function parse(text, delimiter) {
    if (!text || !text.trim()) return { headers: [], rows: [], rawRows: [] };

    // Auto-detect delimiter
    if (!delimiter) {
      const firstLine = text.split(/\r?\n/)[0];
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      delimiter = tabCount > commaCount && tabCount > semicolonCount ? '\t'
        : semicolonCount > commaCount ? ';' : ',';
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return { headers: [], rows: [], rawRows: [] };

    const rawRows = lines.map(line => _parseLine(line, delimiter));
    const headers = rawRows[0].map(h => h.trim());
    const dataRows = rawRows.slice(1);

    const rows = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i].trim() : '';
      });
      return obj;
    });

    return { headers, rows, rawRows: dataRows };
  }

  /**
   * Parse a single CSV line respecting quoted fields.
   */
  function _parseLine(line, delimiter) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === delimiter) {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }

  /**
   * Extract a numeric column from parsed data.
   * @param {Object[]} rows - Parsed rows
   * @param {string} colName - Column header
   * @returns {number[]} Array of valid numbers
   */
  function getNumericColumn(rows, colName) {
    return rows
      .map(r => parseFloat(r[colName]))
      .filter(v => Number.isFinite(v));
  }

  /**
   * Extract a categorical column.
   * @param {Object[]} rows
   * @param {string} colName
   * @returns {string[]}
   */
  function getCategoricalColumn(rows, colName) {
    return rows.map(r => String(r[colName] || '').trim()).filter(v => v !== '');
  }

  /**
   * Detect column types (numeric vs categorical).
   * @param {Object[]} rows
   * @param {string[]} headers
   * @returns {Object} { columnName: 'numeric'|'categorical' }
   */
  function detectTypes(rows, headers) {
    const types = {};
    headers.forEach(h => {
      const values = rows.map(r => r[h]).filter(v => v !== undefined && String(v).trim() !== '');
      const numericCount = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v)).length;
      types[h] = numericCount / values.length > 0.7 ? 'numeric' : 'categorical';
    });
    return types;
  }

  /**
   * Trigger file upload dialog and return parsed CSV.
   * @returns {Promise<{ headers: string[], rows: Object[], rawRows: string[][] }|null>}
   */
  async function uploadAndParse() {
    const file = await Utils.pickFile('.csv,.txt,.tsv');
    if (!file) return null;

    const text = await Utils.readFileAsText(file);
    return parse(text);
  }

  return { parse, getNumericColumn, getCategoricalColumn, detectTypes, uploadAndParse };
})();
