/**
 * TizenPortal Navigation Helpers
 * 
 * Utilities for spatial navigation.
 */

/**
 * Navigation enabled state
 */
var navigationEnabled = true;

/**
 * Programmatically navigate in a direction
 * @param {string} direction - 'left', 'up', 'right', 'down'
 */
export function navigate(direction) {
  if (!navigationEnabled) return;

  // Use the spatial navigation polyfill if available
  if (window.navigate) {
    window.navigate(direction);
    return;
  }

  // Fallback: dispatch keyboard event
  var keyCode;
  switch (direction) {
    case 'left': keyCode = 37; break;
    case 'up': keyCode = 38; break;
    case 'right': keyCode = 39; break;
    case 'down': keyCode = 40; break;
    default: return;
  }

  var event = new KeyboardEvent('keydown', {
    keyCode: keyCode,
    bubbles: true,
  });

  var active = document.activeElement || document.body;
  active.dispatchEvent(event);
}

/**
 * Focus the first focusable element in a container
 * @param {Element} container
 */
export function focusFirst(container) {
  if (!container) return;

  var focusable = container.querySelector(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusable) {
    focusable.focus();
  }
}

/**
 * Focus the last focusable element in a container
 * @param {Element} container
 */
export function focusLast(container) {
  if (!container) return;

  var focusables = container.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusables.length > 0) {
    focusables[focusables.length - 1].focus();
  }
}

/**
 * Get currently focused element
 * @returns {Element|null}
 */
export function getCurrentFocus() {
  return document.activeElement;
}

/**
 * Enable or disable navigation
 * @param {boolean} enabled
 */
export function setNavigationEnabled(enabled) {
  navigationEnabled = !!enabled;
}

/**
 * Check if navigation is enabled
 * @returns {boolean}
 */
export function isNavigationEnabled() {
  return navigationEnabled;
}

/**
 * Scroll element into view if needed
 * @param {Element} element
 * @param {Object} options
 */
export function scrollIntoViewIfNeeded(element, options) {
  if (!element) return;

  options = options || {};
  var behavior = options.behavior || 'smooth';
  var block = options.block || 'nearest';
  var inline = options.inline || 'nearest';

  // Check if element is in viewport
  var rect = element.getBoundingClientRect();
  var inViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  if (!inViewport) {
    // Use scrollIntoView if available
    if (element.scrollIntoView) {
      try {
        element.scrollIntoView({
          behavior: behavior,
          block: block,
          inline: inline,
        });
      } catch (err) {
        // Fallback for older browsers
        element.scrollIntoView(block === 'start');
      }
    }
  }
}
