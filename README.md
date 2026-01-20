# 📺 TizenPortal

![Version](https://img.shields.io/badge/version-0200-blue) ![Tizen](https://img.shields.io/badge/Tizen-3.0%2B-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green)

**TizenPortal** is a universal browser shell and compatibility layer for Samsung Smart TVs running Tizen OS. It provides a launcher for managing self-hosted web applications (like **Audiobookshelf**, **Jellyfin**, etc.) and applies site-specific fixes for better TV compatibility.

---

## ✨ Features

### 🚀 Universal Launcher (App Mode)
A clean, dark gradient interface to manage all your self-hosted web apps in one place.
- Grid-based layout optimized for TV remote navigation
- Site editor for adding/editing apps with custom names and icons
- Bundle selector for choosing compatibility fixes per-site

### 🔧 Site Compatibility Layer (Mod Mode)
Runs alongside your sites to apply TV-friendly fixes.
- Direct DOM injection for full compatibility
- Per-site bundles for targeted fixes
- Works with TizenBrew's mod system

### 🎮 Remote Control Support
- **D-pad navigation** with spatial focus
- **Color buttons** for quick actions:
  - 🔴 Red: Address bar / Return to portal (when on a site)
  - 🟢 Green: Mouse mode toggle
  - 🟡 Yellow: Bundle menu
  - 🔵 Blue: Diagnostics panel

---

## 📥 Installation

This project is designed to be loaded via **TizenBrew** on your Samsung TV.

1. **Open TizenBrew** on your Samsung TV
2. **Add Module:** `alexnolan/tizenportal@0200`
3. **Launch** TizenPortal from your TizenBrew dashboard

The same package provides both the portal launcher (app) and site injection (mod).

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
3. Press **🔴 Red** to return to the portal launcher

### Color Button Reference
| Button | Short Press | Long Press |
|--------|-------------|------------|
| 🔴 Red | Return to Portal | Reload Page |
| 🟢 Green | Toggle Mouse | Focus Highlight |
| 🟡 Yellow | Bundle Menu | Cycle Bundles |
| 🔵 Blue | Diagnostics | Safe Mode |

---

## 🆕 What's New in 0200

### Dual-Mode Architecture
- **App Mode:** Portal launcher UI with card grid, site editor
- **Mod Mode:** Injected into sites for bundle application
- Same codebase, different TizenBrew package types

### Direct Site Navigation
- Sites now open in the main browser (not iframes)
- Full DOM access for bundle injection
- Better compatibility with complex SPAs

### Improved Input Handling
- Mode-aware key handling
- Red button returns to portal from any site

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
