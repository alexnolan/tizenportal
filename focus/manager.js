/**
 * TizenPortal Focus Manager
 * 
 * Track focus across shell and iframe.
 */

/**
 * Currently focused element
 */
var focusedElement = null;

/**
 * Whether focus is in iframe
 */
var focusInIframe = false;

/**
 * Saved focus state for restoration
 */
var savedFocus = null;

/**
 * Focus change listeners
 */
var focusListeners = [];

/**
 * Initialize focus manager
 */
export function initFocusManager() {
  // Track focus changes in document
  document.addEventListener('focusin', function(event) {
    focusedElement = event.target;
    focusInIframe = isElementInIframe(event.target);
    notifyListeners('focusin', event.target);
  }, true);

  document.addEventListener('focusout', function(event) {
    notifyListeners('focusout', event.target);
  }, true);

  console.log('TizenPortal: Focus manager initialized');
}

/**
 * Check if element is inside an iframe
 * @param {Element} element
 * @returns {boolean}
 */
function isElementInIframe(element) {
  try {
    return element.ownerDocument !== document;
  } catch (err) {
    return false;
  }
}

/**
 * Notify listeners of focus change
 * @param {string} type - Event type
 * @param {Element} element - Focused element
 */
function notifyListeners(type, element) {
  var event = { type: type, target: element };
  
  for (var i = 0; i < focusListeners.length; i++) {
    try {
      focusListeners[i](event);
    } catch (err) {
      console.error('TizenPortal: Focus listener error:', err);
    }
  }
}

/**
 * Get currently focused element
 * @returns {Element|null}
 */
export function getFocusedElement() {
  return focusedElement || document.activeElement;
}

/**
 * Check if focus is in iframe
 * @returns {boolean}
 */
export function isFocusInIframe() {
  return focusInIframe;
}

/**
 * Set focus to an element
 * @param {Element} element
 */
export function setFocus(element) {
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
}

/**
 * Move focus to shell (out of iframe)
 */
export function setFocusToShell() {
  var portal = document.getElementById('tp-portal');
  if (portal) {
    var firstFocusable = portal.querySelector('[tabindex="0"]');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }
}

/**
 * Save current focus state
 */
export function saveFocusState() {
  savedFocus = {
    element: focusedElement,
    inIframe: focusInIframe,
  };
}

/**
 * Restore saved focus state
 */
export function restoreFocusState() {
  if (savedFocus && savedFocus.element) {
    try {
      savedFocus.element.focus();
    } catch (err) {
      console.warn('TizenPortal: Could not restore focus:', err);
    }
  }
  savedFocus = null;
}

/**
 * Subscribe to focus changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onFocusChange(callback) {
  if (typeof callback !== 'function') return function() {};

  focusListeners.push(callback);

  return function() {
    var index = focusListeners.indexOf(callback);
    if (index !== -1) {
      focusListeners.splice(index, 1);
    }
  };
}
