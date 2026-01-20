/**
 * TizenPortal Iframe Container
 * 
 * Manages iframe lifecycle for loading sites.
 */

import { hidePortal, showPortal } from './portal.js';

/**
 * Currently active iframe element
 */
var activeIframe = null;

/**
 * Currently loaded card
 */
var activeCard = null;

/**
 * Iframe container element
 */
var containerElement = null;

/**
 * Loading element
 */
var loadingElement = null;

/**
 * Initialize the iframe container
 */
export function initIframeContainer() {
  containerElement = document.getElementById('tp-iframe-container');
  loadingElement = document.getElementById('tp-loading');
  
  if (!containerElement) {
    console.error('TizenPortal: Iframe container element not found');
  }
}

/**
 * Load a site in the iframe
 * @param {Object} card - Card with url, name, bundle, userAgent properties
 */
export function loadSite(card) {
  if (!card || !card.url) {
    console.error('TizenPortal: Cannot load site - invalid card');
    return;
  }

  console.log('TizenPortal: Loading site:', card.name, card.url);

  // Show loading indicator
  if (loadingElement) {
    var loadingText = loadingElement.querySelector('#tp-loading-text');
    if (loadingText) {
      loadingText.textContent = 'Loading ' + card.name + '...';
    }
    loadingElement.classList.add('active');
  }

  // Hide portal
  hidePortal();

  // Cleanup existing iframe if any
  if (activeIframe) {
    try {
      containerElement.removeChild(activeIframe);
    } catch (err) {
      // Ignore
    }
    activeIframe = null;
  }

  // Create new iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'tp-iframe';
  
  // Apply user agent override if needed
  // Note: This only works for same-origin or with specific browser capabilities
  // For cross-origin, the user agent is set at the request level
  
  // Set sandbox permissions
  // allow-scripts: Run JavaScript
  // allow-same-origin: Required for most SPAs
  // allow-forms: Allow form submissions (login, etc.)
  // allow-popups: Allow popup windows if needed
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
  
  // Store active card
  activeCard = card;
  
  // Handle load event
  iframe.addEventListener('load', function() {
    console.log('TizenPortal: Iframe loaded:', card.url);
    
    // Hide loading indicator
    if (loadingElement) {
      loadingElement.classList.remove('active');
    }
    
    // Trigger bundle loading (will be implemented in Phase 4)
    onIframeLoad(iframe, card);
  });
  
  // Handle error event
  iframe.addEventListener('error', function(event) {
    console.error('TizenPortal: Iframe error:', event);
    
    // Hide loading indicator
    if (loadingElement) {
      loadingElement.classList.remove('active');
    }
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Failed to load site');
    }
  });
  
  // Set source and add to container
  iframe.src = card.url;
  containerElement.appendChild(iframe);
  activeIframe = iframe;
  
  // Show container
  containerElement.style.display = 'block';
  
  // Focus iframe for input handling
  try {
    iframe.focus();
  } catch (err) {
    // Cross-origin focus may fail
  }
}

/**
 * Unload the current site and return to portal
 */
export function unloadSite() {
  console.log('TizenPortal: Unloading site');
  
  // Trigger deactivate hook (Phase 4)
  if (activeIframe && activeCard) {
    onIframeUnload(activeIframe, activeCard);
  }
  
  // Remove iframe
  if (activeIframe && containerElement) {
    try {
      containerElement.removeChild(activeIframe);
    } catch (err) {
      // Ignore
    }
  }
  
  // Clear state
  activeIframe = null;
  activeCard = null;
  
  // Hide container
  if (containerElement) {
    containerElement.style.display = 'none';
  }
  
  // Show portal
  showPortal();
}

/**
 * Get the currently active iframe
 * @returns {HTMLIFrameElement|null}
 */
export function getActiveIframe() {
  return activeIframe;
}

/**
 * Get the currently active card
 * @returns {Object|null}
 */
export function getActiveCard() {
  return activeCard;
}

/**
 * Check if a site is currently loaded
 * @returns {boolean}
 */
export function isSiteLoaded() {
  return activeIframe !== null;
}

/**
 * Reload the current site
 */
export function reloadSite() {
  if (!activeIframe) {
    console.warn('TizenPortal: No site loaded to reload');
    return;
  }
  
  console.log('TizenPortal: Reloading site');
  
  try {
    activeIframe.contentWindow.location.reload();
  } catch (err) {
    // Cross-origin - reload by resetting src
    var src = activeIframe.src;
    activeIframe.src = '';
    activeIframe.src = src;
  }
}

/**
 * Navigate to a new URL in the current iframe
 * @param {string} url
 */
export function navigateTo(url) {
  if (!activeIframe) {
    console.warn('TizenPortal: No iframe to navigate');
    return;
  }
  
  console.log('TizenPortal: Navigating to:', url);
  
  try {
    activeIframe.contentWindow.location.href = url;
  } catch (err) {
    // Cross-origin - set src directly
    activeIframe.src = url;
  }
}

/**
 * Called when iframe finishes loading
 * @param {HTMLIFrameElement} iframe
 * @param {Object} card
 */
function onIframeLoad(iframe, card) {
  // Expose TizenPortal API to iframe (same-origin only)
  try {
    var contentWindow = iframe.contentWindow;
    if (contentWindow) {
      // Inject minimal API
      contentWindow.TizenPortal = {
        version: window.TizenPortal ? window.TizenPortal.version : '0105',
        log: function(msg) { console.log('[Bundle]', msg); },
        warn: function(msg) { console.warn('[Bundle]', msg); },
        error: function(msg) { console.error('[Bundle]', msg); },
        config: window.TizenPortal ? window.TizenPortal.config : null,
        input: window.TizenPortal ? window.TizenPortal.input : null,
      };
      console.log('TizenPortal: API injected into iframe');
    }
  } catch (err) {
    console.log('TizenPortal: Cannot inject API (cross-origin)');
  }
  
  // Trigger bundle onAfterLoad (Phase 4)
  if (window.TizenPortal && window.TizenPortal._onIframeLoad) {
    window.TizenPortal._onIframeLoad(iframe, card);
  }
}

/**
 * Called before iframe is removed
 * @param {HTMLIFrameElement} iframe
 * @param {Object} card
 */
function onIframeUnload(iframe, card) {
  // Trigger bundle onDeactivate (Phase 4)
  if (window.TizenPortal && window.TizenPortal._onIframeUnload) {
    window.TizenPortal._onIframeUnload(iframe, card);
  }
}
