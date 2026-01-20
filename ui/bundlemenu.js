/**
 * TizenPortal Bundle Menu
 * 
 * Bundle selection and information panel.
 * Activated with Yellow button (short press).
 */

import { getBundleNames, getBundle } from '../bundles/registry.js';

/**
 * Bundle menu element
 */
var menuElement = null;

/**
 * Is menu currently visible
 */
var isVisible = false;

/**
 * Currently selected bundle index
 */
var selectedIndex = 0;

/**
 * Previous focus element
 */
var previousFocus = null;

/**
 * Get list of available bundles from registry
 * @returns {Array} Array of bundle info objects
 */
function getAvailableBundlesFromRegistry() {
  var names = getBundleNames();
  var bundles = [];
  
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var bundle = getBundle(name);
    if (bundle) {
      bundles.push({
        name: name,
        displayName: bundle.displayName || bundle.name || name,
        description: bundle.description || 'No description',
      });
    }
  }
  
  return bundles;
}

/**
 * Initialize the bundle menu
 */
export function initBundleMenu() {
  if (!document.getElementById('tp-bundlemenu')) {
    createBundleMenu();
  }
  menuElement = document.getElementById('tp-bundlemenu');
}

/**
 * Create the bundle menu DOM elements
 */
function createBundleMenu() {
  var menu = document.createElement('div');
  menu.id = 'tp-bundlemenu';
  menu.className = 'tp-bundlemenu';
  
  menu.innerHTML = '' +
    '<div class="tp-bundlemenu-content">' +
      '<div class="tp-bundlemenu-header">' +
        '<h3>Bundle Selection</h3>' +
        '<button type="button" class="tp-bundlemenu-close" tabindex="0">&times;</button>' +
      '</div>' +
      '<div class="tp-bundlemenu-current"></div>' +
      '<div class="tp-bundlemenu-list"></div>' +
      '<div class="tp-bundlemenu-footer">Press ENTER to select | YELLOW to close</div>' +
    '</div>';
  
  var shell = document.getElementById('tp-shell');
  if (shell) {
    shell.appendChild(menu);
  } else {
    document.body.appendChild(menu);
  }
  
  // Close button handler
  var closeBtn = menu.querySelector('.tp-bundlemenu-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideBundleMenu);
    closeBtn.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) hideBundleMenu();
    });
  }
}

/**
 * Render the bundle list
 */
function renderBundleList() {
  if (!menuElement) return;
  
  var listEl = menuElement.querySelector('.tp-bundlemenu-list');
  var currentEl = menuElement.querySelector('.tp-bundlemenu-current');
  if (!listEl) return;
  
  // Get bundles from registry
  var availableBundles = getAvailableBundlesFromRegistry();
  
  // Get current bundle from state
  var state = window.TizenPortal ? window.TizenPortal.getState() : null;
  var currentBundle = state && state.currentBundle ? state.currentBundle : 'default';
  var currentCard = state && state.currentCard ? state.currentCard : null;
  
  // Update current bundle info
  if (currentEl && currentCard) {
    currentEl.innerHTML = '' +
      '<div class="tp-bundlemenu-site">' +
        '<span class="tp-bundlemenu-label">Site:</span> ' + escapeHtml(currentCard.name) +
      '</div>' +
      '<div class="tp-bundlemenu-active">' +
        '<span class="tp-bundlemenu-label">Active Bundle:</span> ' + escapeHtml(currentBundle) +
      '</div>';
  } else if (currentEl) {
    currentEl.innerHTML = '<div class="tp-bundlemenu-site">No site loaded</div>';
  }
  
  // Render bundle list
  listEl.innerHTML = '';
  
  for (var i = 0; i < availableBundles.length; i++) {
    var bundle = availableBundles[i];
    var isActive = bundle.name === currentBundle;
    var item = document.createElement('div');
    item.className = 'tp-bundlemenu-item' + (isActive ? ' active' : '');
    item.setAttribute('tabindex', '0');
    item.setAttribute('data-bundle', bundle.name);
    item.setAttribute('data-index', i);
    
    item.innerHTML = '' +
      '<div class="tp-bundlemenu-item-name">' + escapeHtml(bundle.displayName) + '</div>' +
      '<div class="tp-bundlemenu-item-desc">' + escapeHtml(bundle.description) + '</div>' +
      (isActive ? '<div class="tp-bundlemenu-item-badge">Active</div>' : '');
    
    // Event handlers
    (function(bundleName, index) {
      item.addEventListener('click', function() {
        selectBundle(bundleName);
      });
      item.addEventListener('keydown', function(e) {
        if (e.keyCode === 13) {
          e.preventDefault();
          selectBundle(bundleName);
        }
      });
      item.addEventListener('focus', function() {
        selectedIndex = index;
      });
    })(bundle.name, i);
    
    listEl.appendChild(item);
  }
}

/**
 * Show the bundle menu
 */
export function showBundleMenu() {
  if (isVisible) return;
  
  // Store previous focus
  previousFocus = document.activeElement;
  
  // Render list
  renderBundleList();
  
  // Show menu
  if (menuElement) {
    menuElement.classList.add('visible');
    isVisible = true;
    
    // Focus first item
    var firstItem = menuElement.querySelector('.tp-bundlemenu-item');
    if (firstItem) {
      firstItem.focus();
    }
  }
  
  console.log('TizenPortal: Bundle menu shown');
}

/**
 * Hide the bundle menu
 */
export function hideBundleMenu() {
  if (!isVisible) return;
  
  if (menuElement) {
    menuElement.classList.remove('visible');
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
  
  console.log('TizenPortal: Bundle menu hidden');
}

/**
 * Toggle bundle menu visibility
 */
export function toggleBundleMenu() {
  if (isVisible) {
    hideBundleMenu();
  } else {
    showBundleMenu();
  }
}

/**
 * Check if bundle menu is visible
 * @returns {boolean}
 */
export function isBundleMenuVisible() {
  return isVisible;
}

/**
 * Select a bundle
 * @param {string} bundleName
 */
function selectBundle(bundleName) {
  console.log('TizenPortal: Selecting bundle:', bundleName);
  
  // Get current card
  var state = window.TizenPortal ? window.TizenPortal.getState() : null;
  if (!state || !state.currentCard) {
    if (window.TizenPortal) {
      window.TizenPortal.showToast('No site loaded');
    }
    hideBundleMenu();
    return;
  }
  
  // Update card bundle (this will be used on reload or can trigger bundle switch)
  state.currentCard.bundle = bundleName;
  
  // TODO: In Phase 4, implement hot bundle switching
  // For now, just notify user they need to reload
  if (window.TizenPortal) {
    window.TizenPortal.showToast('Bundle set to: ' + bundleName + ' (reload to apply)');
  }
  
  hideBundleMenu();
}

/**
 * Cycle to next bundle
 */
export function cycleBundle() {
  var availableBundles = getAvailableBundlesFromRegistry();
  var state = window.TizenPortal ? window.TizenPortal.getState() : null;
  var currentBundle = state && state.currentBundle ? state.currentBundle : 'default';
  
  // Find current index
  var currentIndex = 0;
  for (var i = 0; i < availableBundles.length; i++) {
    if (availableBundles[i].name === currentBundle) {
      currentIndex = i;
      break;
    }
  }
  
  // Cycle to next
  var nextIndex = (currentIndex + 1) % availableBundles.length;
  var nextBundle = availableBundles[nextIndex];
  
  selectBundle(nextBundle.name);
}

/**
 * Get available bundles from registry
 * @returns {Array}
 */
export function getAvailableBundles() {
  return getAvailableBundlesFromRegistry();
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
