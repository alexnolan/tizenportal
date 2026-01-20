/**
 * TizenPortal Core Runtime
 * 
 * Main entry point. Initializes all subsystems and exposes the global API.
 * 
 * @version 0124
 */

// ============================================================================
// POLYFILLS - Must be imported first, before any other code
// This matches TizenTube's approach for Tizen Chrome 47-69 compatibility
// ============================================================================

// Core-js provides ES6+ language features (Array.flat, Object.entries, etc.)
import 'core-js/stable';

// Fetch API polyfill
import 'whatwg-fetch';

// DOMRect polyfill (from Financial-Times via TizenTube)
import '../polyfills/domrect-polyfill.js';

// ============================================================================
// SPATIAL NAVIGATION
// ============================================================================

// Import spatial navigation polyfill (sets up window.navigate)
import '../navigation/spatial-navigation-polyfill.js';

// ============================================================================
// APPLICATION MODULES
// ============================================================================

// Import core modules
import { configRead, configWrite, configOnChange, configInit } from './config.js';
import { initPolyfills, hasPolyfill, getLoadedPolyfills } from '../polyfills/index.js';
import { KEYS } from '../input/keys.js';
import { initInputHandler, executeColorAction } from '../input/handler.js';
import { initPointer, isPointerActive, togglePointer } from '../input/pointer.js';
import { initPortal, showPortal, hidePortal, refreshPortal } from '../ui/portal.js';
import { initModal } from '../ui/modal.js';
import { initSiteEditor, showAddSiteEditor, showEditSiteEditor, isSiteEditorOpen } from '../ui/siteeditor.js';
import { initAddressBar, showAddressBar, hideAddressBar, toggleAddressBar, isAddressBarVisible } from '../ui/addressbar.js';
import { initBundleMenu, showBundleMenu, hideBundleMenu, toggleBundleMenu, isBundleMenuVisible, cycleBundle } from '../ui/bundlemenu.js';
import { initDiagnostics, log, warn, error } from '../diagnostics/console.js';
import { initDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown } from './loader.js';
import { getBundleNames } from '../bundles/registry.js';

/**
 * TizenPortal version
 */
const VERSION = '0124';

/**
 * Application state
 */
const state = {
  initialized: false,
  currentCard: null,
  currentBundle: null,
  iframeActive: false,
};

/**
 * Initialize TizenPortal
 */
