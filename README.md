# 📺 TizenPortal

![Version](https://img.shields.io/badge/version-0204-blue) ![Tizen](https://img.shields.io/badge/Tizen-3.0%2B-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green)

**TizenPortal** is a browser shell for Samsung Smart TVs running Tizen OS. It provides a launcher for managing self-hosted web applications (like **Audiobookshelf**, **Jellyfin**, etc.) and injects site-specific fixes for TV compatibility.

---

## ✨ Features

### 🚀 Portal Launcher
A clean, dark gradient interface to manage all your self-hosted web apps in one place.
- Grid-based layout optimized for TV remote navigation
- Site editor for adding/editing apps with custom names and icons
- Bundle selector for choosing compatibility fixes per-site

### 🔧 Site Modification (MOD Mode)
Runs as a TizenBrew `mods` module to inject fixes into any site.
- Bundle CSS/JS passed via URL payload
- Viewport locking for responsive sites
- Works universally (no cross-origin restrictions)

### 🎮 Remote Control Support
- **D-pad navigation** with spatial focus
- **Color buttons** for quick actions:
  - 🔴 Red: Address bar overlay
  - 🟢 Green: Mouse mode toggle
  - 🟡 Yellow: Return to portal
  - 🔵 Blue: Diagnostics panel

---

## 📥 Installation

This project is designed to be loaded via **TizenBrew** on your Samsung TV.

1. **Open TizenBrew** on your Samsung TV
2. **Add Module:** `alexnolan/tizenportal@0204`
3. **Launch** TizenPortal from your TizenBrew dashboard

TizenBrew will open the portal and inject the userScript into all navigated pages.

---

## 🎮 Usage

### Adding Sites
1. Press **Enter** on the "+" card
2. Fill in the site details:
   - **Name:** Display name for the card
   - **URL:** Full URL including `http://` or `https://`
   - **Bundle:** Select a compatibility bundle (or "default")
   - **Icon:** Optional - click "Fetch Favicon" or enter a custom URL

### Navigating Sites
1. Select a site card and press **Enter** to open
2. Use **D-pad** for navigation or press **🟢 Green** for mouse mode
3. Press **🟡 Yellow** to return to the portal

### Color Button Reference
| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Address Bar | Reload Page |
| 🟢 Green | Toggle Mouse | Focus Highlight |
| 🟡 Yellow | Return to Portal | Cycle Bundles |
| 🔵 Blue | Diagnostics | Safe Mode |

---

## 🏗️ Architecture (MOD Mode)

TizenPortal operates as a **TizenBrew Site Modification Module** (`packageType: "mods"`):

```
Portal (GitHub Pages)          Target Site
─────────────────────          ───────────
1. User selects card
2. Build payload (CSS/JS)
3. Navigate to:
   site.url#tp=BASE64
                               4. TizenBrew injects userScript.js
                               5. userScript reads #tp= payload
                               6. Applies bundle CSS/JS
                               7. YELLOW returns to portal
```

### Why MOD Mode?

- **No cross-origin issues** — Payload passed via URL hash
- **Full DOM access** — userScript runs in site context  
- **SPA compatible** — sessionStorage fallback for hash changes
- **Lightweight** — userScript.js is only ~8KB

---

## 🆕 What's New in v0204

- **MOD Mode Architecture** — Simplified injection via TizenBrew mods
- **Payload System** — Bundle CSS/JS passed via URL hash (`#tp=`)
- **Dual Build** — Portal runtime (~314KB) + userScript (~8KB)
- **Version Injection** — Centralized version in package.json
- **YELLOW returns home** — Press Yellow button to return to portal from any site

---

## 🤝 Compatibility

| Feature | Support Level |
| :--- | :--- |
| **Target OS** | Samsung Tizen 3.0 - 6.5 |
| **Browser Engine** | Chrome 47 - 69 (Tizen's Chromium) |
| **Tested Apps** | ✅ Audiobookshelf<br>⚠️ Jellyfin (Basic) |

---

## 🙏 Acknowledgments

This project uses code from:
- **[TizenTube](https://github.com/reisxd/TizenTube)** — Spatial navigation polyfill and DOMRect polyfill
- **[TizenBrew](https://github.com/nicholasmordecai/nicholasmordecai.github.io)** — Module loading platform

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.
