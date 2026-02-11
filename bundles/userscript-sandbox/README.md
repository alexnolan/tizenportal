# Userscript Sandbox Bundle

A collection of high-quality userscripts designed for TV browsing with Samsung remote controls.

## Version 2.0.0

This bundle provides 10 carefully crafted userscripts that demonstrate both inline and external script loading capabilities.

---

## 📜 Included Scripts

### 1. **TV Readability Booster** ✅ *Enabled by Default*

**Purpose:** Optimizes text and interactive elements for TV viewing distance

**Features:**
- Font sizes automatically scale between 18-32px based on viewport
- Enhanced line height (1.8) and letter spacing for better readability
- Maximum width constraint (1200px) prevents excessive line length
- Links get high-visibility cyan outlines
- All interactive elements (buttons, inputs) sized for easy targeting
- Fully reversible with cleanup function

**Use Case:** Enable on any text-heavy site (news, blogs, documentation)

---

### 2. **Smart Auto-Scroll**

**Purpose:** Intelligent auto-scrolling with speed control and pause/resume

**Features:**
- Progressive scroll speed: 1px/30ms default
- **Up Arrow:** Decrease speed (-0.5px, min 0.5px)
- **Down Arrow:** Increase speed (+0.5px, max 5px)
- **Enter/Pause:** Toggle pause/resume
- **Stop/Back:** Stop scrolling and exit
- Real-time speed feedback via TizenPortal.log
- Fully reversible cleanup

**Use Case:** Long articles, documentation, scrolling credits

**Improvements over v1:**
- Variable speed control (was fixed 1px/50ms)
- Pause/resume functionality (was single-stop only)
- User feedback for all actions
- Better key handling with preventDefault

---

### 3. **Smart Dark Mode**

**Purpose:** Intelligent dark theme without image distortion

