(function() {
    if (window.location.hostname === 'localhost') return; // Ignore Launcher

    console.log("[TP] Client Active. Contacting System...");

    // 1. FETCH CONFIG
    fetch(`http://localhost:3333/api/config?url=${encodeURIComponent(window.location.href)}`)
        .then(r => r.json())
        .then(applyConfig)
        .catch(e => {
            console.error("[TP] Offline/Error", e);
            // Rescue Mode
            applyConfig({ coreCSS: "img{max-width:100%!important} .flex > * {min-width:0!important}" });
        });

    function applyConfig(cfg) {
        // Inject CSS
        const css = (cfg.coreCSS || '') + '\n' + (cfg.appCSS || '');
        if (css) {
            const s = document.createElement('style');
            s.id = 'tp-style';
            s.textContent = css;
            document.head.appendChild(s);
        }
        // Run JS
        const js = (cfg.coreJS || '') + '\n' + (cfg.appJS || '');
        if (js) try { new Function(js)(); } catch(e) { console.error("[TP] JS Error", e); }

        injectHUD();
    }

    // 2. SYSTEM HUD
    function injectHUD() {
        const hudHTML = `
        <div id="tp-hud" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2147483647; align-items:center; justify-content:center; backdrop-filter:blur(5px);">
            <div style="background:#222; padding:30px; border:2px solid #555; width:400px; display:flex; flex-direction:column; gap:15px; border-radius:12px; box-shadow:0 0 50px black;">
                <h2 style="color:#FFD700; margin:0 0 10px 0; border-bottom:1px solid #444; padding-bottom:10px;">System Menu</h2>
                <button id="tp-btn-home" onclick="window.location.href='http://localhost:3333'" style="padding:15px; font-size:18px; background:#333; color:white; border:none; cursor:pointer;">Exit to Portal</button>
                <button onclick="window.location.reload()" style="padding:15px; font-size:18px; background:#333; color:white; border:none; cursor:pointer;">Reload App</button>
                
                <div style="display:flex; gap:10px;">
                    <button onclick="document.body.style.zoom = (parseFloat(document.body.style.zoom||1)+0.1)" style="flex:1; padding:15px; background:#333; color:white; border:none;">Zoom +</button>
                    <button onclick="document.body.style.zoom = (parseFloat(document.body.style.zoom||1)-0.1)" style="flex:1; padding:15px; background:#333; color:white; border:none;">Zoom -</button>
                </div>

                <div style="text-align:center; color:#888; font-size:12px; margin-top:10px;">Long Press BACK to Close</div>
            </div>
        </div>
        <style>
            #tp-hud button:focus { background: #FFD700 !important; color: black !important; outline: 3px solid white; transform: scale(1.05); }
        </style>
        `;
        
        const d = document.createElement('div'); d.innerHTML = hudHTML; document.body.appendChild(d);
        
        // Input Logic (Long Press Back)
        let timer;
        const hud = document.getElementById('tp-hud');
        
        const toggle = () => {
            const show = (hud.style.display === 'none');
            hud.style.display = show ? 'flex' : 'none';
            if(show) document.getElementById('tp-btn-home').focus();
            else {
                // Return focus to app
                const t = document.querySelector('.card, .item, [tabindex="0"]');
                if(t) t.focus();
            }
        };

        document.addEventListener('keydown', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                e.preventDefault();
                if(!timer) timer = setTimeout(() => { toggle(); }, 800);
            }
        });
        document.addEventListener('keyup', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                clearTimeout(timer); timer = null;
                if (hud.style.display === 'none' && window.location.pathname !== '/' && window.location.pathname !== '/login') {
                    window.history.back();
                }
            }
        });
    }
})();