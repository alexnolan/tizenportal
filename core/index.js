/**
 * TizenPortal Core Runtime
 * 
 * Main entry point. Initializes all subsystems and exposes the global API.
 * Runs on both the portal page and injected into target sites.
 * 
 * @version 0200
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
import { initDiagnosticsPanel, showDiagnosticsPanel, hideDiagnosticsPanel } from '../ui/diagnostics.js';
import { loadBundle, unloadBundle, getActiveBundle, getActiveBundleName, handleBundleKeyDown } from './loader.js';
import { getBundleNames, getBundle } from '../bundles/registry.js';

/**
 * TizenPortal version - injected from package.json at build time
 */
const VERSION = '__VERSION__';

/**
 * Early debug HUD - shows immediately before full init
 * This helps debug whether the script is loading at all
 */
function tpHud(msg) {
  try {
    var h = document.getElementById('tp-hud');
    if (!h) {
      h = document.createElement('div');
      h.id = 'tp-hud';
      h.style.cssText = 'position:fixed;top:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;padding:10px;font-size:12px;font-family:monospace;z-index:2147483647;border-left:2px solid #0f0;border-bottom:2px solid #0f0;max-width:400px;word-break:break-all;';
      // Append to documentElement if body doesn't exist yet
      (document.body || document.documentElement).appendChild(h);
    }
    h.textContent = '[TP ' + VERSION + '] ' + msg;
    // Auto-hide after 8 seconds
    if (h._timer) clearTimeout(h._timer);
    h._timer = setTimeout(function() { 
      if (h) h.style.opacity = '0.3'; 
    }, 8000);
  } catch (e) {
    // Silently fail
  }
}

// Show HUD immediately when script loads
tpHud('Script loaded, waiting for DOM...');

/**
 * Application state
 */
const state = {
  initialized: false,
  isPortalPage: false, // true when on portal, false when injected into site
  currentCard: null,
  currentBundle: null,
  siteActive: false,
};

/**
 * Check if we're on the portal page vs injected into a target site
 */
function detectContext() {
  // If tp-shell exists, we're on the portal page
  return !!document.getElementById('tp-shell');
}

/**
 * Initialize TizenPortal
 */
async function init() {
  if (state.initialized) {
    warn('TizenPortal already initialized');
    return;
  }

  // Detect where we are
  state.isPortalPage = detectContext();
  tpHud(state.isPortalPage ? 'Portal page' : 'Target site');
  
  log('TizenPortal ' + VERSION + ' initializing...');

  try {
    // Step 1: Initialize polyfills
    tpHud('Loading polyfills...');
    const loadedPolyfills = await initPolyfills();
    log('Polyfills loaded: ' + (loadedPolyfills.length > 0 ? loadedPolyfills.join(', ') : 'none needed'));
    log('Spatial nav: window.navigate=' + (typeof window.navigate) + ', __spatialNavigation__=' + (typeof window.__spatialNavigation__));

    // Step 2: Initialize configuration
    tpHud('Config init...');
    configInit();
    log('Configuration initialized');

    // Step 3: Initialize diagnostics (console capture)
    initDiagnostics();
    log('Diagnostics initialized');

    // Step 4: Initialize diagnostics panel UI
    initDiagnosticsPanel();
    log('Diagnostics panel initialized');

    // Step 5: Initialize pointer/mouse mode
    initPointer();
    log('Pointer mode initialized');

    // Step 6: Initialize input handler
    initInputHandler();
    log('Input handler initialized');

    if (state.isPortalPage) {
      // Portal-specific initialization
      await initPortalPage();
    } else {
      // Target site initialization
      await initTargetSite();
    }

    state.initialized = true;
    tpHud('Ready!');
    log('TizenPortal ' + VERSION + ' ready');
    showToast('TizenPortal ' + VERSION);

  } catch (err) {
    error('Initialization failed: ' + err.message);
    console.error(err);
  }
}

/**
 * Initialize when on the portal page
 */
async function initPortalPage() {
  // Initialize modal system
  initModal();
  log('Modal system initialized');

  // Initialize site editor
  initSiteEditor();
  log('Site editor initialized');

  // Initialize address bar
  initAddressBar();
  log('Address bar initialized');

  // Initialize bundle menu
  initBundleMenu();
  log('Bundle menu initialized');

  // Initialize and render portal UI (card grid)
  initPortal();
  log('Portal UI initialized');

  // Initialize color button hints (make clickable)
  initColorHints();
  log('Color hints initialized');
}

