(function() {
    // 0. SAFETY: Ignore GitHub Pages
    if (window.location.hostname.includes('github.io')) return;

    console.log("[TP] Injector Active.");

    try {
        // 1. UNPACK SMUGGLED DATA
        const raw = window.name;
        if (!raw || !raw.includes('tp_payload')) return;
        
        const data = JSON.parse(raw);
        console.log("[TP] Payload Found. Applying...");

        // 2. INJECT CSS
        if (data.css) {
            const s = document.createElement('style');
            s.textContent = data.css;
            document.head.appendChild(s);
        }

        // 3. RUN JS
        if (data.js) {
            try { new Function(data.js)(); } catch(e) { console.error("[TP] JS Error", e); }
        }

        // 4. INJECT SYSTEM HUD
        injectHUD(data.home);

    } catch (e) {
        console.log("[TP] No config found.", e);
    }

    function injectHUD(homeUrl) {
        const html = `
        <div id="tp-hud" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:2147483647; align-items:center; justify-content:center;">
            <div style="background:#222; padding:30px; border:2px solid #555; width:400px; display:flex; flex-direction:column; gap:15px;">
                <h2 style="color:#FFD700; margin:0 0 10px 0;">System Menu</h2>
                <button id="tp-home" style="padding:15px; font-size:18px;">Exit to Portal</button>
                <button onclick="location.reload()" style="padding:15px; font-size:18px;">Reload App</button>
                <div style="display:flex; gap:10px;">
                    <button onclick="document.body.style.zoom=(parseFloat(document.body.style.zoom||1)+0.1)" style="flex:1; padding:10px;">Zoom +</button>
                    <button onclick="document.body.style.zoom=(parseFloat(document.body.style.zoom||1)-0.1)" style="flex:1; padding:10px;">Zoom -</button>
                </div>
                <div style="text-align:center; color:#888; font-size:12px; margin-top:10px;">Long Press BACK to Close</div>
            </div>
        </div>`;
        
        const d = document.createElement('div'); d.innerHTML = html; document.body.appendChild(d);
        
        document.getElementById('tp-home').onclick = () => window.location.href = homeUrl || 'https://alexnolan.github.io/tizenportal/dist/index.html';

        let timer;
        const hud = document.getElementById('tp-hud');
        
        const toggle = () => {
            const show = (hud.style.display==='none');
            hud.style.display = show ? 'flex' : 'none';
            if(show) document.getElementById('tp-home').focus();
        };

        document.addEventListener('keydown', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                e.preventDefault();
                if(!timer) timer = setTimeout(toggle, 800);
            }
        });
        document.addEventListener('keyup', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                clearTimeout(timer); timer = null;
                if(hud.style.display==='none' && window.location.pathname!=='/') window.history.back();
            }
        });
    }
})();