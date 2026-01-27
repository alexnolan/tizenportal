/**
 * Audiobookshelf Bundle for TizenPortal
 * 
 * TV support for Audiobookshelf (https://www.audiobookshelf.org/)
 * 
 * ============================================================================
 * BUNDLE BEST PRACTICES DEMONSTRATED
 * ============================================================================
 * 
 * This bundle is an exemplary example of how to create a TizenPortal bundle
 * for a complex SPA website. It demonstrates:
 * 
 * 1. USE CORE UTILITIES
 *    Import from focus/manager.js and input/text-input.js instead of
 *    reimplementing common TV patterns.
 * 
 * 2. OVERRIDE VIA registerKeyHandler()
 *    Register a custom key handler that runs BEFORE core handlers.
 *    Return true to consume the event, false to let core handle it.
 * 
 * 3. SITE-SPECIFIC SELECTORS
 *    Define CSS selectors for the target site's DOM structure in one place.
 *    Update these when the site changes its HTML.
 * 
 * 4. CARD MARKING
 *    Mark focusable elements with data-tp-card="single" or "multi" so core
 *    knows how to handle Enter/Escape on those elements.
 * 
 * 5. LIFECYCLE HOOKS
 *    Use onActivate/onDeactivate for setup/cleanup. Always clean up listeners!
 * 
 * 6. CONFIGURATION OBJECTS
 *    Define site-specific options (scroll margins, focus targets) as objects
 *    that are passed to core utilities.
 * 
 * ============================================================================
 */

import absStyles from './style.css';

// ============================================================================
// CORE IMPORTS - Use these instead of reimplementing!
// ============================================================================

// Focus utilities: scroll-into-view, initial focus, viewport, DOM observation
import { 
  enableScrollIntoView,
  disableScrollIntoView,
  setInitialFocus,
  lockViewport,
  observeDOM,
  stopObservingDOM,
} from '../../focus/manager.js';

// Text input wrapping for TV-friendly keyboard handling
import {
  wrapTextInputs,
} from '../../input/text-input.js';

// NOTE: registerKeyHandler is accessed via window.TizenPortal.input.registerKeyHandler
// to avoid circular dependency (handler.js -> bundlemenu.js -> registry.js -> this file)

// Key constants
import { KEYS } from '../../input/keys.js';

// Card interaction utilities
import { 
  isInsideCard, 
  exitCard,
} from '../../navigation/card-interaction.js';

// Geometry utilities for spatial navigation spacing
import { 
  injectSpacingCSS, 
  SPACING_CLASS,
  validateSpacing,
  logViolations,
} from '../../navigation/geometry.js';

// ============================================================================
// ABS-SPECIFIC CONFIGURATION
// ============================================================================

/**
 * CSS Selectors for Audiobookshelf's DOM structure
 * 
 * These selectors match ABS's Vue/Nuxt-generated HTML.
 * Update these when ABS changes its HTML structure.
 */
var SELECTORS = {
  // Layout containers
  appbar: '#appbar',
  siderail: '[role="toolbar"][aria-orientation="vertical"]',
  siderailNav: '#siderail-buttons-container a',
  bookshelfRow: '.bookshelfRow, .categorizedBookshelfRow',
  
  // Focusable content
  bookCards: '[id^="book-card-"]',
  appbarButtons: '#appbar button, #appbar a[href]',
  menuItems: '[role="menuitem"]',
  
  // Text inputs to wrap
  textInputs: 'input[type="text"], input[type="search"], input:not([type])',
};

/**
 * Initial focus targets (tried in order)
 * 
 * These selectors are passed to setInitialFocus() from core.
 * The first matching element gets focus on page load.
 */
var INITIAL_FOCUS_SELECTORS = [
  '#siderail-buttons-container a.nuxt-link-active',  // Active nav link
  '#siderail-buttons-container a',                    // First nav link
  '[id^="book-card-"]',                               // First book card
  'input[placeholder*="Search"]',                     // Search input
];

/**
 * Scroll-into-view configuration for ABS layout
 * 
 * These options are passed to enableScrollIntoView() from core.
 * Customize for ABS's specific layout (appbar height, siderail width).
 */
var SCROLL_OPTIONS = {
  topOffset: 64,        // ABS appbar height in pixels
  leftOffset: 80,       // ABS siderail width in pixels  
  marginTop: 100,       // Start scrolling when element is within 100px of top
  marginBottom: 200,    // Start scrolling when element is within 200px of bottom
  marginLeft: 100,
  marginRight: 100,
  scrollContainer: '.bookshelfRow, .categorizedBookshelfRow', // Horizontal scroll containers
};

// ============================================================================
// BUNDLE STATE
// ============================================================================

/** Track if bundle has been activated */
var isActivated = false;

/** Unregister function for custom key handler */
var unregisterKeyHandler = null;

/** Stop function for DOM observer */
var stopObserver = null;

// ============================================================================
// BUNDLE EXPORT
// ============================================================================

