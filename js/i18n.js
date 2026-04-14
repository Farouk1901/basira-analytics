/**
 * STTS — Internationalization (i18n) Module
 * Handles language switching, translation loading, and text interpolation.
 */
'use strict';

const I18n = (() => {
  let _currentLang = 'ar';
  let _translations = {};
  let _onLanguageChange = [];

  /**
   * Initialize i18n by loading locale files.
   * @param {string} lang - Initial language ('ar' or 'en')
   */
  async function init(lang = 'ar') {
    _currentLang = lang;
    await _loadLocale(lang);
    _applyDirection();
    _applyFont();
  }

  /**
   * Load a locale JSON file.
   * @param {string} lang
   */
  async function _loadLocale(lang) {
    try {
      const response = await fetch(`locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load locale: ${lang}`);
      _translations = await response.json();
    } catch (error) {
      console.error(`[i18n] Error loading locale '${lang}':`, error);
      // Fallback: try preloaded translations
      if (window.__STTS_LOCALES && window.__STTS_LOCALES[lang]) {
        _translations = window.__STTS_LOCALES[lang];
      }
    }
  }

  /**
   * Switch language.
   * @param {string} lang - 'ar' or 'en'
   */
  async function setLanguage(lang) {
    if (lang === _currentLang) return;
    _currentLang = lang;
    await _loadLocale(lang);
    _applyDirection();
    _applyFont();
    localStorage.setItem('stts_lang', lang);
    // Notify all listeners
    _onLanguageChange.forEach(cb => cb(lang));
  }

  /**
   * Toggle between AR and EN.
   */
  async function toggle() {
    await setLanguage(_currentLang === 'ar' ? 'en' : 'ar');
  }

  /**
   * Get the current language.
   * @returns {string}
   */
  function getLang() {
    return _currentLang;
  }

  /**
   * Check if current language is RTL.
   * @returns {boolean}
   */
  function isRTL() {
    return _currentLang === 'ar';
  }

  /**
   * Get a translated string by dot-notation key.
   * @param {string} key - e.g. 'settings.sampleSize'
   * @param {Object} params - Interpolation parameters
   * @returns {string}
   */
  function t(key, params = {}) {
    const keys = key.split('.');
    let value = _translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`[i18n] Missing translation for key: '${key}' in '${_currentLang}'`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Interpolate {paramName} patterns
    return value.replace(/\{(\w+)\}/g, (_, paramName) => {
      return params[paramName] !== undefined ? String(params[paramName]) : `{${paramName}}`;
    });
  }

  /**
   * Register a callback for language changes.
   * @param {Function} callback
   */
  function onLanguageChange(callback) {
    if (typeof callback === 'function') {
      _onLanguageChange.push(callback);
    }
  }

  /**
   * Apply document direction based on language.
   */
  function _applyDirection() {
    const dir = isRTL() ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', _currentLang);
  }

  /**
   * Apply font family based on language.
   */
  function _applyFont() {
    if (isRTL()) {
      document.body.style.fontFamily = "var(--font-ar)";
    } else {
      document.body.style.fontFamily = "var(--font-en)";
    }
  }

  /**
   * Get the saved language preference.
   * @returns {string}
   */
  function getSavedLang() {
    return localStorage.getItem('stts_lang') || 'ar';
  }

  /**
   * Get scale option labels for the current language.
   * @returns {Object}
   */
  function getScaleOptions() {
    return {
      2: [t('scale.agree'), t('scale.disagree')],
      3: [t('scale.agree'), t('scale.neutral'), t('scale.disagree')],
      5: [t('scale.stronglyAgree'), t('scale.agree'), t('scale.neutral'), t('scale.disagree'), t('scale.stronglyDisagree')]
    };
  }

  return {
    init,
    setLanguage,
    toggle,
    getLang,
    isRTL,
    t,
    onLanguageChange,
    getSavedLang,
    getScaleOptions
  };
})();
