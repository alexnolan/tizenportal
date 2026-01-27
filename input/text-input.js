/**
 * TizenPortal Text Input Handling
 * 
 * TV-friendly text input handling. On TV, we don't want the keyboard to pop up
 * immediately when navigating to an input field. Instead, show a display value
 * and only activate the keyboard when user presses Enter.
 * 
 * Usage:
 *   import { wrapTextInputs, unwrapTextInputs } from '../input/text-input.js';
 *   
 *   // Wrap all inputs matching selector
 *   wrapTextInputs('input[type="text"], input[type="search"]');
 *   
 *   // Or wrap with custom options
 *   wrapTextInputs('input', {
 *     onActivate: function(input) { ... },
 *     onDeactivate: function(input) { ... },
 *   });
 */

import { KEYS } from './keys.js';

/**
 * Track wrapped inputs to avoid re-wrapping
 */
var wrappedInputs = new WeakMap();

/**
 * Default options
 */
var defaultOptions = {
  wrapperClass: 'tp-input-wrapper',
  displayClass: 'tp-input-display',
  activeClass: 'editing',
  hasValueClass: 'has-value',
  defaultPlaceholder: 'Enter text...',
  onActivate: null,
  onDeactivate: null,
};

/**
 * Wrap text inputs for TV-friendly keyboard handling
 * @param {string} selector - CSS selector for inputs to wrap
 * @param {Object} options - Configuration options
 * @returns {number} Number of inputs wrapped
 */
export function wrapTextInputs(selector, options) {
  var opts = Object.assign({}, defaultOptions, options || {});
  var inputs = document.querySelectorAll(selector);
  var count = 0;
  
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    
    // Skip if already wrapped
    if (wrappedInputs.has(input) || input.classList.contains('tp-wrapped')) {
      continue;
    }
    
    // Skip hidden inputs
    if (input.type === 'hidden' || input.closest('[style*="display: none"]')) {
      continue;
    }
    
    wrapSingleInput(input, opts);
    count++;
  }
  
  if (count > 0) {
    console.log('TizenPortal [TextInput]: Wrapped', count, 'inputs');
  }
  
  return count;
}

/**
 * Wrap a single text input
 * @param {HTMLInputElement} input
 * @param {Object} opts
 */
function wrapSingleInput(input, opts) {
  // Create wrapper
  var wrapper = document.createElement('div');
  wrapper.className = opts.wrapperClass;
  wrapper.setAttribute('tabindex', '0');
  
  // Create display element
  var display = document.createElement('span');
  display.className = opts.displayClass;
  var placeholder = input.getAttribute('placeholder') || opts.defaultPlaceholder;
  display.textContent = input.value || placeholder;
  if (input.value) {
    display.classList.add(opts.hasValueClass);
  }
  
  // Insert wrapper before input
  input.parentNode.insertBefore(wrapper, input);
  
  // Move input inside wrapper
  wrapper.appendChild(display);
  wrapper.appendChild(input);
  
  // Mark input as wrapped
  input.classList.add('tp-wrapped');
  input.setAttribute('tabindex', '-1');
  wrappedInputs.set(input, { wrapper: wrapper, display: display, opts: opts });
  
  // Handle wrapper activation (Enter key or click)
  wrapper.addEventListener('keydown', function(e) {
    if (e.keyCode === KEYS.ENTER) {
      e.preventDefault();
      e.stopPropagation();
      activateInput(input);
    }
  });
  
  wrapper.addEventListener('click', function() {
    activateInput(input);
  });
  
  // Handle input deactivation
  input.addEventListener('blur', function() {
    deactivateInput(input);
  });
  
  input.addEventListener('keydown', function(e) {
    // Escape or Back - deactivate and return to wrapper
    if (e.keyCode === 27 || e.keyCode === KEYS.BACK) {
      e.preventDefault();
      deactivateInput(input);
      wrapper.focus();
    } else if (e.keyCode === KEYS.ENTER) {
      // Enter - submit and deactivate
      setTimeout(function() {
        deactivateInput(input);
      }, 100);
    }
  });
  
  // Sync display when input changes
  input.addEventListener('input', function() {
    display.textContent = input.value || placeholder;
    if (input.value) {
      display.classList.add(opts.hasValueClass);
    } else {
      display.classList.remove(opts.hasValueClass);
    }
  });
}

/**
 * Activate an input for editing
 * @param {HTMLInputElement} input
 */
export function activateInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  var display = data.display;
  var opts = data.opts;
  
  wrapper.classList.add(opts.activeClass);
  display.style.display = 'none';
  input.style.display = 'block';
  input.setAttribute('tabindex', '0');
  
  try {
    input.focus();
    input.select();
  } catch (err) {
    console.warn('TizenPortal [TextInput]: Focus error:', err.message);
  }
  
  // Call custom handler
  if (typeof opts.onActivate === 'function') {
    opts.onActivate(input);
  }
  
  console.log('TizenPortal [TextInput]: Input activated');
}

/**
 * Deactivate an input (return to display mode)
 * @param {HTMLInputElement} input
 */
export function deactivateInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  var display = data.display;
  var opts = data.opts;
  
  if (!wrapper.classList.contains(opts.activeClass)) return;
  
  wrapper.classList.remove(opts.activeClass);
  var placeholder = input.getAttribute('placeholder') || opts.defaultPlaceholder;
  display.textContent = input.value || placeholder;
  display.style.display = 'block';
  input.style.display = 'none';
  input.setAttribute('tabindex', '-1');
  
  if (input.value) {
    display.classList.add(opts.hasValueClass);
  } else {
    display.classList.remove(opts.hasValueClass);
  }
  
  // Call custom handler
  if (typeof opts.onDeactivate === 'function') {
    opts.onDeactivate(input);
  }
  
  console.log('TizenPortal [TextInput]: Input deactivated');
}

/**
 * Unwrap a previously wrapped input
 * @param {HTMLInputElement} input
 */
export function unwrapInput(input) {
  var data = wrappedInputs.get(input);
  if (!data) return;
  
  var wrapper = data.wrapper;
  
  // Move input back out of wrapper
  wrapper.parentNode.insertBefore(input, wrapper);
  wrapper.parentNode.removeChild(wrapper);
  
  // Restore input state
  input.classList.remove('tp-wrapped');
  input.removeAttribute('tabindex');
  input.style.display = '';
  
  wrappedInputs.delete(input);
  console.log('TizenPortal [TextInput]: Input unwrapped');
}

/**
 * Unwrap all inputs matching selector
 * @param {string} selector
 */
export function unwrapTextInputs(selector) {
  var inputs = document.querySelectorAll(selector);
  
  for (var i = 0; i < inputs.length; i++) {
    unwrapInput(inputs[i]);
  }
}

/**
 * Check if an input is currently active (editing)
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
export function isInputActive(input) {
  var data = wrappedInputs.get(input);
  if (!data) return false;
  return data.wrapper.classList.contains(data.opts.activeClass);
}

/**
 * Check if an input is wrapped
 * @param {HTMLInputElement} input
 * @returns {boolean}
 */
export function isInputWrapped(input) {
  return wrappedInputs.has(input);
}