async function init() {
  if (state.initialized) {
    warn('TizenPortal already initialized');
    return;
  }

  log('TizenPortal ' + VERSION + ' initializing...');

  try {
    // Step 1: Initialize polyfills based on feature detection
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));

    // Check spatial navigation status
    log('Spatial nav: window.navigate=' + (typeof window.navigate) + ', __spatialNavigation__=' + (typeof window.__spatialNavigation__));
    if (window.__spatialNavigation__) {
      log('Spatial nav keyMode: ' + window.__spatialNavigation__.keyMode);
    }

    // Step 2: Initialize configuration
    configInit();
    log('Configuration initialized');

    // Step 3: Initialize diagnostics (console capture)
    initDiagnostics();
    log('Diagnostics initialized');

    // Step 4: Initialize diagnostics panel UI
    initDiagnosticsPanel();
    log('Diagnostics panel initialized');

    // Step 5: Initialize modal system (legacy)
    initModal();
    log('Modal system initialized');

    // Step 5b: Initialize new site editor
    initSiteEditor();
    log('Site editor initialized');

    // Step 6: Initialize address bar
    initAddressBar();
    log('Address bar initialized');

    // Step 7: Initialize bundle menu
    initBundleMenu();
    log('Bundle menu initialized');

    // Step 8: Initialize pointer/mouse mode
    initPointer();
    log('Pointer mode initialized');

    // Step 9: Initialize input handler
    initInputHandler();
    log('Input handler initialized');

    // Step 10: Initialize and render portal UI
    initPortal();
    log('Portal UI initialized');

    // Step 11: Initialize color button hints (make clickable)
    initColorHints();
    log('Color hints initialized');

    state.initialized = true;
    log('TizenPortal ' + VERSION + ' ready');

    // Show startup toast
    showToast('TizenPortal ' + VERSION);

  } catch (err) {
    error('Initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showToast(message, duration) {
  duration = duration || 3000;
  var toast = document.getElementById('tp-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(function() {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Show loading overlay
 * @param {string} text - Loading text to display
 */
function showLoading(text) {
  var loading = document.getElementById('tp-loading');
  var loadingText = document.getElementById('tp-loading-text');
  if (loading) {
    if (loadingText && text) {
      loadingText.textContent = text;
    }
    loading.classList.add('active');
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  var loading = document.getElementById('tp-loading');
  if (loading) {
    loading.classList.remove('active');
  }
}

/**
 * Initialize color button hints with click handlers
 * Makes the hints clickable for mouse users
 */
function initColorHints() {
  var hints = document.getElementById('tp-hints');
  if (!hints) return;

  // Define hint configurations: color class -> short press action
  var hintConfig = {
    'red': 'addressbar',
    'green': 'pointerMode',
    'yellow': 'bundleMenu',
    'blue': 'diagnostics'
  };

  // Find all hint elements and add click handlers
  var hintElements = hints.querySelectorAll('.tp-hint');
  for (var i = 0; i < hintElements.length; i++) {
    var hint = hintElements[i];
    var keyElement = hint.querySelector('.tp-hint-key');
    
    if (!keyElement) continue;

    // Determine which color this is
    var color = null;
    if (keyElement.classList.contains('red')) color = 'red';
    else if (keyElement.classList.contains('green')) color = 'green';
    else if (keyElement.classList.contains('yellow')) color = 'yellow';
    else if (keyElement.classList.contains('blue')) color = 'blue';

    if (!color || !hintConfig[color]) continue;

    // Store the action in a data attribute
    hint.setAttribute('data-action', hintConfig[color]);
    
    // Make it look clickable
    hint.style.cursor = 'pointer';
    
    // Add click handler
    hint.addEventListener('click', function(e) {
      var action = this.getAttribute('data-action');
      if (action) {
        executeColorAction(action);
      }
    });

    // Add hover effect
    hint.addEventListener('mouseenter', function() {
      this.style.opacity = '1';
      this.style.color = '#ffffff';
    });
    hint.addEventListener('mouseleave', function() {
      this.style.opacity = '';
      this.style.color = '';
    });
  }
}

/**
 * Load a site in the iframe
 * @param {Object} card - Card object with url, bundle, etc.
 */
function loadSite(card) {
  if (!card || !card.url) {
    error('Cannot load site: invalid card');
    return;
  }

  log('Loading site: ' + card.url);
  showLoading('Loading ' + (card.name || card.url) + '...');

  state.currentCard = card;
  
  var container = document.getElementById('tp-iframe-container');
  if (!container) {
    error('Iframe container not found');
    hideLoading();
    return;
  }

  // Clear existing iframe
  container.innerHTML = '';

  // Create new iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'tp-iframe';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
  
  // Track if we got meaningful content
  var loadTimeout = null;
  var hasContent = false;
  
  // Handle load event
  iframe.onload = function() {
    log('Site loaded: ' + card.url);
    hideLoading();
    
    // Clear timeout since we got a load event
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    
    // Check if we can access the iframe content (same-origin or allowed)
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      // If we can access the document and it has content, we're good
      if (doc && doc.body && doc.body.innerHTML.length > 0) {
        hasContent = true;
      }
    } catch (e) {
      // Cross-origin - we can't check, but that's okay if it loaded
      hasContent = true;
    }
    
    // If iframe loaded but appears empty, the site may have blocked framing
    if (!hasContent) {
      warn('Site may have blocked iframe embedding: ' + card.url);
      showIframeBlockedMessage(card);
      return;
    }
    
    state.iframeActive = true;
    
    // Load bundle for this site
    loadBundle(iframe, card).then(function(bundle) {
      if (bundle) {
        state.currentBundle = bundle.name || 'default';
        log('Bundle active: ' + state.currentBundle);
      }
    }).catch(function(err) {
      error('Bundle load failed: ' + err.message);
    });
  };

  // Handle error
  iframe.onerror = function(err) {
    error('Failed to load site: ' + card.url);
    hideLoading();
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    showIframeBlockedMessage(card);
  };

  // Set URL and add to container
  iframe.src = card.url;
  container.appendChild(iframe);

  // Show iframe container, hide portal
  hidePortal();
  container.style.display = 'block';
  
  // Set a timeout to detect if site refuses to load (X-Frame-Options, etc.)
  loadTimeout = setTimeout(function() {
    // Check if iframe is still empty after timeout
    try {
      var doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc || !doc.body || doc.body.innerHTML.length === 0) {
        warn('Site load timeout - may be blocked: ' + card.url);
        hideLoading();
        showIframeBlockedMessage(card);
      }
    } catch (e) {
      // Cross-origin but took too long - likely blocked
      if (!hasContent) {
        hideLoading();
        showIframeBlockedMessage(card);
      }
    }
  }, 8000);
}

/**
 * Show message when iframe embedding is blocked
 * @param {Object} card - The card that failed to load
 */
function showIframeBlockedMessage(card) {
  var container = document.getElementById('tp-iframe-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  var messageDiv = document.createElement('div');
  messageDiv.id = 'tp-iframe-blocked';
  messageDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:#0a0a0a;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:Arial,sans-serif;text-align:center;padding:40px;';
  
  messageDiv.innerHTML = 
    '<div style="font-size:48px;margin-bottom:24px;">🚫</div>' +
    '<h2 style="font-size:28px;margin-bottom:16px;color:#fff;">Site Cannot Be Embedded</h2>' +
    '<p style="font-size:18px;color:#888;margin-bottom:32px;max-width:600px;">' +
      'This site blocks embedding in iframes for security reasons.<br>' +
      'This is common for sites like Google, Facebook, banks, etc.' +
    '</p>' +
    '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<button id="tp-open-tizen-browser" tabindex="0" style="padding:16px 32px;font-size:18px;background:#00a8ff;color:#fff;border:none;border-radius:8px;cursor:pointer;">Open in Tizen Browser</button>' +
      '<button id="tp-back-to-portal" tabindex="0" style="padding:16px 32px;font-size:18px;background:#333;color:#fff;border:2px solid #444;border-radius:8px;cursor:pointer;">Back to Portal</button>' +
    '</div>';
  
  container.appendChild(messageDiv);
  
  // Set up button handlers
  var openBrowserBtn = document.getElementById('tp-open-tizen-browser');
  var backBtn = document.getElementById('tp-back-to-portal');
  
  if (openBrowserBtn) {
    openBrowserBtn.addEventListener('click', function() {
      openInTizenBrowser(card.url);
    });
    openBrowserBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) openInTizenBrowser(card.url);
    });
    // Focus the open browser button
    setTimeout(function() { openBrowserBtn.focus(); }, 100);
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      closeSite();
    });
    backBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) closeSite();
    });
  }
}

