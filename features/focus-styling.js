/**
 * Focus Styling Feature
 * 
 * Provides blue outline focus indicators for TV navigation.
 * Extracted from default bundle.
 */

export default {
  name: 'focusStyling',
  displayName: 'Focus Styling',
  
  /**
   * CSS to inject
   */
  getCSS: function(mode) {
    var color = '#00a8ff';
    var width = 3;
    if (mode === 'high') {
      color = '#fcd34d';
      width = 4;
    }
    return [
      '/* TizenPortal Focus Styling */',
      ':focus {',
      '  outline: ' + width + 'px solid ' + color + ' !important;',
      '  outline-offset: 2px;',
      '}',
      '',
      'a:focus,',
      'button:focus,',
      '[role="button"]:focus,',
      '[role="link"]:focus,',
      '[role="menuitem"]:focus,',
      '[role="tab"]:focus,',
      '[role="option"]:focus,',
      '[tabindex]:focus,',
      'input:focus,',
      'select:focus,',
      'textarea:focus {',
      '  outline: ' + width + 'px solid ' + color + ' !important;',
      '  outline-offset: 2px;',
      '}',
      '',
      '*:focus {',
      '  -webkit-tap-highlight-color: transparent;',
      '}',
    ].join('\n');
  },
  
  /**
   * Apply feature to iframe document
   * @param {Document} doc
   */
  apply: function(doc) {
    if (!doc) return;
    var mode = arguments.length > 1 ? arguments[1] : 'on';
    this.remove(doc);
    if (mode === 'off') return;

    var style = doc.createElement('style');
    style.id = 'tp-focus-styling';
    style.textContent = this.getCSS(mode);
    
    var head = doc.head || doc.documentElement;
    if (head) {
      head.appendChild(style);
    }
  },
  
  /**
   * Remove feature from iframe document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    var style = doc.getElementById('tp-focus-styling');
    if (style) {
      style.parentNode.removeChild(style);
    }
  },
};
