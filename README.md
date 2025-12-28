# TizenPortal

**A Universal Web App Launcher & Compatibility Layer for Samsung Tizen TVs.**

TizenPortal allows you to run modern self-hosted web applications (like Audiobookshelf) on older Samsung TVs that run outdated versions of Chromium (e.g., Chrome 63). It fixes "Exploding CSS" bugs, adds remote control support, and injects a modern system overlay.

## 🚀 Why this exists
Modern web apps use CSS features like `gap`, `aspect-ratio`, `inset`, and `:focus-visible`.
Older Samsung TVs (running Tizen 3.0/4.0) **do not support these features**.
* **Without TizenPortal:** Apps look broken. Images stretch infinitely, buttons aren't clickable, and the remote does nothing.
* **With TizenPortal:** We inject a "Polyfill Payload" that patches the browser engine on the fly, allowing modern layouts to render correctly.

## ✨ Features
* **The "Rescue Pack":** Automatically fixes the "Exploding Image" flexbox bug found in Chrome 63.
* **Spatial Navigation:** Navigate web apps using the physical Arrow Keys on your Samsung Remote.
* **System HUD:** Long-press **BACK** to access a hidden overlay for Reloading, Zooming, or Exiting apps.
* **Window Smuggler Architecture:** Configuration is passed securely between the Launcher and the Local App via `window.name`, requiring **no local server**.
* **Zero-Config Polyfills:** Adds support for `gap`, `aspect-ratio`, and `ResizeObserver` automatically.

## 📺 Installation
This application is designed to be loaded via **TizenBrew**.

1.  Open **TizenBrew** on your Samsung TV.
2.  Go to **Add Repository**.
3.  Enter URL: `https://github.com/alexnolan/tizenportal`
4.  Install the **TizenPortal** module.
5.  Launch it.

## ⚙️ Usage
### Adding Apps
1.  Launch TizenPortal.
2.  Click the **+ (Add)** button.
3.  **Name:** The label for your app.
4.  **URL:** The local IP of your server (e.g., `http://192.168.1.50:13378`).
5.  **Preset:** Choose a preset if available (e.g., "Audiobookshelf") or leave as Custom.
6.  **Save.**

### Controls
* **Arrow Keys:** Navigate the grid / App interface.
* **OK / Enter:** Select item.
* **Back (Short Press):** Go back in history.
* **Back (Long Press - 1s):** Open **System HUD** (Exit, Reload, Zoom).

## 🛠 Architecture
TizenPortal uses a unique "Smuggler" architecture to bypass Cross-Origin restrictions between GitHub Pages and your Local Network.

1.  **Launcher (Remote):** Hosted on GitHub Pages. You configure your apps here.
2.  **The Handshake:** When you click an app, the Launcher packs all CSS/JS fixes into a JSON string and saves it to `window.name`.
3.  **Redirect:** The browser navigates to your local IP (`192.168.x.x`). `window.name` persists across this navigation.
4.  **Injector (Local):** TizenBrew loads `userScript.js` on the target app. It checks `window.name`, unpacks the fixes, and injects them into the DOM immediately.

## 📄 License
MIT License. Feel free to fork, modify, and distribute.