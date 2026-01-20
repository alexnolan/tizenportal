/**
 * TizenPortal Address Bar
 * 
 * Full browser chrome with Home, Back, Forward, Reload, URL, Go.
 * Activated with Red button (short press).
 */

/**
 * Address bar element
 */
var addressBarElement = null;

/**
 * URL input element
 */
var urlInputElement = null;

/**
 * Is address bar currently visible
 */
var isVisible = false;

/**
 * Previous focus element before opening address bar
 */
var previousFocus = null;

/**
 * Initialize the address bar
 */
export function initAddressBar() {
  // Create address bar if it doesn't exist
  if (!document.getElementById('tp-addressbar')) {
    createAddressBar();
  }
  
  addressBarElement = document.getElementById('tp-addressbar');
  urlInputElement = document.getElementById('tp-addressbar-url');
}

/**
 * Create the address bar DOM elements
 */
function createAddressBar() {
  var bar = document.createElement('div');
  bar.id = 'tp-addressbar';
  bar.className = 'tp-addressbar';
  
  bar.innerHTML = '' +
    '<div class="tp-addressbar-content">' +
      // Home button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-home" tabindex="0" title="Home">' +
        '<span class="tp-btn-icon">⌂</span>' +
      '</button>' +
      // Back button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-back" tabindex="0" title="Back">' +
        '<span class="tp-btn-icon">←</span>' +
      '</button>' +
      // Forward button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-forward" tabindex="0" title="Forward">' +
        '<span class="tp-btn-icon">→</span>' +
      '</button>' +
      // Reload button
      '<button type="button" class="tp-addressbar-btn" id="tp-addressbar-reload" tabindex="0" title="Reload">' +
        '<span class="tp-btn-icon">↻</span>' +
      '</button>' +
      // URL input
      '<input type="text" class="tp-addressbar-url" id="tp-addressbar-url" tabindex="0" placeholder="Enter URL...">' +
      // Go button
      '<button type="button" class="tp-addressbar-btn tp-addressbar-go" id="tp-addressbar-go" tabindex="0" title="Go">' +
        '<span class="tp-btn-icon">→</span>' +
      '</button>' +
    '</div>';
  
  // Insert at beginning of shell
  var shell = document.getElementById('tp-shell');
  if (shell) {
    shell.insertBefore(bar, shell.firstChild);
  } else {
    document.body.appendChild(bar);
  }
  
  // Attach event handlers
  attachEventHandlers(bar);
}

/**
 * Attach event handlers to address bar elements
 * @param {HTMLElement} bar
 */
function attachEventHandlers(bar) {
  // Home button
  var homeBtn = bar.querySelector('#tp-addressbar-home');
  if (homeBtn) {
    homeBtn.addEventListener('click', handleHome);
    homeBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleHome();
    });
  }
  
  // Back button
  var backBtn = bar.querySelector('#tp-addressbar-back');
  if (backBtn) {
    backBtn.addEventListener('click', handleBack);
    backBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleBack();
    });
  }
  
  // Forward button
  var forwardBtn = bar.querySelector('#tp-addressbar-forward');
  if (forwardBtn) {
    forwardBtn.addEventListener('click', handleForward);
    forwardBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleForward();
    });
  }
  
  // Reload button
  var reloadBtn = bar.querySelector('#tp-addressbar-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', handleReload);
    reloadBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleReload();
    });
  }
  
  // Go button
  var goBtn = bar.querySelector('#tp-addressbar-go');
  if (goBtn) {
    goBtn.addEventListener('click', handleGo);
    goBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) handleGo();
    });
  }
  
  // URL input - Enter key submits
  var urlInput = bar.querySelector('#tp-addressbar-url');
  if (urlInput) {
    urlInput.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) { // Enter
        e.preventDefault();
        handleGo();
      } else if (e.keyCode === 27 || e.keyCode === 10009) { // Escape or Back
        e.preventDefault();
        hideAddressBar();
      }
    });
  }
}

/**
 * Show the address bar
 */
export function showAddressBar() {
  if (isVisible) return;
  
  // Store previous focus
  previousFocus = document.activeElement;
  
  // Update URL from current iframe
  updateUrlFromIframe();
  
  // Show bar
  if (addressBarElement) {
    addressBarElement.classList.add('visible');
    isVisible = true;
    
    // Focus URL input
    if (urlInputElement) {
      try {
        urlInputElement.focus();
        urlInputElement.select();
      } catch (err) {
        console.warn('TizenPortal: Address bar focus error:', err.message);
      }
    }
  }
  
  console.log('TizenPortal: Address bar shown');
}