export default {
  name: 'audiobookshelf',
  displayName: 'Audiobookshelf',
  description: 'TV support for Audiobookshelf audiobook server',
  
  /**
   * CSS to inject (imported from style.css)
   */
  style: absStyles,

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================

  /**
   * Called when bundle is activated
   * 
   * This is where we set up all TV adaptations using core utilities
   * plus any ABS-specific customizations.
   */
  onActivate: function() {
    if (isActivated) {
      console.log('TizenPortal [ABS]: Already activated');
      return;
    }
    
    console.log('TizenPortal [ABS]: Activating');
    isActivated = true;
    
    // CORE: Lock viewport for TV (disables pinch zoom, etc.)
    lockViewport();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.onDOMReady.bind(this));
    } else {
      this.onDOMReady();
    }
  },

  /**
   * Called when DOM is ready
   */
  onDOMReady: function() {
    console.log('TizenPortal [ABS]: DOM ready');
    var self = this;
    
    // CORE: Inject geometry spacing CSS for spatial navigation
    injectSpacingCSS();
    
    // ABS-SPECIFIC: Set up focusable elements and card markers
    this.setupFocusables();
    
    // ABS-SPECIFIC: Apply spacing classes to containers
    this.applySpacingClasses();
    
    // CORE: Wrap text inputs for TV keyboard handling
    // Uses the core utility with ABS-specific selector
    wrapTextInputs(SELECTORS.textInputs);
    
    // CORE: Enable scroll-into-view with ABS-specific layout options
    enableScrollIntoView(SCROLL_OPTIONS);
    
    // CORE: Observe DOM for dynamic Vue/Nuxt content changes
    stopObserver = observeDOM(function() {
      // Re-run setup when DOM changes (new cards loaded, etc.)
      self.setupFocusables();
      self.applySpacingClasses();
      wrapTextInputs(SELECTORS.textInputs);
    }, { debounceMs: 250 });
    
    // OVERRIDE: Register custom key handler for ABS-specific behavior
    // This runs BEFORE core handlers - return true to consume the event
    // NOTE: Accessed via global API to avoid circular dependency
    if (window.TizenPortal && window.TizenPortal.input && window.TizenPortal.input.registerKeyHandler) {
      unregisterKeyHandler = window.TizenPortal.input.registerKeyHandler(this.handleKeyDown.bind(this));
    } else {
      console.warn('TizenPortal [ABS]: registerKeyHandler not available');
    }
    
    // CORE: Set initial focus after Vue finishes rendering
    setInitialFocus(INITIAL_FOCUS_SELECTORS, 500);
    
    // Debug: Validate spacing in debug mode
    if (window.TizenPortal && window.TizenPortal.debug) {
      this.validateAllSpacing();
    }
  },

  /**
   * Called when bundle is deactivated
   * 
   * IMPORTANT: Always clean up listeners and state!
   */
  onDeactivate: function() {
    console.log('TizenPortal [ABS]: Deactivating');
    isActivated = false;
    
    // Clean up custom key handler
    if (unregisterKeyHandler) {
      unregisterKeyHandler();
      unregisterKeyHandler = null;
    }
    
    // Clean up DOM observer
    if (stopObserver) {
      stopObserver();
      stopObserver = null;
    }
    
    // Clean up scroll-into-view listener
    disableScrollIntoView();
    
    // Exit any entered card
    if (isInsideCard()) {
      exitCard();
    }
  },
  
  // ==========================================================================
  // KEY HANDLING OVERRIDE
  // ==========================================================================
  
  /**
   * Custom key handler - OVERRIDES core behavior when returning true
   * 
   * This function is registered with registerKeyHandler() and runs BEFORE
   * any core handlers. Return true to consume the event (core won't see it),
   * return false to let core handle it normally.
   * 
   * Use this for:
   * - Media keys for the ABS player
   * - Custom navigation for ABS-specific UI patterns
   * - Intercepting keys that core handles "wrong" for ABS
   * 
   * @param {KeyboardEvent} event
   * @returns {boolean} True if event was consumed (core won't handle)
   */
  handleKeyDown: function(event) {
    var keyCode = event.keyCode;
    
    // ========================================================================
    // EXAMPLE: Media keys for ABS player (future implementation)
    // ========================================================================
    // 
    // if (this.isPlayerActive()) {
    //   if (keyCode === KEYS.PLAY_PAUSE) {
    //     this.togglePlayback();
    //     return true; // Consumed - core won't handle
    //   }
    //   if (keyCode === KEYS.REWIND) {
    //     this.seekBack(30);
    //     return true;
    //   }
    //   if (keyCode === KEYS.FAST_FORWARD) {
    //     this.seekForward(30);
    //     return true;
    //   }
    // }
    
    // ========================================================================
    // EXAMPLE: Custom siderail navigation
    // ========================================================================
    //
    // if (keyCode === KEYS.LEFT && this.isOnBookshelf()) {
    //   // Jump to siderail instead of spatial nav
    //   this.focusSiderail();
    //   return true;
    // }
    
    // Return false to let core handle the key
    return false;
  },
  
  // ==========================================================================
  // ABS-SPECIFIC DOM SETUP
  // ==========================================================================
  
  /**
   * Set up focusable elements and mark cards
   * 
   * This is ABS-specific because it knows:
   * - Which elements should be focusable
   * - Which elements are "cards" (for Enter/Escape handling)
   * - Whether cards are single-action or multi-action
   */
  setupFocusables: function() {
    var count = 0;
    
    try {
      // Siderail navigation links - single-action (clicking navigates)
      var siderailLinks = document.querySelectorAll(SELECTORS.siderailNav);
      for (var i = 0; i < siderailLinks.length; i++) {
        var el = siderailLinks[i];
        if (el.getAttribute('tabindex') !== '0') {
          el.setAttribute('tabindex', '0');
          count++;
        }
        // Mark as single-action card
        el.setAttribute('data-tp-card', 'single');
      }
      
      // Book cards - single-action for TV
      // ABS cards have hover buttons (play, edit, more) but those are mouse-only.
      // For TV users, Enter navigates to the item detail page.
      var bookCards = document.querySelectorAll(SELECTORS.bookCards);
      for (var j = 0; j < bookCards.length; j++) {
        var card = bookCards[j];
        if (card.getAttribute('tabindex') !== '0') {
          card.setAttribute('tabindex', '0');
          count++;
        }
        // Mark as single-action: Enter clicks card to navigate
        if (!card.hasAttribute('data-tp-card')) {
          card.setAttribute('data-tp-card', 'single');
        }
      }
      
      // Appbar buttons and links
      var appbarEls = document.querySelectorAll(SELECTORS.appbarButtons);
      for (var k = 0; k < appbarEls.length; k++) {
        var appEl = appbarEls[k];
        if (appEl.getAttribute('tabindex') !== '0' && 
            !appEl.closest('[style*="display: none"]') &&
            appEl.getAttribute('aria-hidden') !== 'true') {
          appEl.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      // Dropdown menu items
      var menuItems = document.querySelectorAll(SELECTORS.menuItems);
      for (var m = 0; m < menuItems.length; m++) {
        var menuEl = menuItems[m];
        if (menuEl.getAttribute('tabindex') !== '0') {
          menuEl.setAttribute('tabindex', '0');
          count++;
        }
      }
      
      if (count > 0) {
        console.log('TizenPortal [ABS]: Made', count, 'elements focusable');
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error setting up focusables:', err.message);
    }
  },
  
  /**
   * Apply spacing classes to containers for spatial navigation
   * 
   * The SPACING_CLASS ensures minimum gaps between focusable elements
   * so spatial navigation doesn't get confused by overlapping hitboxes.
   */
  applySpacingClasses: function() {
    var count = 0;
    
    try {
      // Bookshelf rows (horizontal scroll containers)
      var rows = document.querySelectorAll(SELECTORS.bookshelfRow);
      for (var i = 0; i < rows.length; i++) {
        if (!rows[i].classList.contains(SPACING_CLASS)) {
          rows[i].classList.add(SPACING_CLASS);
          count++;
        }
      }
      
      // Siderail navigation container
      var siderail = document.querySelector('#siderail-buttons-container');
      if (siderail && !siderail.classList.contains(SPACING_CLASS)) {
        siderail.classList.add(SPACING_CLASS);
        count++;
      }
      
      // Top appbar
      var appbar = document.querySelector(SELECTORS.appbar);
      if (appbar && !appbar.classList.contains(SPACING_CLASS)) {
        appbar.classList.add(SPACING_CLASS);
        count++;
      }
      
      if (count > 0) {
        console.log('TizenPortal [ABS]: Applied spacing class to', count, 'containers');
      }
    } catch (err) {
      console.warn('TizenPortal [ABS]: Error applying spacing classes:', err.message);
    }
  },
  
  /**
   * Validate spacing in debug mode
   * 
   * Logs warnings if focusable elements are too close together,
   * which can cause spatial navigation to misbehave.
   */
  validateAllSpacing: function() {
    var rows = document.querySelectorAll(SELECTORS.bookshelfRow);
    for (var i = 0; i < rows.length; i++) {
      var result = validateSpacing(rows[i]);
      if (!result.valid) {
        console.warn('TizenPortal [ABS]: Bookshelf row', i, 'has spacing violations');
        logViolations(result);
      }
    }
  },
  
  // ==========================================================================
  // ABS-SPECIFIC HELPERS (examples for future expansion)
  // ==========================================================================
  
  /**
   * Check if the ABS player is currently active
   * @returns {boolean}
   */
  isPlayerActive: function() {
    // TODO: Implement when adding player support
    return false;
  },
  
  /**
   * Check if focus is currently on a bookshelf card
   * @returns {boolean}
   */
  isOnBookshelf: function() {
    var active = document.activeElement;
    return active && active.closest(SELECTORS.bookshelfRow) !== null;
  },
  
  /**
   * Focus the first siderail link
   */
  focusSiderail: function() {
    var first = document.querySelector(SELECTORS.siderailNav);
    if (first) {
      first.focus();
    }
  },
};
