const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const DB_FILE = path.join(__dirname, 'db.json');
const PRESETS_FILE = path.join(__dirname, 'presets.json');

// Ensure DB exists
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // --- API: GET CONFIG (Injector) ---
    if (url.pathname === '/api/config') {
        const targetUrl = url.searchParams.get('url');
        let apps = []; try { apps = JSON.parse(fs.readFileSync(DB_FILE)); } catch(e){}
        let presets = {}; try { presets = JSON.parse(fs.readFileSync(PRESETS_FILE)); } catch(e){}
        
        const app = apps.find(a => targetUrl.startsWith(a.url));
        const preset = app ? (presets[app.presetID] || {}) : {};
        const core = presets['__CORE__'] || {};

        const payload = {
            coreCSS: core.css || '',
            coreJS: core.js || '',
            appCSS: (preset.css || '') + (app ? app.customCSS || '' : ''),
            appJS: (preset.js || '') + (app ? app.customJS || '' : '')
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(payload));
    }

    // --- API: LIST APPS (Launcher) ---
    if (url.pathname === '/api/apps' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(DB_FILE).pipe(res);
        return;
    }

    // --- API: SAVE APP (Launcher) ---
    if (url.pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            const data = JSON.parse(body);
            let apps = JSON.parse(fs.readFileSync(DB_FILE));
            
            if (data.delete) {
                apps = apps.filter(a => a.url !== data.url);
            } else {
                const idx = apps.findIndex(a => a.url === data.url);
                if (idx >= 0) apps[idx] = data;
                else apps.push(data);
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(apps, null, 2));
            res.writeHead(200); res.end('{"status":"ok"}');
        });
        return;
    }

    // --- API: FORCE UPDATE (Self-Updater) ---
    if (url.pathname === '/api/update' && req.method === 'POST') {
        console.log("[TP] Starting Update...");
        const REPO = "https://raw.githubusercontent.com/alexnolan/tizenportal/master";
        const FILES = [
            { remote: '/dist/service.js', local: path.join(__dirname, 'service.js') },
            { remote: '/dist/userScript.js', local: path.join(__dirname, 'userScript.js') },
            { remote: '/dist/index.html', local: path.join(__dirname, 'index.html') },
            { remote: '/dist/presets.json', local: path.join(__dirname, 'presets.json') },
            { remote: '/package.json', local: path.join(__dirname, '../package.json') }
        ];

        let completed = 0;
        let errors = 0;

        FILES.forEach(file => {
            const fileUrl = REPO + file.remote + '?t=' + Date.now();
            https.get(fileUrl, (r) => {
                if (r.statusCode !== 200) { errors++; check(); return; }
                let d = '';
                r.on('data', c => d += c);
                r.on('end', () => {
                    try { fs.writeFileSync(file.local, d); console.log("Updated " + file.local); } 
                    catch(e) { console.error(e); errors++; }
                    completed++; check();
                });
            }).on('error', () => { errors++; check(); });
        });

        function check() {
            if (completed + errors === FILES.length) {
                const msg = errors > 0 ? "Update finished with errors." : "Update Complete! Please Restart App.";
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: errors? 'error':'ok', message: msg }));
            }
        }
        return;
    }

    // --- STATIC FILES ---
    let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const map = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript' };
        res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404); res.end('Not Found');
    }
});

module.exports = {
    onLoad: () => { console.log("[TP] Service running on " + PORT); server.listen(PORT); },
    onUnload: () => { server.close(); }
};