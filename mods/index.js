/**
 * TizenPortal Mod Entry Point
 * 
 * This is the injection script that runs on target sites.
 * Loaded by TizenBrew when navigating away from the portal.
 * 
 * Responsibilities:
 * 1. Read payload from URL hash (#tp=)
 * 2. Apply bundle CSS/JS
 * 3. Handle color button input
 * 4. Provide minimal overlay UI
 * 
 * @version 0201
 */

// Skip if we're on the portal itself
if (window.location.hostname.indexOf('github.io') > -1) {
  // Don't run on portal page
} else {
  (function() {
    'use strict';

    var VERSION = '0201';
    var HOME_URL = 'https://alexnolan.github.io/tizenportal/dist/index.html';

    // ========================================================================
    // DEBUG HUD - Shows status during initialization
    // ========================================================================
    
    function showHud(msg) {
      try {
        var h = document.getElementById('tp-hud');
        if (!h) {
          h = document.createElement('div');
          h.id = 'tp-hud';
          h.style.cssText = 'position:fixed;top:0;right:0;background:rgba(0,0,0,0.9);color:#0f0;padding:8px 12px;font-size:11px;font-family:monospace;z-index:2147483647;border-left:2px solid #0f0;border-bottom:2px solid #0f0;max-width:300px;word-break:break-all;pointer-events:none;';
          (document.body || document.documentElement).appendChild(h);
        }
        h.textContent = '[TP ' + VERSION + '] ' + msg;
        // Auto-fade
        if (h._timer) clearTimeout(h._timer);
        h._timer = setTimeout(function() { 
          h.style.opacity = '0.3'; 
        }, 5000);
      } catch (e) { /* ignore */ }
    }

    showHud('Loading...');

    // ========================================================================
    // PAYLOAD - Read from URL hash
    // ========================================================================

    var payload = null;

    function loadPayload() {
      try {
        // Try URL hash first: #tp=BASE64 or &tp=BASE64
        var hash = window.location.hash;
        var match = hash.match(/[#&]tp=([^&]+)/);
        
        if (match && match[1]) {
          var decoded = atob(match[1]);
          payload = JSON.parse(decoded);
          
          // Store in sessionStorage for SPA navigation
          sessionStorage.setItem('tp_payload', decoded);
          
          // Clean the URL
          try {
            var cleanUrl = window.location.href.replace(/[#&]tp=[^&#]+/, '');
            history.replaceState(null, document.title, cleanUrl);
          } catch (e) { /* ignore */ }
          
          showHud('Payload from hash');
          return true;
        }
        
        // Fallback to sessionStorage (for SPA navigation)
        var stored = sessionStorage.getItem('tp_payload');
        if (stored) {
          payload = JSON.parse(stored);
          showHud('Payload from session');
          return true;
        }
        
        showHud('No payload');
        return false;
      } catch (e) {
        showHud('Payload error: ' + e.message);
        return false;
      }
    }

    // ========================================================================
    // APPLY - Inject CSS, JS, User Agent
    // ========================================================================

    function applyPayload() {
      if (!payload) return false;

      // Apply User Agent override
      if (payload.ua) {
        try {
          Object.defineProperty(navigator, 'userAgent', {
            get: function() { return payload.ua; }
          });
          console.log('[TP] UA override applied');
        } catch (e) {
          console.warn('[TP] UA override failed:', e);
        }
      }

      // Apply CSS
      if (payload.css) {
        try {
          var style = document.createElement('style');
          style.id = 'tp-injected-css';
          style.textContent = payload.css;
          (document.head || document.documentElement).appendChild(style);
          showHud('CSS: ' + Math.round(payload.css.length / 1024) + 'KB');
        } catch (e) {
          console.error('[TP] CSS inject failed:', e);
        }
      }

      // Apply JS
      if (payload.js) {
        try {
          new Function(payload.js)();
          console.log('[TP] JS executed');
        } catch (e) {
          console.error('[TP] JS exec failed:', e);
        }
      }

      return true;
    }

    // ========================================================================
    // INPUT - Handle color buttons
    // ========================================================================

    var KEYS = {
      RED: 403,
      GREEN: 404,
      YELLOW: 405,
      BLUE: 406,
      ENTER: 13,
      BACK: 10009,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40
    };

    function initInput() {
      // Register keys with Tizen
      if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
        var keys = ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue'];
        keys.forEach(function(k) {
          try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* ignore */ }
        });
      }

      document.addEventListener('keydown', handleKeyDown, true);
    }

    function handleKeyDown(e) {
      var k = e.keyCode;

      // Color buttons
      switch (k) {
        case KEYS.RED:
          // Toggle address bar
          toggleAddressBar();
          e.preventDefault();
          e.stopPropagation();
          return;

        case KEYS.GREEN:
          // Reserved for pointer mode (future)
          showToast('Green: Not implemented');
          e.preventDefault();
          e.stopPropagation();
          return;

        case KEYS.YELLOW:
          // Return to portal
          window.location.href = HOME_URL;
          e.preventDefault();
          e.stopPropagation();
          return;

        case KEYS.BLUE:
          // Toggle diagnostics
          toggleDiagnostics();
          e.preventDefault();
          e.stopPropagation();
          return;
      }
    }

    // ========================================================================
    // UI - Minimal overlay components
    // ========================================================================

    var addressBarVisible = false;
    var diagnosticsVisible = false;

    function createOverlay() {
      var overlay = document.createElement('div');
      overlay.id = 'tp-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483640;';
      
      // Address bar container
      var addressBar = document.createElement('div');
      addressBar.id = 'tp-addressbar';
      addressBar.style.cssText = 'display:none;position:absolute;top:0;left:0;right:0;height:50px;background:#111;border-bottom:2px solid #FFD700;pointer-events:auto;';
      addressBar.innerHTML = [
        '<div style="display:flex;align-items:center;height:100%;padding:0 10px;gap:8px;">',
        '  <button id="tp-btn-home" style="width:40px;height:40px;background:#222;border:2px solid #444;border-radius:4px;color:#FFD700;font-size:18px;cursor:pointer;">🏠</button>',
        '  <button id="tp-btn-back" style="width:40px;height:40px;background:#222;border:2px solid #444;border-radius:4px;color:#fff;font-size:18px;cursor:pointer;">←</button>',
        '  <button id="tp-btn-fwd" style="width:40px;height:40px;background:#222;border:2px solid #444;border-radius:4px;color:#fff;font-size:18px;cursor:pointer;">→</button>',
        '  <button id="tp-btn-reload" style="width:40px;height:40px;background:#222;border:2px solid #444;border-radius:4px;color:#fff;font-size:18px;cursor:pointer;">↻</button>',
        '  <input id="tp-url" type="text" style="flex:1;height:36px;background:#000;border:2px solid #444;border-radius:4px;color:#fff;padding:0 12px;font-size:14px;font-family:monospace;">',
        '</div>'
      ].join('');
      overlay.appendChild(addressBar);

      // Diagnostics panel container
      var diag = document.createElement('div');
      diag.id = 'tp-diagnostics';
      diag.style.cssText = 'display:none;position:absolute;top:60px;right:20px;width:400px;max-height:70%;background:rgba(0,0,0,0.95);border:2px solid #00a8ff;border-radius:8px;pointer-events:auto;overflow:hidden;';
      diag.innerHTML = [
        '<div style="background:#00a8ff;color:#000;padding:10px;font-weight:bold;">TizenPortal ' + VERSION + ' Diagnostics</div>',
        '<div id="tp-diag-info" style="padding:10px;border-bottom:1px solid #333;font-size:12px;color:#888;"></div>',
        '<div id="tp-diag-log" style="padding:10px;max-height:300px;overflow-y:auto;font-size:11px;font-family:monospace;color:#0f0;"></div>',
        '<div style="padding:10px;display:flex;gap:8px;">',
        '  <button id="tp-btn-portal" style="flex:1;padding:10px;background:#00a8ff;border:none;border-radius:4px;color:#fff;cursor:pointer;">Return to Portal</button>',
        '  <button id="tp-btn-close-diag" style="flex:1;padding:10px;background:#333;border:none;border-radius:4px;color:#fff;cursor:pointer;">Close</button>',
        '</div>'
      ].join('');
      overlay.appendChild(diag);

      // Toast
      var toast = document.createElement('div');
      toast.id = 'tp-toast';
      toast.style.cssText = 'position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:12px 24px;border-radius:8px;font-size:16px;opacity:0;transition:opacity 0.3s;pointer-events:none;';
      overlay.appendChild(toast);

      document.body.appendChild(overlay);

      // Wire up buttons
      document.getElementById('tp-btn-home').onclick = function() { window.location.href = HOME_URL; };
      document.getElementById('tp-btn-back').onclick = function() { history.back(); };
      document.getElementById('tp-btn-fwd').onclick = function() { history.forward(); };
      document.getElementById('tp-btn-reload').onclick = function() { location.reload(); };
      document.getElementById('tp-url').value = window.location.href;
      document.getElementById('tp-url').onkeydown = function(e) {
        if (e.keyCode === 13) {
          window.location.href = this.value;
        }
      };
      document.getElementById('tp-btn-portal').onclick = function() { window.location.href = HOME_URL; };
      document.getElementById('tp-btn-close-diag').onclick = function() { toggleDiagnostics(); };

      // Populate diagnostics info
      var info = document.getElementById('tp-diag-info');
      info.innerHTML = [
        '<div>URL: ' + window.location.href.substring(0, 50) + '...</div>',
        '<div>Bundle: ' + (payload ? (payload.bundleName || 'default') : 'none') + '</div>',
        '<div>Card: ' + (payload ? (payload.cardName || 'unknown') : 'none') + '</div>'
      ].join('');
    }

    function toggleAddressBar() {
      addressBarVisible = !addressBarVisible;
      var bar = document.getElementById('tp-addressbar');
      if (bar) {
        bar.style.display = addressBarVisible ? 'block' : 'none';
        if (addressBarVisible) {
          document.getElementById('tp-url').focus();
        }
      }
    }

    function toggleDiagnostics() {
      diagnosticsVisible = !diagnosticsVisible;
      var diag = document.getElementById('tp-diagnostics');
      if (diag) {
        diag.style.display = diagnosticsVisible ? 'block' : 'none';
      }
    }

    function showToast(msg, duration) {
      duration = duration || 3000;
      var toast = document.getElementById('tp-toast');
      if (toast) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        setTimeout(function() {
          toast.style.opacity = '0';
        }, duration);
      }
    }

    // ========================================================================
    // CONSOLE CAPTURE - For diagnostics
    // ========================================================================

    var logs = [];
    var origLog = console.log;
    var origError = console.error;

    console.log = function() {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function(a) {
        return typeof a === 'object' ? JSON.stringify(a) : String(a);
      }).join(' ');
      logs.push({ type: 'log', msg: msg, time: new Date().toTimeString().substring(0, 8) });
      if (logs.length > 100) logs.shift();
      updateDiagLog();
      origLog.apply(console, arguments);
    };

    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function(a) {
        return typeof a === 'object' ? JSON.stringify(a) : String(a);
      }).join(' ');
      logs.push({ type: 'error', msg: msg, time: new Date().toTimeString().substring(0, 8) });
      if (logs.length > 100) logs.shift();
      updateDiagLog();
      origError.apply(console, arguments);
    };

    function updateDiagLog() {
      var logEl = document.getElementById('tp-diag-log');
      if (!logEl) return;
      
      logEl.innerHTML = logs.map(function(l) {
        var color = l.type === 'error' ? '#f00' : '#0f0';
        return '<div style="margin:2px 0;"><span style="color:#666;">' + l.time + '</span> <span style="color:' + color + ';">' + l.msg.substring(0, 200) + '</span></div>';
      }).reverse().join('');
    }

    // ========================================================================
    // INIT
    // ========================================================================

    function init() {
      showHud('Initializing...');
      
      // Load and apply payload
      var hasPayload = loadPayload();
      if (hasPayload) {
        applyPayload();
      }

      // Create overlay UI
      createOverlay();

      // Initialize input handling
      initInput();

      // Done
      showToast('TizenPortal ' + VERSION);
      console.log('[TP] TizenPortal ' + VERSION + ' ready');
    }

    // Run when DOM is ready
    if (document.body) {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }

  })();
}