/**
 * Hide the address bar
 */
export function hideAddressBar() {
  if (!isVisible) return;
  
  if (addressBarElement) {
    addressBarElement.classList.remove('visible');
    isVisible = false;
  }
  
  // Restore previous focus
  if (previousFocus) {
    try {
      previousFocus.focus();
    } catch (err) {
      // Ignore
    }
    previousFocus = null;
  }
  
  console.log('TizenPortal: Address bar hidden');
}

/**
 * Toggle address bar visibility
 */
export function toggleAddressBar() {
  if (isVisible) {
    hideAddressBar();
  } else {
    showAddressBar();
  }
}

/**
 * Check if address bar is visible
 * @returns {boolean}
 */
export function isAddressBarVisible() {
  return isVisible;
}

/**
 * Update URL input from current iframe
 */
function updateUrlFromIframe() {
  if (!urlInputElement) return;
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      // Try to get actual URL from contentWindow
      var url = iframe.contentWindow.location.href;
      urlInputElement.value = url;
    } catch (err) {
      // Cross-origin - use src attribute instead
      urlInputElement.value = iframe.src || '';
    }
  } else {
    // No iframe - get URL from state
    try {
      var state = window.TizenPortal ? window.TizenPortal.getState() : null;
      if (state && state.currentCard) {
        urlInputElement.value = state.currentCard.url || '';
      } else {
        urlInputElement.value = '';
      }
    } catch (err) {
      urlInputElement.value = '';
    }
  }
}

/**
 * Handle Home button - return to portal
 */
function handleHome() {
  console.log('TizenPortal: Address bar - Home');
  hideAddressBar();
  
  if (window.TizenPortal && window.TizenPortal.closeSite) {
    window.TizenPortal.closeSite();
  }
}

/**
 * Handle Back button - go back in iframe history
 */
function handleBack() {
  console.log('TizenPortal: Address bar - Back');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.history.back();
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Back');
      }
    } catch (err) {
      console.warn('TizenPortal: Cannot go back (cross-origin)');
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot go back');
      }
    }
  }
}

/**
 * Handle Forward button - go forward in iframe history
 */
function handleForward() {
  console.log('TizenPortal: Address bar - Forward');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.history.forward();
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Forward');
      }
    } catch (err) {
      console.warn('TizenPortal: Cannot go forward (cross-origin)');
      if (window.TizenPortal) {
        window.TizenPortal.showToast('Cannot go forward');
      }
    }
  }
}

/**
 * Handle Reload button - reload iframe
 */
function handleReload() {
  console.log('TizenPortal: Address bar - Reload');
  
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Reloading...');
    }
    try {
      iframe.contentWindow.location.reload();
    } catch (err) {
      // Cross-origin - reset src
      var src = iframe.src;
      iframe.src = '';
      iframe.src = src;
    }
  }
}

/**
 * Handle Go button - navigate to URL
 */
function handleGo() {
  if (!urlInputElement) return;
  
  var url = urlInputElement.value.trim();
  if (!url) return;
  
  // Ensure URL has protocol
  if (url.indexOf('://') === -1) {
    // Check if it looks like a domain
    if (url.indexOf('.') !== -1 || url.indexOf('localhost') !== -1) {
      url = 'https://' + url;
    } else {
      // Treat as search (could be expanded to use a search engine)
      url = 'https://' + url;
    }
  }
  
  console.log('TizenPortal: Address bar - Go to:', url);
  
  // Navigate
  var iframe = document.getElementById('tp-iframe');
  if (iframe) {
    try {
      iframe.contentWindow.location.href = url;
    } catch (err) {
      iframe.src = url;
    }
    
    if (window.TizenPortal) {
      window.TizenPortal.showToast('Loading...');
    }
  } else {
    // No iframe - load as new site
    if (window.TizenPortal && window.TizenPortal.loadSite) {
      window.TizenPortal.loadSite({
        name: 'URL',
        url: url,
        bundle: 'default',
        userAgent: 'tizen',
      });
    }
  }
  
  hideAddressBar();
}
