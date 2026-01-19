/**
 * TizenPortal Polyfill System
 * 
 * Feature-detection-based polyfill loading.
 * Polyfills are loaded dynamically based on what the browser needs,
 * NOT bundled statically based on target version.
 */

/**
 * List of loaded polyfills
 */
var loaded = [];

/**
 * DOMRect polyfill for Chrome 47
 * Needed for spatial navigation calculations
 */
function polyfillDOMRect() {
  if (typeof window.DOMRect === 'function') {
    return false; // Already exists
  }

  // Basic DOMRect implementation
  window.DOMRect = function DOMRect(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.y + this.height;
    this.right = this.x + this.width;
  };

  window.DOMRect.prototype.toJSON = function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      left: this.left,
      bottom: this.bottom,
      right: this.right,
    };
  };

  window.DOMRect.fromRect = function(rect) {
    rect = rect || {};
    return new window.DOMRect(rect.x, rect.y, rect.width, rect.height);
  };

  return true;
}

/**
 * DOMRectReadOnly polyfill
 */
function polyfillDOMRectReadOnly() {
  if (typeof window.DOMRectReadOnly === 'function') {
    return false; // Already exists
  }

  window.DOMRectReadOnly = function DOMRectReadOnly(x, y, width, height) {
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    this.top = this.y;
    this.left = this.x;
    this.bottom = this.y + this.height;
    this.right = this.x + this.width;
  };

  window.DOMRectReadOnly.prototype.toJSON = function() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      top: this.top,
      left: this.left,
      bottom: this.bottom,
      right: this.right,
    };
  };

  window.DOMRectReadOnly.fromRect = function(rect) {
    rect = rect || {};
    return new window.DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height);
  };

  return true;
}

/**
 * Element.closest polyfill for Chrome 47
 */
function polyfillElementClosest() {
  if (Element.prototype.closest) {
    return false; // Already exists
  }

  Element.prototype.closest = function(selector) {
    var el = this;
    while (el && el.nodeType === 1) {
      if (el.matches(selector)) {
        return el;
      }
      el = el.parentElement || el.parentNode;
    }
    return null;
  };

  return true;
}

/**
 * Element.matches polyfill (needed for closest)
 */
function polyfillElementMatches() {
  if (Element.prototype.matches) {
    return false; // Already exists
  }

  Element.prototype.matches =
    Element.prototype.matchesSelector ||
    Element.prototype.mozMatchesSelector ||
    Element.prototype.msMatchesSelector ||
    Element.prototype.oMatchesSelector ||
    Element.prototype.webkitMatchesSelector ||
    function(selector) {
      var matches = (this.document || this.ownerDocument).querySelectorAll(selector);
      var i = matches.length;
      while (--i >= 0 && matches.item(i) !== this) {}
      return i > -1;
    };

  return true;
}

/**
 * Array.prototype.includes polyfill
 */
function polyfillArrayIncludes() {
  if (Array.prototype.includes) {
    return false; // Already exists
  }

  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    var o = Object(this);
    var len = o.length >>> 0;
    if (len === 0) return false;
    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    while (k < len) {
      if (o[k] === searchElement) return true;
      k++;
    }
    return false;
  };

  return true;
}

/**
 * Object.entries polyfill
 */
function polyfillObjectEntries() {
  if (Object.entries) {
    return false; // Already exists
  }

  Object.entries = function(obj) {
    var ownProps = Object.keys(obj);
    var i = ownProps.length;
    var resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };

  return true;
}

/**
 * Object.values polyfill
 */
function polyfillObjectValues() {
  if (Object.values) {
    return false; // Already exists
  }

  Object.values = function(obj) {
    var vals = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        vals.push(obj[key]);
      }
    }
    return vals;
  };

  return true;
}

/**
 * String.prototype.startsWith polyfill
 */
function polyfillStringStartsWith() {
  if (String.prototype.startsWith) {
    return false; // Already exists
  }

  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };

  return true;
}

/**
 * String.prototype.endsWith polyfill
 */
function polyfillStringEndsWith() {
  if (String.prototype.endsWith) {
    return false; // Already exists
  }

  String.prototype.endsWith = function(searchString, length) {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };

  return true;
}

/**
 * Initialize all polyfills based on feature detection
 * @returns {string[]} List of loaded polyfill names
 */
export function initPolyfills() {
  loaded = [];

  // DOM APIs
  if (polyfillDOMRect()) loaded.push('DOMRect');
  if (polyfillDOMRectReadOnly()) loaded.push('DOMRectReadOnly');
  if (polyfillElementMatches()) loaded.push('Element.matches');
  if (polyfillElementClosest()) loaded.push('Element.closest');

  // Array methods
  if (polyfillArrayIncludes()) loaded.push('Array.includes');

  // Object methods
  if (polyfillObjectEntries()) loaded.push('Object.entries');
  if (polyfillObjectValues()) loaded.push('Object.values');

  // String methods
  if (polyfillStringStartsWith()) loaded.push('String.startsWith');
  if (polyfillStringEndsWith()) loaded.push('String.endsWith');

  return loaded;
}

/**
 * Check if a polyfill was loaded
 * @param {string} name - Polyfill name
 * @returns {boolean}
 */
export function hasPolyfill(name) {
  return loaded.indexOf(name) !== -1;
}

/**
 * Get list of all loaded polyfills
 * @returns {string[]}
 */
export function getLoadedPolyfills() {
  return loaded.slice();
}
