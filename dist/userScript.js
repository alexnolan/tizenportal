(function() {
    if (window.location.hostname.indexOf('github.io') > -1) return;

    var logs = [];
    var tpHud = function(msg){
        try {
            var h = document.getElementById('tp-diag');
            if(!h){
                h = document.createElement('div'); h.id='tp-diag';
                h.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:rgba(0,0,0,0.85);color:#FFD700;font-size:13px;font-family:sans-serif;padding:6px 10px;pointer-events:none;text-align:left;';
                document.body.appendChild(h);
            }
            h.textContent = '[TP] ' + msg;
            setTimeout(function(){ try { if(h) h.style.opacity='0.4'; } catch(e){} }, 3000);
        } catch(e){}
    };
    function log(type, args) {
        var msg = Array.prototype.slice.call(args).map(function(a){ return (typeof a==='object'?JSON.stringify(a):String(a)); }).join(' ');
        logs.unshift('['+type+'] '+msg); if (logs.length > 200) logs.pop();
        if (window.TP && window.TP.ui) window.TP.ui.updateConsole();
    }
    var origLog = console.log; console.log = function() { log('INF', arguments); origLog.apply(console, arguments); }; console.error = function() { log('ERR', arguments); };

    var Config = {
        payload: null, homeUrl: 'https://alexnolan.github.io/tizenportal/dist/index.html',
        load: function() {
            try {
                // 1. Check URL Hash (Client-Side, bypasses server limits)
                var m = window.location.hash.match(/[#&]tp=([^&]+)/);
                if (m && m[1]) {
                    var j = atob(m[1]); this.payload = JSON.parse(j); 
                    sessionStorage.setItem('tp_conf', j); localStorage.setItem('tp_conf', j);
                    // Clear hash without reloading
                    history.replaceState(null, document.title, window.location.pathname + window.location.search);
                    tpHud('Loaded hash payload'); console.log("[TP] Loaded Hash"); return true;
                }

                // 2. Check URL Param (Legacy/Direct)
                var m2 = window.location.href.match(/[?&]tp=([^&]+)/);
                if (m2 && m2[1]) {
                    var j = atob(m2[1]); this.payload = JSON.parse(j); 
                    sessionStorage.setItem('tp_conf', j); localStorage.setItem('tp_conf', j);
                    window.history.replaceState({}, document.title, window.location.href.replace(/[?&]tp=[^&]+/, ''));
                    tpHud('Loaded query payload'); console.log("[TP] Loaded URL"); return true;
                }
                
                // 3. Fallback to Storage
                var s = sessionStorage.getItem('tp_conf'); 
                if(s){this.payload=JSON.parse(s);tpHud('Loaded session payload');console.log("[TP] Loaded Storage");return true;}
                var l = localStorage.getItem('tp_conf');
                if(l){this.payload=JSON.parse(l);tpHud('Loaded local payload');console.log("[TP] Loaded Local");return true;}
            } catch(e) { console.error("Conf Fail", e); tpHud('Config load failed'); } return false;
        },
        apply: function() {
            if (!this.payload) return false;
            if (this.payload.ua) { try { Object.defineProperty(navigator, 'userAgent', { get: function(){ return Config.payload.ua; } }); tpHud('UA override applied'); } catch(e){ tpHud('UA override failed: ' + (e && e.message ? e.message : '?')); console.error('UA override failed', e); } }
            if (this.payload.css) { try { var s=document.createElement('style'); s.textContent=this.payload.css; document.head.appendChild(s); tpHud('CSS injected (' + this.payload.css.length + ' chars)'); } catch(e){ tpHud('CSS inject failed: ' + (e && e.message ? e.message : '?')); console.error('CSS inject failed', e); } }
            if (this.payload.js) { try { new Function(this.payload.js)(); tpHud('JS executed (' + this.payload.js.length + ' chars)'); } catch(e){ tpHud('JS exec failed: ' + (e && e.message ? e.message : '?')); console.error('JS exec failed', e); } }
            return true;
        }
    };

    var UI = {
        open: false, maximized: false, idx: 0, contentMode: 'none', // 'none', 'logs', 'source'
        items: [
            { l: "🏠 Exit Home", fn: function(){ window.location.href = Config.homeUrl; }, c:"#FFD700" },
            { l: "⬅️ Back", fn: function(){ window.history.back(); }, c:"#0f0" },
            { l: "➡️ Forward", fn: function(){ window.history.forward(); }, c:"#0f0" },
            { l: "🔄 Reload", fn: function(){ window.location.reload(); }, c:"#fff" },
            { l: "🌐 URL", fn: function(){ var u = prompt("Go to URL:", window.location.href); if(u) window.location.href=u; }, c:"#0f0" },
            { l: "🖱️ Mouse", fn: function(){ Input.toggleMouse(); }, c:"#fff" },
            { l: "📐 Aspect", fn: function(){ Input.toggleAspect(); }, c:"#fff" },
            { l: "🔲 Maximize", fn: function(){ UI.toggleMax(); }, c:"#0ff" },
            { l: "🔍 Source", fn: function(){ UI.setMode('source'); }, c:"#0ff" },
            { l: "📜 Logs", fn: function(){ UI.setMode('logs'); }, c:"#aaa" }
        ],
        init: function() {
            var css = "" +
                "#tp-b { position:fixed; top:0; right:-300px; width:280px; bottom:0; background:#111; border-left:2px solid #333; z-index:2147483647 !important; transition:right 0.2s, width 0.2s; font-family:sans-serif; display:flex; flex-direction:column; }" +
                "#tp-b.open { right:0; box-shadow:-10px 0 50px rgba(0,0,0,0.8); }" +
                "#tp-b.max { width: 95%; border-left: none; }" +
                "#tp-h { padding:10px; background:#222; border-bottom:1px solid #444; font-size:12px; color:#888; word-break:break-all; }" +
                ".tp-i { padding:12px; color:#fff; cursor:pointer; border-bottom:1px solid #222; font-size:16px; }" +
                ".tp-i.active { background:#FFD700; color:#000; font-weight:bold; }" +
                "#tp-c { flex:1; background:#000; color:#0f0; font-family:monospace; font-size:12px; padding:10px; overflow-y:auto; display:none; border-top:1px solid #444; white-space:pre-wrap; word-break:break-all; outline:none; }" +
                "#tp-c.focused { border: 2px solid #FFD700; background: #080808; }" +
                "#tp-b.max #tp-c { font-size: 14px; display: block; height: auto; }" +
                ".tp-t { position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#222; color:#fff; padding:10px; border:1px solid #FFD700; opacity:0; transition:opacity 0.5s; z-index:2147483647 !important; pointer-events:none; }";
            
            var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            var d = document.createElement('div'); d.id='tp-b';
            d.innerHTML = '<div style="padding:15px;background:#222;color:#FFD700;font-weight:bold">TizenPortal 047</div>' +
                          '<div id="tp-h">'+window.location.pathname+'</div>' +
                          '<div style="flex-shrink:0;overflow-y:auto;max-height:60%" id="tp-l"></div>' +
                          '<div id="tp-c" tabindex="0"></div>';
            document.body.appendChild(d);

            var l = document.getElementById('tp-l');
            this.items.forEach(function(item, i) {
                var el = document.createElement('div'); el.className='tp-i'; el.innerText=item.l; el.style.color=item.c;
                el.onclick = function() { UI.idx=i; UI.upd(); item.fn(); }; l.appendChild(el);
            });
            var t = document.createElement('div'); t.className='tp-t'; t.id='tp-toast'; document.body.appendChild(t);
        },
        toggle: function() { 
            this.open = !this.open; 
            document.getElementById('tp-b').className = this.open ? (this.maximized ? 'open max' : 'open') : ''; 
            if(!this.open) this.setMode('none'); // Close content when closing menu
            this.upd(); 
        },
        toggleMax: function() { 
            this.maximized = !this.maximized; 
            document.getElementById('tp-b').className = this.open ? (this.maximized ? 'open max' : 'open') : ''; 
            if(this.maximized && this.contentMode === 'none') this.setMode('logs'); // Default to logs on max
        },
        setMode: function(mode) {
            this.contentMode = mode;
            var c = document.getElementById('tp-c');
            c.innerHTML = ''; // Memory Nuke
            
            if (mode === 'none') {
                c.style.display = 'none';
                if(this.maximized) this.toggleMax();
            } else {
                c.style.display = 'block';
                if(!this.maximized) this.toggleMax();
                if(mode === 'logs') this.updateConsole();
                if(mode === 'source') this.viewSource();
                this.enterConsoleFocus();
            }
        },
        viewSource: function() {
            var html = document.documentElement.outerHTML.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            var c = document.getElementById('tp-c');
            c.innerHTML = '<div style="color:#0ff;border-bottom:1px solid #fff;margin-bottom:10px">--- SOURCE ---</div>' + html;
        },
        enterConsoleFocus: function() { var c = document.getElementById('tp-c'); c.classList.add('focused'); c.focus(); this.toast("Scroll / Back to Exit"); },
        exitConsoleFocus: function() { 
            var c = document.getElementById('tp-c'); c.classList.remove('focused'); 
            this.setMode('none'); // Close window on back
        },
        updateConsole: function() {
            if(this.contentMode !== 'logs') return;
            var c = document.getElementById('tp-c');
            c.innerHTML = logs.map(function(l){ return '<div>'+l.replace(/</g,'&lt;')+'</div>'; }).join('');
        },
        nav: function(d) {
            if(!this.open) return;
            if(this.contentMode !== 'none') {
                var c = document.getElementById('tp-c');
                if(d==='u') c.scrollTop -= 40; if(d==='d') c.scrollTop += 40; return;
            }
            if(d==='u') this.idx--; if(d==='d') this.idx++;
            if(this.idx < 0) this.idx = this.items.length - 1; if(this.idx >= this.items.length) this.idx = 0;
            this.upd();
        },
        exe: function() { if(this.open && this.contentMode === 'none') this.items[this.idx].fn(); },
        upd: function() { var els = document.querySelectorAll('.tp-i'); for(var i=0; i<els.length; i++) els[i].className = (i===this.idx) ? 'tp-i active' : 'tp-i'; },
        toast: function(m) { var t = document.getElementById('tp-toast'); t.innerText = m; t.style.opacity = 1; setTimeout(function(){ t.style.opacity=0; }, 3000); }
    };

    var Input = {
        mouse: false, x: window.innerWidth/2, y: window.innerHeight/2, cursor: null,
        init: function() {
            setInterval(function() {
                if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
                    ["ColorF0Red","ColorF1Green","ColorF2Yellow","ColorF3Blue","MediaPlay","MediaPause"].forEach(function(k){ try { tizen.tvinputdevice.registerKey(k); } catch(e){} });
                }
            }, 2000);
            document.addEventListener('keydown', this.key.bind(this), true);
            setInterval(this.loop.bind(this), 50);
        },
        key: function(e) {
            var k = e.keyCode;
            if (UI.open) {
                if (k===38) UI.nav('u'); if (k===40) UI.nav('d');
                if ([10009, 27, 37].indexOf(k) > -1) {
                    if (UI.contentMode !== 'none') UI.exitConsoleFocus(); 
                    else UI.toggle(); 
                    e.preventDefault(); e.stopPropagation(); return;
                }
                if (k===13) UI.exe(); if (k===406) UI.toggle(); e.preventDefault(); e.stopPropagation(); return;
            }
            if (k===406) { UI.toggle(); e.preventDefault(); return; } 
            if (k===403) { window.location.reload(); e.preventDefault(); return; } 
            if (k===404) { this.toggleMouse(); e.preventDefault(); return; } 
            if (k===405) { window.location.href = Config.homeUrl; e.preventDefault(); return; } 

            // D-pad focus navigation (linear) to avoid scroll
            if ([37,38,39,40].indexOf(k) > -1 && !this.mouse) {
                var focusables = Array.prototype.slice.call(document.querySelectorAll('a, button, input, select, textarea, [tabindex]'))
                    .filter(function(el){ return el && el.tabIndex > -1 && el.offsetParent !== null; });
                var idx = focusables.indexOf(document.activeElement);
                if (idx === -1 && focusables.length) idx = 0;
                if (k===37 || k===38) idx = Math.max(0, idx-1);
                if (k===39 || k===40) idx = Math.min(focusables.length-1, idx+1);
                if (focusables[idx]) focusables[idx].focus();
                e.preventDefault(); e.stopPropagation(); return;
            }

            if (this.mouse) {
                if (k===37) this.x-=25; if (k===38) this.y-=25; if (k===39) this.x+=25; if (k===40) this.y+=25;
                if (k===13) this.click(); this.draw();
                if ([37,38,39,40,13].indexOf(k) > -1) { e.preventDefault(); e.stopPropagation(); }
            }
        },
        loop: function() {
            if (!this.mouse) return;
            var h = window.innerHeight;
            if (this.y > h-60) window.scrollBy(0, 20); if (this.y < 60) window.scrollBy(0, -20);
            this.x = Math.max(0, Math.min(window.innerWidth, this.x)); this.y = Math.max(0, Math.min(h, this.y));
            this.draw();
        },
        toggleMouse: function() {
            this.mouse = !this.mouse;
            if (!this.cursor) { var c = document.createElement('div'); c.style.cssText='position:fixed;width:20px;height:20px;background:red;border:2px solid #fff;border-radius:50%;z-index:2147483647;pointer-events:none;display:none'; document.body.appendChild(c); this.cursor = c; }
            this.cursor.style.display = this.mouse ? 'block' : 'none'; if (this.mouse) { this.x=window.innerWidth/2; this.y=window.innerHeight/2; } this.draw();
            UI.toast(this.mouse ? "Mouse ON" : "Mouse OFF");
        },
        draw: function() { if (this.cursor) { this.cursor.style.left = (this.x-10)+'px'; this.cursor.style.top = (this.y-10)+'px'; } },
        click: function() { var el = document.elementFromPoint(this.x, this.y); if(el) { el.click(); el.focus(); } },
        toggleAspect: function() { UI.toast("Aspect Toggle"); var v = document.querySelector('video'); if(v) v.style.objectFit = (v.style.objectFit === 'cover') ? 'contain' : 'cover'; }
    };

    window.TP = { ui: UI, input: Input };
    var loaded = Config.load(); Config.apply();
    var ready = function() { UI.init(); Input.init(); if(loaded) { UI.toast("TizenPortal 046"); } else { UI.toast("No Config"); tpHud('No payload found'); } };
    if (document.body) ready(); else document.addEventListener('DOMContentLoaded', ready);
})();