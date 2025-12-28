const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const DB_FILE = path.join(__dirname, 'db.json');
const PRESETS_FILE = path.join(__dirname, 'presets.json');

if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // API: GET CONFIG
    if (url.pathname === '/api/config') {
        const targetUrl = url.searchParams.get('url');
        const apps = JSON.parse(fs.readFileSync(DB_FILE));
        const presets = JSON.parse(fs.readFileSync(PRESETS_FILE));
        
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

    // API: LIST APPS
    if (url.pathname === '/api/apps' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        fs.createReadStream(DB_FILE).pipe(res);
        return;
    }

    // API: SAVE APP
    if (url.pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', c => body += c);
        req.on('end', () => {
            const data = JSON.parse(body);
            const apps = JSON.parse(fs.readFileSync(DB_FILE));
            
            if (data.delete) {
                const newApps = apps.filter(a => a.url !== data.url);
                fs.writeFileSync(DB_FILE, JSON.stringify(newApps, null, 2));
            } else {
                const idx = apps.findIndex(a => a.url === data.url);
                if (idx >= 0) apps[idx] = data;
                else apps.push(data);
                fs.writeFileSync(DB_FILE, JSON.stringify(apps, null, 2));
            }
            res.writeHead(200); res.end('{"status":"ok"}');
        });
        return;
    }

    // STATIC FILES
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
    onLoad: () => { console.log("[TP] Service started on " + PORT); server.listen(PORT); },
    onUnload: () => { server.close(); }
};