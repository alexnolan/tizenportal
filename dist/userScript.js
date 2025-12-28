(function() {
    if (window.location.hostname === 'localhost') return;

    console.log("[TP] Client Active. Connecting to System...");

    fetch(`http://localhost:3333/api/config?url=${encodeURIComponent(window.location.href)}`)
        .then(r => r.json())
        .then(applyConfig)
        .catch(e => {
            console.error("[TP] Offline Mode / Server Error", e);
            applyConfig({ coreCSS: "img{max-width:100%!important} .flex > * {min-width:0!important}" });
        });

    function applyConfig(cfg) {
        const css = (cfg.coreCSS || '') + '\n' + (cfg.appCSS || '');
        if (css) {
            const s = document.createElement('style');
            s.textContent = css;
            document.head.appendChild(s);
        }
        const js = (cfg.coreJS || '') + '\n' + (cfg.appJS || '');
        if (js) try { new Function(js)(); } catch(e) { console.error(e); }

        injectHUD();
    }

    function injectHUD() {
        const hudHTML = `
        <div id="tp-hud" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:999999; align-items:center; justify-content:center;">
            <div style="background:#222; padding:30px; border:2px solid #555; width:400px; display:flex; flex-direction:column; gap:15px;">
                <h2 style="color:#FFD700; margin:0 0 10px 0;">System Menu</h2>
                <button onclick="window.location.href='http://localhost:3333'" style="padding:15px; font-size:18px;">Exit to Portal</button>
                <button onclick="window.location.reload()" style="padding:15px; font-size:18px;">Reload App</button>
                <div style="text-align:center; color:#888; font-size:12px; margin-top:10px;">Long Press BACK to Close</div>
            </div>
        </div>`;
        const d = document.createElement('div'); d.innerHTML = hudHTML; document.body.appendChild(d);
        
        let timer;
        document.addEventListener('keydown', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                e.preventDefault();
                if(!timer) timer = setTimeout(() => {
                    const h = document.getElementById('tp-hud');
                    h.style.display = (h.style.display === 'none') ? 'flex' : 'none';
                    if (h.style.display === 'flex') document.querySelector('#tp-hud button').focus();
                }, 800);
            }
        });
        document.addEventListener('keyup', e => {
            if (e.keyCode === 10009 || e.key === 'Escape') {
                clearTimeout(timer); timer = null;
                const h = document.getElementById('tp-hud');
                if (h.style.display === 'none' && window.location.pathname !== '/') window.history.back();
            }
        });
    }
})();