/**
 * Open URL in native Tizen browser
 * @param {string} url - URL to open
 */
function openInTizenBrowser(url) {
  log('Opening in Tizen browser: ' + url);
  
  // Try Tizen API first
  if (typeof tizen !== 'undefined' && tizen.application && tizen.application.launchAppControl) {
    try {
      var appControl = new tizen.ApplicationControl(
        'http://tizen.org/appcontrol/operation/view',
        url,
        null,
        null,
        null
      );
      
      tizen.application.launchAppControl(
        appControl,
        null,
        function() {
          log('Tizen browser launched successfully');
          showToast('Opening in browser...');
        },
        function(err) {
          error('Failed to launch Tizen browser: ' + err.name);
          showToast('Failed to open browser');
        }
      );
      return;
    } catch (e) {
      error('Tizen API error: ' + e.message);
    }
  }
  
  // Fallback: try window.open (may not work on Tizen)
  try {
    window.open(url, '_blank');
    showToast('Opening in browser...');
  } catch (e) {
    error('Could not open browser: ' + e.message);
    showToast('Cannot open external browser');
  }
}

/**
 * Close current site and return to portal
 */
function closeSite() {
  log('Closing site');

  // Unload bundle first
  unloadBundle().then(function() {
    log('Bundle unloaded');
  }).catch(function(err) {
    error('Bundle unload error: ' + err.message);
  });

  var container = document.getElementById('tp-iframe-container');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }

  state.currentCard = null;
  state.currentBundle = null;
  state.iframeActive = false;

  showPortal();
  refreshPortal();
}

/**
 * Global TizenPortal API
 * Exposed on window.TizenPortal for bundles and external use
 */
var TizenPortalAPI = {
  // Version
  version: VERSION,

  // Logging
  log: log,
  warn: warn,
  error: error,

  // Configuration
  config: {
    read: configRead,
    write: configWrite,
    onChange: configOnChange,
  },

  // Key constants
  keys: KEYS,

  // Input state
  input: {
    isPointerMode: isPointerActive,
    togglePointer: togglePointer,
    isIMEActive: function() { return false; }, // TODO: implement IME tracking
  },

  // Polyfill info
  polyfills: {
    has: hasPolyfill,
    loaded: getLoadedPolyfills,
  },

  // Site management
  loadSite: loadSite,
  closeSite: closeSite,
  openInTizenBrowser: openInTizenBrowser,
  getCurrentCard: function() {
    return state.currentCard;
  },

  // Bundle system
  bundles: {
    list: getBundleNames,
    getActive: getActiveBundle,
    getActiveName: getActiveBundleName,
  },

  // UI helpers
  showToast: showToast,
  showLoading: showLoading,
  hideLoading: hideLoading,

  // State access (read-only)
  getState: function() {
    return {
      initialized: state.initialized,
      currentCard: state.currentCard,
      currentBundle: state.currentBundle,
      iframeActive: state.iframeActive,
    };
  },

  // Internal API (not for bundle use)
  _internal: {
    state: state,
    init: init,
  },
};

// Expose on window
window.TizenPortal = TizenPortalAPI;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for module use
export default TizenPortalAPI;
