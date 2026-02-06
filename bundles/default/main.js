/**
 * Default Bundle
 * 
 * Fallback bundle used when no site-specific bundle is configured.
 * Provides basic functionality without site-specific customizations.
 */

import defaultStyles from './style.css';

function tpLog() {
  if (window.TizenPortal && typeof TizenPortal.log === 'function') {
    TizenPortal.log.apply(TizenPortal, arguments);
  } else if (console && typeof console.log === 'function') {
    console.log.apply(console, arguments);
  }
}

function tpWarn() {
  if (window.TizenPortal && typeof TizenPortal.warn === 'function') {
    TizenPortal.warn.apply(TizenPortal, arguments);
  } else if (console && typeof console.warn === 'function') {
    console.warn.apply(console, arguments);
  }
}

export default {
  name: 'default',
  displayName: 'Default',
  description: 'Basic TV browser support with focus styling',
  
  /**
   * CSS to inject
   */
  style: defaultStyles,

  /**
   * Called before page content loads
   * @param {Window} win
   * @param {Object} card
   */
  onBeforeLoad: function(win, card) {
    tpLog('TizenPortal [default]: Loading', card.url);
  },

  /**
   * Called after page content has loaded
   * @param {Window} win
   * @param {Object} card
   */
  onAfterLoad: function(win, card) {
    tpLog('TizenPortal [default]: Loaded', card.url);
  },

  /**
   * Called when bundle is activated
   * @param {Window} win
   * @param {Object} card
   */
  onActivate: function(win, card) {
    tpLog('TizenPortal [default]: Activated');
  },

  /**
   * Called when bundle is deactivated
   * @param {Window} win
   * @param {Object} card
   */
  onDeactivate: function(win, card) {
    tpLog('TizenPortal [default]: Deactivated');
  },

  /**
   * Called when navigation occurs
   * @param {string} url
   */
  onNavigate: function(url) {
    tpLog('TizenPortal [default]: Navigated to', url);
  },

  /**
   * Called on keydown events
   * @param {KeyboardEvent} event
   * @returns {boolean} True to consume event
   */
  onKeyDown: function(event) {
    return false; // Let default handling proceed
  },

  // Helper methods

  /**
   * Inject basic focus styling
   * @param {Document} doc
   */
  injectBasicStyles: function(doc) {
    if (!doc || doc.getElementById('tp-default-styles')) {
      return;
    }

    var style = doc.createElement('style');
    style.id = 'tp-default-styles';
    style.textContent = [
      '/* TizenPortal Default Bundle Styles */',
      ':focus {',
      '  outline: 3px solid #00a8ff !important;',
      '  outline-offset: 2px;',
      '}',
      '',
      'a:focus, button:focus, [role="button"]:focus {',
      '  outline: 3px solid #00a8ff !important;',
      '  outline-offset: 2px;',
      '}',
    ].join('\n');

    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
    }
  },

  /**
   * Make interactive elements focusable
   * @param {Document} doc
   */
  makeFocusable: function(doc) {
    var selectors = [
      'a[href]',
      'button',
      '[role="button"]',
      '[role="link"]',
      'input',
      'select',
      'textarea',
    ];

    var elements = doc.querySelectorAll(selectors.join(','));
    var changed = 0;

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      var disabled = el.disabled || el.getAttribute('aria-disabled') === 'true';
      if (disabled) continue;

      var tabindex = el.getAttribute('tabindex');
      if (tabindex !== null) {
        var tabindexValue = parseInt(tabindex, 10);
        if (!isNaN(tabindexValue) && tabindexValue < 0) continue;
        continue;
      }

      el.setAttribute('tabindex', '0');
      changed++;
    }

    tpLog('TizenPortal [default]: Made', changed, 'elements focusable');
  },
};
