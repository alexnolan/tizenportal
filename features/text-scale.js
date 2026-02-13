/**
 * Text Scale Feature
 * 
 * Provides relative font-size scaling for improved TV legibility.
 * Uses percentage-based scaling to maintain design hierarchy.
 * Moved from core polyfills to allow user configuration.
 */

/**
 * Scale presets
 * Uses transform-based scaling to preserve relative sizing
 * Values < 1.0 shrink text, values > 1.0 enlarge text
 */
var SCALE_PRESETS = {
  'extra-small': 0.75,  // Extra small (-25%)
  small: 0.9,           // Small (-10%)
  off: 1.0,             // No scaling (100%)
  medium: 1.15,         // Medium (+15%)
  large: 1.35,          // Large (+35%)
  'extra-large': 1.6,   // Extra large (+60%)
};

export default {
  name: 'textScale',
  displayName: 'Text Scale',
  
  /**
   * Get CSS for text scaling
   * @param {string} level - Scale level: 'off', 'small', 'medium', 'large'
   */
  getCSS: function(level) {
    var scale = SCALE_PRESETS[level] || 1.0;
    
    // If scale is 1.0, return empty (no changes needed)
    if (scale === 1.0) {
      return '';
    }
    
    // Apply scaling using rem units (always relative to html font-size, never multiplicative)
    // Set html to base font size (16px equivalent), then scale that base
    var baseSize = 16; // px equivalent
    var htmlFontSize = baseSize * scale;
    
    var css = [
      '/* TizenPortal Text Scale (' + level + ') */',
      'html {',
      '  font-size: ' + htmlFontSize + 'px !important;',
      '}',
      '',
      '/* Reset all elements to use rem units for clean scaling */',
      'body, p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label, button, input, select, textarea, a {',
      '  font-size: 1rem !important;',
      '}',
      '',
      '/* Improve readability with better spacing */',
      'body, p, div, li, td, th {',
      '  line-height: ' + (1.4 + (scale - 1) * 0.4) + ' !important;',
      '}',
      '',
      '/* Letter spacing for large text */',
      'p, li, td, th, span {',
      '  letter-spacing: ' + ((scale - 1) * 0.02) + 'em !important;',
      '}',
    ];
    
    return css.join('\n');
  },
  
  /**
   * Apply text scaling to document
   * @param {Document} doc
   * @param {string} level - Scale level
   */
  apply: function(doc, level) {
    if (!doc) return;
    
    if (window.TizenPortal) {
      window.TizenPortal.log('[TextScale] Applying level: ' + level);
    } else {
      console.log('[TextScale] Applying level:', level);
    }
    
    // Remove existing style first
    this.remove(doc);
    
    // Get CSS for this level
    var css = this.getCSS(level || 'off');
    
    if (window.TizenPortal) {
      window.TizenPortal.log('[TextScale] CSS generated, length: ' + css.length);
    } else {
      console.log('[TextScale] CSS generated, length:', css.length);
    }
    
    // If no CSS (level is 'off'), don't inject anything
    if (!css) {
      if (window.TizenPortal) {
        window.TizenPortal.log('[TextScale] No CSS (off mode), returning');
      }
      return;
    }
    
    try {
      var style = doc.createElement('style');
      style.id = 'tp-text-scale';
      style.textContent = css;
      
      var head = doc.head || doc.documentElement;
      if (head) {
        head.appendChild(style);
        if (window.TizenPortal) {
          window.TizenPortal.log('[TextScale] Style injected into document');
        } else {
          console.log('[TextScale] Style injected into document');
        }
      } else {
        if (window.TizenPortal) {
          window.TizenPortal.warn('[TextScale] No head element found');
        }
      }
    } catch (err) {
      if (window.TizenPortal) {
        window.TizenPortal.warn('[TextScale] Failed to apply:', err.message);
      } else {
        console.warn('[TextScale] Failed to apply:', err.message);
      }
    }
  },
  
  /**
   * Remove text scaling from document
   * @param {Document} doc
   */
  remove: function(doc) {
    if (!doc) return;
    
    if (window.TizenPortal) {
      window.TizenPortal.log('[TextScale] Removing');
    } else {
      console.log('[TextScale] Removing');
    }
    
    try {
      var style = doc.getElementById('tp-text-scale');
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
        if (window.TizenPortal) {
          window.TizenPortal.log('[TextScale] Removed');
        }
      }
    } catch (err) {
      if (window.TizenPortal) {
        window.TizenPortal.warn('[TextScale] Failed to remove:', err.message);
      } else {
        console.warn('[TextScale] Failed to remove:', err.message);
      }
    }
  },
};
