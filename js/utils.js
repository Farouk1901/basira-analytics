/**
 * STTS — Utility & Sanitization Module
 * Provides HTML sanitization, input validation, and helper functions.
 */
'use strict';

const Utils = (() => {
  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str - Raw string to sanitize
   * @returns {string} HTML-safe string
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return String(str);
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
      '/': '&#x2F;',
    };
    return str.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  /**
   * Create a text node (safest way to insert user text into DOM).
   * @param {string} text
   * @returns {Text}
   */
  function textNode(text) {
    return document.createTextNode(text);
  }

  /**
   * Safely set text content of an element.
   * @param {HTMLElement} element
   * @param {string} text
   */
  function setText(element, text) {
    if (element) element.textContent = text;
  }

  /**
   * Parse a value as a finite integer, or return a default.
   * @param {*} value
   * @param {number} defaultVal
   * @returns {number}
   */
  function safeInt(value, defaultVal = 0) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : defaultVal;
  }

  /**
   * Parse a value as a finite float, or return a default.
   * @param {*} value
   * @param {number} defaultVal
   * @returns {number}
   */
  function safeFloat(value, defaultVal = 0) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : defaultVal;
  }

  /**
   * Format a number to a given number of decimal places.
   * @param {number} num
   * @param {number} decimals
   * @returns {string}
   */
  function formatNumber(num, decimals = 3) {
    if (!Number.isFinite(num)) return '0';
    return num.toFixed(decimals);
  }

  /**
   * Generate a unique ID.
   * @param {string} prefix
   * @returns {string}
   */
  function uid(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Debounce a function call.
   * @param {Function} fn
   * @param {number} ms
   * @returns {Function}
   */
  function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  /**
   * Create DOM element with attributes and children.
   * @param {string} tag
   * @param {Object} attrs
   * @param {...(HTMLElement|string)} children
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'dataset' && typeof val === 'object') {
        for (const [dk, dv] of Object.entries(val)) {
          el.dataset[dk] = dv;
        }
      } else {
        el.setAttribute(key, val);
      }
    }
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    });
    return el;
  }

  /**
   * Download a Blob as a file.
   * @param {Blob} blob
   * @param {string} filename
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Trigger a file input dialog and return the selected file.
   * @param {string} accept - File types to accept (e.g., '.json')
   * @returns {Promise<File|null>}
   */
  function pickFile(accept = '.json') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.addEventListener('change', () => {
        resolve(input.files[0] || null);
      });
      input.click();
    });
  }

  /**
   * Read a File as text.
   * @param {File} file
   * @returns {Promise<string>}
   */
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  return {
    escapeHTML,
    textNode,
    setText,
    safeInt,
    safeFloat,
    formatNumber,
    uid,
    debounce,
    createElement,
    downloadBlob,
    pickFile,
    readFileAsText
  };
})();
