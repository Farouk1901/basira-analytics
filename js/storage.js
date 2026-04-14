/**
 * STTS — Secure Storage Module
 * Schema-validated localStorage operations with versioned data format.
 */
'use strict';

const Storage = (() => {
  const STORAGE_KEY = 'stts_data_v3';
  const DATA_VERSION = 3;

  /**
   * Save data to localStorage with schema versioning.
   * @param {Object} data - Application state to save
   * @returns {boolean} Success status
   */
  function save(data) {
    try {
      const payload = {
        version: DATA_VERSION,
        timestamp: new Date().toISOString(),
        questionsData: data.questionsData || [],
        fixedWeights: data.fixedWeights,
        sampleSize: data.sampleSize,
        scaleType: data.scaleType,
        questionNumber: data.questionNumber,
        useSampleVariance: data.useSampleVariance !== undefined ? data.useSampleVariance : true
      };

      const json = JSON.stringify(payload);

      // Check storage quota (rough estimate)
      if (json.length > 4 * 1024 * 1024) {
        console.warn('[Storage] Data too large for localStorage');
        return false;
      }

      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (error) {
      console.error('[Storage] Save error:', error);
      return false;
    }
  }

  /**
   * Load and validate data from localStorage.
   * @returns {Object|null} Validated data object, or null if none/invalid
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw);

      // Version check
      if (!data || typeof data !== 'object' || data.version !== DATA_VERSION) {
        console.warn('[Storage] Data version mismatch, clearing old data');
        clear();
        return null;
      }

      // Schema validation
      if (!_validateSchema(data)) {
        console.warn('[Storage] Data schema validation failed');
        clear();
        return null;
      }

      return data;
    } catch (error) {
      console.error('[Storage] Load error:', error);
      clear();
      return null;
    }
  }

  /**
   * Validate the data schema.
   * @param {Object} data
   * @returns {boolean}
   */
  function _validateSchema(data) {
    // questionsData must be an array
    if (!Array.isArray(data.questionsData)) return false;

    // Each question must have required fields
    for (const q of data.questionsData) {
      if (typeof q !== 'object' || q === null) return false;
      if (typeof q.questionNum !== 'string' && typeof q.questionNum !== 'number') return false;
      if (typeof q.sampleSize !== 'number' || q.sampleSize <= 0) return false;
      if (!Array.isArray(q.counts)) return false;
      if (!q.stats || typeof q.stats !== 'object') return false;

      // Validate counts are non-negative integers
      for (const c of q.counts) {
        if (typeof c !== 'number' || c < 0 || !Number.isFinite(c)) return false;
      }
    }

    // fixedWeights must be null or an array of positive numbers
    if (data.fixedWeights !== null) {
      if (!Array.isArray(data.fixedWeights)) return false;
      for (const w of data.fixedWeights) {
        if (typeof w !== 'number' || !Number.isFinite(w)) return false;
      }
    }

    return true;
  }

  /**
   * Check if saved data exists.
   * @returns {boolean}
   */
  function exists() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Clear saved data.
   */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export data as a JSON blob for file download.
   * @param {Object} data - Application state
   * @returns {Blob}
   */
  function exportJSON(data) {
    const payload = {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      tool: 'STTS - Advanced Statistical Processing Tool',
      questionsData: data.questionsData || [],
      fixedWeights: data.fixedWeights,
      sampleSize: data.sampleSize,
      scaleType: data.scaleType,
      useSampleVariance: data.useSampleVariance
    };

    return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  }

  /**
   * Import and validate a JSON file's content.
   * @param {string} jsonString - Raw JSON string from file
   * @returns {Object|null} Validated data, or null if invalid
   */
  function importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (!data || typeof data !== 'object') return null;
      if (data.version !== DATA_VERSION) return null;
      if (!_validateSchema(data)) return null;

      return data;
    } catch {
      return null;
    }
  }

  // Theme persistence
  function saveTheme(theme) {
    localStorage.setItem('stts_theme', theme);
  }

  function loadTheme() {
    return localStorage.getItem('stts_theme') || 'light';
  }

  return {
    save,
    load,
    exists,
    clear,
    exportJSON,
    importJSON,
    saveTheme,
    loadTheme
  };
})();