/**
 * Initialize when injected into a target site
 */
async function initTargetSite() {
  tpHud('Finding card...');
  
  // Try to get card config from URL hash first, then localStorage
  var matchedCard = null;
  
  // Try URL hash (passed by portal when navigating)
  var hashCard = getCardFromHash();
  if (hashCard) {
    log('Card from URL hash: ' + hashCard.name);
    matchedCard = hashCard;
    tpHud('Card (hash): ' + hashCard.name);
    // Clear hash after reading (clean URL)
    try {
      var cleanUrl = window.location.href.replace(/[#&]tp=[^&#]+/, '');
      history.replaceState(null, document.title, cleanUrl);
    } catch (e) {
      // Ignore - some sites may block history manipulation
    }
  }
  
  // Fallback to localStorage match
  if (!matchedCard) {
    matchedCard = findMatchingCard(window.location.href);
    if (matchedCard) {
      log('Matched card from localStorage: ' + matchedCard.name + ' (bundle: ' + (matchedCard.bundle || 'default') + ')');
      tpHud('Card (storage): ' + matchedCard.name);
    }
  }
  
  // Final fallback - create pseudo-card
  if (!matchedCard) {
    log('No matching card for: ' + window.location.href);
    tpHud('No card - using default');
    matchedCard = {
      name: document.title || 'Unknown Site',
      url: window.location.href,
      bundle: 'default'
    };
  }
  
  state.currentCard = matchedCard;

  // Apply bundle to the current page
  tpHud('Applying bundle...');
  await applyBundleToPage(matchedCard);

  // Create overlay UI (address bar, diagnostics, etc.)
  createSiteOverlay();
}

/**
 * Extract card config from URL hash
 * Format: #tp=BASE64(JSON) or &tp=BASE64(JSON)
 * @returns {Object|null} Card object or null
 */
function getCardFromHash() {
  try {
    var hash = window.location.hash;
    if (!hash) return null;
    
    // Look for tp= parameter in hash
    var match = hash.match(/[#&]tp=([^&]+)/);
    if (!match || !match[1]) return null;
    
    // Decode base64 JSON
    var decoded = atob(match[1]);
    var cardData = JSON.parse(decoded);
    
    // Add current URL to card
    cardData.url = window.location.href.replace(/[#&]tp=[^&#]+/, '');
    
    log('Decoded card from hash: ' + JSON.stringify(cardData));
    return cardData;
  } catch (e) {
    error('Failed to parse hash card: ' + e.message);
    return null;
  }
}

/**
 * Find a card that matches the given URL
 * @param {string} url - URL to match
 * @returns {Object|null} Matching card or null
 */
function findMatchingCard(url) {
  var apps = [];
  try {
    apps = JSON.parse(localStorage.getItem('tp_apps') || '[]');
  } catch (e) {
    return null;
  }
  
  if (!Array.isArray(apps) || apps.length === 0) {
    return null;
  }
  
  // Normalize URL for comparison
  var normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  
  for (var i = 0; i < apps.length; i++) {
    var card = apps[i];
    if (!card.url) continue;
    
    var cardUrl = card.url.toLowerCase().replace(/\/$/, '');
    
    // Check if current URL starts with card URL (handles subpages)
    if (normalizedUrl.indexOf(cardUrl) === 0) {
      return card;
    }
    
    // Also check if card URL starts with current URL (handles base domain matching)
    if (cardUrl.indexOf(normalizedUrl.split('?')[0].split('#')[0]) === 0) {
      return card;
    }
  }
  
  return null;
}

/**
 * Apply bundle directly to the current page (MOD mode)
 * @param {Object} card - Card with bundle info
 */
async function applyBundleToPage(card) {
  var bundleName = card.bundle || 'default';
  var bundle = getBundle(bundleName);
  
  if (!bundle) {
    log('Bundle not found: ' + bundleName + ', using default');
    bundle = getBundle('default');
  }
  
  if (!bundle) {
    warn('No bundle available');
    return;
  }
  
  log('Applying bundle: ' + bundle.name);
  state.currentBundle = bundle.name;
  
  // Inject bundle CSS
  if (bundle.css) {
    var style = document.createElement('style');
    style.id = 'tp-bundle-css';
    style.textContent = bundle.css;
    document.head.appendChild(style);
    log('Bundle CSS injected');
  }
  
  // Call lifecycle hooks with window instead of iframe
  try {
    if (bundle.onBeforeLoad) {
      bundle.onBeforeLoad(window, card);
    }
  } catch (e) {
    error('onBeforeLoad error: ' + e.message);
  }
  
  // Wait for DOM ready if needed
  if (document.readyState === 'loading') {
    await new Promise(function(resolve) {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  try {
    if (bundle.onAfterLoad) {
      bundle.onAfterLoad(window, card);
    }
  } catch (e) {
    error('onAfterLoad error: ' + e.message);
  }
  
  try {
    if (bundle.onActivate) {
      bundle.onActivate(window, card);
    }
  } catch (e) {
    error('onActivate error: ' + e.message);
  }
  
  log('Bundle applied successfully');
}

/**
 * Create overlay UI for target sites
 * Full-featured overlay with address bar, diagnostics, navigation
 */
function createSiteOverlay() {
  // Main overlay container
  var overlay = document.createElement('div');
  overlay.id = 'tp-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';
  
  // ========== Address Bar ==========
  var addressBar = document.createElement('div');
  addressBar.id = 'tp-site-addressbar';
  addressBar.style.cssText = 'display:none;position:absolute;top:0;left:0;right:0;height:60px;background:linear-gradient(180deg,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.9) 100%);border-bottom:2px solid #00a8ff;pointer-events:auto;';
  addressBar.innerHTML = [
    '<div style="display:flex;align-items:center;height:100%;padding:0 20px;gap:12px;">',
    '  <button id="tp-btn-home" style="width:44px;height:44px;background:linear-gradient(145deg,#1a1a2e,#0d0d1a);border:2px solid #00a8ff;border-radius:8px;color:#00a8ff;font-size:20px;cursor:pointer;transition:all 0.15s;" title="Return to Portal">🏠</button>',
    '  <button id="tp-btn-back" style="width:44px;height:44px;background:linear-gradient(145deg,#1a1a2e,#0d0d1a);border:2px solid #444;border-radius:8px;color:#fff;font-size:20px;cursor:pointer;transition:all 0.15s;" title="Back">←</button>',
    '  <button id="tp-btn-fwd" style="width:44px;height:44px;background:linear-gradient(145deg,#1a1a2e,#0d0d1a);border:2px solid #444;border-radius:8px;color:#fff;font-size:20px;cursor:pointer;transition:all 0.15s;" title="Forward">→</button>',
    '  <button id="tp-btn-reload" style="width:44px;height:44px;background:linear-gradient(145deg,#1a1a2e,#0d0d1a);border:2px solid #444;border-radius:8px;color:#fff;font-size:20px;cursor:pointer;transition:all 0.15s;" title="Reload">↻</button>',
    '  <input id="tp-site-url" type="text" style="flex:1;height:44px;background:#000;border:2px solid #333;border-radius:8px;color:#fff;padding:0 16px;font-size:16px;font-family:monospace;" value="' + window.location.href + '">',
    '  <div style="color:#666;font-size:12px;padding:0 8px;">' + (state.currentCard ? state.currentCard.name : 'Unknown') + '</div>',
    '</div>'
  ].join('');
  overlay.appendChild(addressBar);
  
  // ========== Diagnostics Panel ==========
  var diagPanel = document.createElement('div');
  diagPanel.id = 'tp-site-diagnostics';
  diagPanel.style.cssText = 'display:none;position:absolute;top:20px;right:20px;width:600px;max-height:80%;background:rgba(0,0,0,0.95);border:2px solid #00a8ff;border-radius:12px;pointer-events:auto;overflow:hidden;box-shadow:0 8px 32px rgba(0,168,255,0.3);';
  diagPanel.innerHTML = [
    '<div style="background:linear-gradient(90deg,#00a8ff,#0066cc);color:#fff;padding:16px 20px;font-weight:bold;font-size:16px;display:flex;justify-content:space-between;align-items:center;">',
    '  <span>TizenPortal ' + VERSION + '</span>',
    '  <span style="font-weight:normal;font-size:12px;opacity:0.8;">Diagnostics</span>',
    '</div>',
    '<div id="tp-site-diag-info" style="padding:16px 20px;border-bottom:1px solid #333;font-size:13px;color:#aaa;background:#0a0a0f;">',
    '  <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;">',
    '    <span style="color:#666;">URL:</span><span style="color:#fff;word-break:break-all;">' + window.location.href.substring(0, 80) + (window.location.href.length > 80 ? '...' : '') + '</span>',
    '    <span style="color:#666;">Card:</span><span style="color:#00a8ff;">' + (state.currentCard ? state.currentCard.name : 'None') + '</span>',
    '    <span style="color:#666;">Bundle:</span><span style="color:#0f0;">' + (state.currentBundle || 'default') + '</span>',
    '  </div>',
    '</div>',
    '<div id="tp-site-diag-log" style="padding:12px 20px;max-height:400px;overflow-y:auto;font-size:12px;font-family:monospace;background:#050508;"></div>',
    '<div style="padding:16px 20px;display:flex;gap:12px;background:#0a0a0f;border-top:1px solid #222;">',
    '  <button id="tp-btn-portal" style="flex:1;padding:14px;background:linear-gradient(145deg,#00a8ff,#0066cc);border:none;border-radius:8px;color:#fff;font-size:15px;font-weight:bold;cursor:pointer;">Return to Portal</button>',
    '  <button id="tp-btn-clear-log" style="flex:1;padding:14px;background:#222;border:2px solid #444;border-radius:8px;color:#fff;font-size:15px;cursor:pointer;">Clear Logs</button>',
    '  <button id="tp-btn-close-diag" style="flex:1;padding:14px;background:#333;border:none;border-radius:8px;color:#fff;font-size:15px;cursor:pointer;">Close</button>',
    '</div>'
  ].join('');
  overlay.appendChild(diagPanel);
  
  // ========== Toast ==========
  var toast = document.createElement('div');
  toast.id = 'tp-site-toast';
  toast.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.95);color:#fff;padding:16px 32px;border-radius:12px;font-size:18px;opacity:0;transition:opacity 0.3s;pointer-events:none;border:1px solid #333;';
  overlay.appendChild(toast);
  
  // ========== Color Button Hints ==========
  var hints = document.createElement('div');
  hints.id = 'tp-site-hints';
  hints.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:flex;gap:24px;background:rgba(0,0,0,0.8);padding:12px 24px;border-radius:12px;pointer-events:none;';
  hints.innerHTML = [
    '<div style="display:flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:#e91e63;border-radius:4px;"></div><span style="color:#fff;font-size:13px;">Address</span></div>',
    '<div style="display:flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:#4caf50;border-radius:4px;"></div><span style="color:#fff;font-size:13px;">Mouse</span></div>',
    '<div style="display:flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:#ffeb3b;border-radius:4px;"></div><span style="color:#fff;font-size:13px;">Portal</span></div>',
    '<div style="display:flex;align-items:center;gap:8px;"><div style="width:24px;height:24px;background:#2196f3;border-radius:4px;"></div><span style="color:#fff;font-size:13px;">Diagnostics</span></div>',
  ].join('');
  overlay.appendChild(hints);
  
  // Add to page
  document.body.appendChild(overlay);
  
  // ========== Wire up event handlers ==========
  document.getElementById('tp-btn-home').addEventListener('click', returnToPortal);
  document.getElementById('tp-btn-back').addEventListener('click', function() { history.back(); });
  document.getElementById('tp-btn-fwd').addEventListener('click', function() { history.forward(); });
  document.getElementById('tp-btn-reload').addEventListener('click', function() { location.reload(); });
  document.getElementById('tp-site-url').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
      window.location.href = this.value;
    }
  });
  document.getElementById('tp-btn-portal').addEventListener('click', returnToPortal);
  document.getElementById('tp-btn-clear-log').addEventListener('click', function() {
    document.getElementById('tp-site-diag-log').innerHTML = '';
  });
  document.getElementById('tp-btn-close-diag').addEventListener('click', function() {
    diagPanel.style.display = 'none';
  });
  
  // Store references for toggling
  window._tpSiteAddressBar = addressBar;
  window._tpSiteDiagnostics = diagPanel;
  window._tpSiteToast = toast;
  window._tpSiteHints = hints;
  
  log('Site overlay created');
}

/**
 * Toggle site overlay address bar
 */
function toggleSiteAddressBar() {
  var bar = window._tpSiteAddressBar;
  if (bar) {
    var visible = bar.style.display !== 'none';
    bar.style.display = visible ? 'none' : 'block';
    if (!visible) {
      var urlInput = document.getElementById('tp-site-url');
      if (urlInput) urlInput.focus();
    }
  }
}

/**
 * Toggle site overlay diagnostics panel
 */
function toggleSiteDiagnostics() {
  var diag = window._tpSiteDiagnostics;
  if (diag) {
    diag.style.display = diag.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Return to the TizenPortal portal
 */
function returnToPortal() {
  log('Returning to portal...');
  // Navigate to portal using absolute URL (works from any site)
  window.location.href = 'https://alexnolan.github.io/tizenportal/dist/index.html';
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
 * Load a site - navigates the browser to the site URL
 * Builds payload with CSS/JS from bundle and passes via URL hash
 * The dist/userScript.js mod will read and apply this
 * @param {Object} card - Card object with url, bundle, etc.
 */
function loadSite(card) {
  if (!card || !card.url) {
    error('Cannot load site: invalid card');
    return;
  }

  log('Navigating to site: ' + card.url);
  showToast('Loading ' + (card.name || card.url) + '...');

  // Store current card in state
  state.currentCard = card;
  
  // Get the bundle for this card
  var bundleName = card.bundle || 'default';
  var bundle = getBundle(bundleName);
  
  // Build payload in the format userScript.js expects: { css, js, ua }
  var targetUrl = card.url;
  try {
    var payload = {
      css: '',
      js: '',
      ua: ''
    };
    
    // Add bundle CSS
    if (bundle && bundle.style) {
      payload.css = bundle.style;
    }
    
    // Add bundle JS initialization code (if needed)
    // The bundle object has methods, so we can't directly serialize it
    // Instead, pass bundle name and let userScript look it up if needed
    payload.bundleName = bundleName;
    payload.cardName = card.name;
    
    // Encode payload
    var json = JSON.stringify(payload);
    var encoded = btoa(unescape(encodeURIComponent(json)));
    
    // Append to URL hash
    if (targetUrl.indexOf('#') === -1) {
      targetUrl += '#tp=' + encoded;
    } else {
      targetUrl += '&tp=' + encoded;
    }
    
    log('Payload size: ' + json.length + ' bytes, encoded: ' + encoded.length);
  } catch (e) {
    error('Failed to encode payload: ' + e.message);
    // Continue without hash
  }
  
  log('Final URL: ' + targetUrl.substring(0, 100) + '...');
  
  // Navigate to the site - userScript.js mod will handle injection
  window.location.href = targetUrl;
}

/**
 * Close current site and return to portal
 */
function closeSite() {
  log('Closing site, returning to portal');
  returnToPortal();
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
function showToast(message, duration) {
  duration = duration || 3000;
  
  // On target sites, use the site overlay toast
  if (!state.isPortalPage) {
    var toast = window._tpSiteToast || document.getElementById('tp-site-toast');
    if (toast) {
      toast.textContent = message;
      toast.style.opacity = '1';
      setTimeout(function() {
        toast.style.opacity = '0';
      }, duration);
      return;
    }
    // Fallback: create temporary toast
    var tempToast = document.createElement('div');
    tempToast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.95);color:#fff;padding:16px 32px;border-radius:12px;font-size:18px;z-index:2147483647;transition:opacity 0.3s;';
    tempToast.textContent = message;
    document.body.appendChild(tempToast);
    setTimeout(function() {
      tempToast.style.opacity = '0';
      setTimeout(function() { tempToast.remove(); }, 300);
    }, duration);
    return;
  }
  
  // On portal page, use existing toast element
  var toast = document.getElementById('tp-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(function() {
    toast.classList.remove('visible');
  }, duration);
}

/**
 * Show loading overlay (portal page only)
 * @param {string} text - Loading text to display
 */
function showLoading(text) {
  if (!state.isPortalPage) return;
  
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
 * Hide loading overlay (portal page only)
 */
function hideLoading() {
  if (!state.isPortalPage) return;
  
  var loading = document.getElementById('tp-loading');
  if (loading) {
    loading.classList.remove('active');
  }
}

/**
 * Global TizenPortal API
 * Exposed on window.TizenPortal for bundles and external use
 */
var TizenPortalAPI = {
  // Version
  version: VERSION,

  // Context (portal page or target site)
  get isPortalPage() { return state.isPortalPage; },

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
  returnToPortal: returnToPortal,
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
  
  // Site overlay controls
  toggleSiteAddressBar: toggleSiteAddressBar,
  toggleSiteDiagnostics: toggleSiteDiagnostics,

  // State access (read-only)
  getState: function() {
    return {
      initialized: state.initialized,
      isPortalPage: state.isPortalPage,
      currentCard: state.currentCard,
      currentBundle: state.currentBundle,
      siteActive: state.siteActive,
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