**Features:**
- Background colors: Dark gray (#181818) with warm white text (#e8e6e3)
- Preserves image/video colors (90% opacity for comfort)
- Link colors: Blue (#8ab4f8) and purple (#c58af9) for visited
- Form elements styled for dark mode with proper borders
- Input placeholders use subtle gray (#9aa0a6)
- Inline style overrides for dynamic backgrounds
- Fully reversible with style element removal

**Use Case:** Any bright website (Google, Wikipedia, news sites)

**Improvements over v1:**
- No hue rotation distortion (was invert + hue-rotate)
- Images/videos not inverted (was double-inverted)
- Proper color palette instead of simple inversion
- Handles inline styles with targeted overrides
- Works correctly on Google homepage and other white backgrounds

---

### 4. **YouTube TV Enhancements**

**Purpose:** Improves YouTube experience on TV

**Features:**
- Forces player controls to stay visible
- Enlarges play button, time display, and volume controls (140%)
- Increases clickable area (50px minimum)
- Sets video max height to 90vh for better visibility
- Normalizes playback rate to 1.0x
- Only activates on youtube.com domains

**Use Case:** Watching YouTube videos on TV

---

### 5. **Video Ad Skip Helper**

**Purpose:** Automatically clicks "Skip Ad" buttons when they appear

**Features:**
- Monitors for skip buttons across multiple selectors
- Checks every 2 seconds for new skip buttons
- Uses MutationObserver for instant detection of new elements
- Handles YouTube and generic ad skip patterns
- Logs when skip buttons are clicked
- Fully reversible cleanup

**Use Case:** YouTube, Twitch, and other video platforms with skippable ads

---

### 6. **Image Focus Zoom**

**Purpose:** Click any image to view it fullscreen

**Features:**
- Fullscreen overlay with dark background (90% opacity)
- Image scaled to fit 95% of viewport
- Press **Back** or **Enter** to close
- Works with any image on the page
- Prevents propagation to avoid unintended navigation
- Fully reversible cleanup

**Use Case:** Product images, galleries, social media, documentation diagrams

---

### 7. **Auto-Play Video Blocker**

**Purpose:** Prevents videos from auto-playing

**Features:**
- Automatically pauses any auto-playing video detected
- Monitors for new videos via MutationObserver
- Checks every second for auto-play attempts
- Logs when videos are paused
- Fully reversible cleanup

**Use Case:** News sites, social media, any site with annoying auto-play videos

---

### 8. **Remove Sticky Headers**

**Purpose:** Removes fixed/sticky headers that block content

**Features:**
- Converts `position: fixed` to `position: static`
- Handles inline styles and class-based positioning
- Targets headers, navbars, and common sticky patterns
- Fully reversible with style element removal

**Use Case:** News sites, documentation sites with sticky navigation

---

### 9. **Grayscale Mode**

**Purpose:** External script example - converts page to grayscale

**Features:**
- Demonstrates loading scripts from external URLs
- Uses jsdelivr CDN for reliable delivery
- Source: Stylus browser extension's grayscale tool
- Cached after first load for offline use

**Use Case:** Reduce eye strain, accessibility, focus mode

**Note:** This is an example of loading external userscripts. The URL-based script will be fetched and cached on first use.

---

### 10. **Custom CSS Template**

**Purpose:** Template for users to add their own CSS

**Features:**
- Pre-configured style injection framework
- Cleanup function for reversibility
- Example CSS structure commented
- Fully reversible

**Use Case:** Quick CSS experiments, site-specific tweaks

**To Customize:**
1. Copy the script to a new entry in Preferences → Userscripts
2. Edit the inline code to replace the CSS content
3. Enable the script

---

## 🎯 Script Quality Improvements

### What Changed from v1.0.0

**1. Dark Mode (Major Overhaul)**
- **Old:** Simple invert filter with hue-rotate (inverted images twice)
- **New:** Intelligent color palette that preserves media colors
- **Impact:** Works correctly on Google homepage, no more "inverted white = white"

**2. Auto-Scroll (Significant Enhancement)**
- **Old:** Fixed speed, single stop
- **New:** Variable speed control, pause/resume, user feedback
- **Impact:** Much more practical for different content types

**3. Readability Booster (Refinement)**
- **Old:** Basic font sizing
- **New:** Comprehensive typography improvements, max-width, better spacing
- **Impact:** Professional-grade text layout for TV viewing

**4. All New Scripts**
- YouTube TV enhancements
- Ad skip automation
- Image zoom viewer
- Auto-play blocking
- Sticky header removal
- External script example (grayscale)
- CSS template for user customization

---

## 🔧 Technical Implementation

### Chrome 47 Compatibility

All scripts are written for compatibility with Samsung Tizen's Chrome 47 engine:

- ✅ ES5 syntax (no arrow functions in built output)
- ✅ `var` instead of `let`/`const` where needed
- ✅ Traditional function expressions
- ✅ MutationObserver (Chrome 26+)
- ✅ querySelector/querySelectorAll (Chrome 1+)
- ✅ Basic DOM manipulation

### Cleanup Pattern

Every script implements the cleanup pattern:

```javascript
userscript.cleanup = function() {
  // Remove event listeners
  // Clear intervals
  // Remove injected elements
  // Disconnect observers
};
```

This ensures scripts can be toggled on/off without leaving artifacts.

### Logging

Scripts use `TizenPortal.log()` for user-visible feedback:

```javascript
TizenPortal.log('Auto-scroll started');
```

These messages appear in the diagnostics panel (Blue button).

---

## 🎮 Usage Tips

### Enabling Scripts

1. Navigate to a site with the Userscript Sandbox bundle
2. Press **Yellow** to return to portal
3. Long-press **Enter** on the site card
4. Scroll to "Bundle Scripts" section
5. Toggle scripts on/off as needed

### Script Order Matters

Scripts execute in order. If you have conflicts:
- Disable conflicting scripts
- Reorder in the bundle definition
- Check the diagnostics panel for errors

### Performance Notes

- Auto-scroll and video blocker use intervals/observers (minimal CPU)
- Dark mode and readability inject static CSS (no overhead)
- Image zoom and ad skipper only activate on user interaction

---

## 📚 Adding Your Own Scripts

### Inline Script Template

```javascript
{
  id: 'my-script',
  name: 'My Script Name',
  enabled: false,
  inline: "(function(){/* Your code here */})();",
}
```

### External Script Template

```javascript
{
  id: 'my-external',
  name: 'My External Script',
  source: 'url',
  enabled: false,
  url: 'https://cdn.example.com/script.js',
  inline: '',
  cached: '',
}
```

### Best Practices

1. **Always use IIFE:** `(function(){ ... })();`
2. **Implement cleanup:** `userscript.cleanup = function(){ ... }`
3. **Check TizenPortal exists:** `if (window.TizenPortal)`
4. **Log important actions:** `TizenPortal.log('...')`
5. **Handle errors gracefully:** Use try-catch for DOM queries
6. **Prefix IDs:** Use unique prefixes for injected elements
7. **Test on Tizen:** Chrome 47 has limitations

---

## 🔗 External Script Sources

The grayscale script demonstrates loading from jsdelivr CDN:

```
https://cdn.jsdelivr.net/gh/openstyles/stylus@1.5.31/tools/grayscale.user.js
```

### Recommended External Sources

- **jsdelivr:** Fast, reliable CDN for GitHub repos
- **cdnjs:** Common libraries and utilities
- **unpkg:** NPM packages
- **GitHub raw:** Direct file access (use jsdelivr instead for better caching)

### Security Note

External scripts run with full page access. Only enable scripts from trusted sources.

---

## 📖 Examples from the Web

These scripts were inspired by and adapted from:

1. **Dark Reader** methodology (color inversion → palette replacement)
2. **Stylus** browser extension (grayscale example)
3. **TV-friendly UX** patterns from TizenTube and similar projects
4. **YouTube TV** interfaces (control visibility and sizing)
5. Common userscript patterns from **Greasyfork** and **OpenUserJS**

---

## 🎓 Learning Resources

Want to write your own userscripts? Check out:

- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript and DOM APIs
- [Greasyfork](https://greasyfork.org/) - Userscript repository
- [OpenUserJS](https://openuserjs.org/) - More userscripts
- [TizenPortal Docs](../../docs/) - Platform-specific features

---

## 🐛 Troubleshooting

### Script Not Working

1. Check if script is enabled in site card settings
2. Look for errors in diagnostics panel (Blue button)
3. Verify site domain isn't blocked by script logic
4. Check Chrome 47 compatibility

### Script Conflicts

1. Disable all scripts except one
2. Test each script individually
3. Check for CSS specificity issues
4. Review script execution order

### Performance Issues

1. Disable auto-scroll and video blocker first (use intervals)
2. Check diagnostics for repeated errors
3. Reduce concurrent scripts
4. Clear cache and reload

---

## 📜 License

MIT - Same as TizenPortal

---

## 🙏 Acknowledgments

- **Dark Reader** for dark mode methodology
- **Stylus** for the grayscale script
- **TizenTube** for TV UX patterns
- **Greasyfork** community for userscript inspiration
