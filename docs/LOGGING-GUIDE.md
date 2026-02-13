# TizenPortal Logging & Diagnostics Guide

**Tag:** 1036+  
**Purpose:** Complete logging of feature injection system for debugging text scale and other feature persistence issues

## Overview

Tag 1036 introduces comprehensive logging throughout the feature injection system. This allows complete visibility into why global preferences (text scale, focus styling, etc.) may not be appearing on target sites.

## Diagnostic Flow

When you set text scale to "Medium" in the portal and navigate to a target site, here's what should appear in the **Diagnostics Panel** (Blue button):

### 1. Portal: Preferences Saved
```
[Feature] Global override for textScale: medium
TizenPortal: Configuration initialized
```

### 2. Site Navigation
User navigates to target site with URL payload containing card info.

### 3. Target Site: Features Applied (should see these logs)

#### Phase 1: Override Building
```
[Feature] Building overrides for card: My Site
[Feature] Global override for textScale: medium
[Feature] Built overrides: {"textScale":"medium"}
```

#### Phase 2: Feature Application
```
[Feature] Applying global features for: My Site
[Feature] Final overrides to apply: {"textScale":"medium"}
[Features] Effective config: {"textScale":"medium",...}
[Features] Applying textScale: medium
[TextScale] Applying level: medium
[TextScale] CSS generated, length: 347
[TextScale] Style injected into document
```

#### Phase 3: Confirmation
```
[Features] All features applied successfully
```

## Log Entry Format

All logs are prefixed with context:

| Prefix | Source | Meaning |
|--------|--------|---------|
| `[Feature]` | core/index.js | Feature override detection and building |
| `[Features]` | features/index.js | Feature loader applying multiple features |
| `[TextScale]` | features/text-scale.js | Text scale specific operations |

## Viewing Logs on Target Sites

**Portal Page (index.html):**
1. Press **Blue** button (Diagnostics)
2. Should see "Features: Applied" when portal loads
3. Logs captured from `console.log()`, `console.warn()`, `console.error()`

**Target Site (Audiobookshelf, etc.):**
1. Navigate to site with text scale set to non-'off' value
2. Press **Blue** button on target site (opens injected diagnostics panel)
3. Should see complete feature injection log sequence
4. If text scale not working, look for:
   - Missing `[Feature]` logs (override not read)
   - Missing `[TextScale]` logs (feature not applied)
   - Error logs in the sequence

## Debugging Text Scale Not Working

### Symptom: Text scale works on portal but not on target sites

1. **Open Diagnostics on Portal** (Blue button)
   - Should see: `[Feature] Global override for textScale: medium`
   - If missing: Global config not being saved

2. **Navigate to Site**
   - Set text scale to "Medium" in portal
   - Navigate to Audiobookshelf

3. **Open Diagnostics on Site** (Blue button)
   - Look for: `[TextScale] Style injected into document`
   - If missing, check for errors above it

4. **Check Each Phase:**
   - **Phase 1 missing?** Global config not read during override building
     - Look for `[Feature] Global override for textScale` logs
   - **Phase 2 missing?** Feature loader not processing textScale
     - Look for `[Features] Applying textScale` logs
   - **Phase 3 missing?** CSS injection failed
     - Look for error: `[TextScale] Failed to apply:`

## Common Issues & Solutions

| Problem | Logs to Check | Solution |
|---------|---|---|
| Text scale set but logs show 'off' | `[Feature] Global override for textScale: off` | Check if value is being saved in preferences |
| Global override not showing | No `[Feature] Global override for textScale` logs | Config not being read - check localStorage |
| CSS not injecting | `[TextScale] CSS generated` but no `Style injected` | Check if document.head exists |
| No logs appear at all on site | Any logs at all | Site injection may not be happening - check bundle loading |

## Adding Logs to Your Own Code

When working with features or bundles:

```js
// In core/index.js or features/*.js
if (window.TizenPortal) {
  window.TizenPortal.log('[MyFeature] Debug message here');
  window.TizenPortal.warn('[MyFeature] Something unexpected');
  window.TizenPortal.error('[MyFeature] Error occurred');
} else {
  console.log('[MyFeature] Debug message here');
}
```

The dual logging ensures compatibility on both portal and target sites where `TizenPortal` might not be fully initialized yet.

## Performance Impact

Logging has negligible performance impact:
- All logs go through the same capture system as console
- Circular buffer limits memory to ~500 entries
- Diagnostics panel is closed by default (no rendering overhead)
- Injected logging code is minimal

## Disabling Logs

Logs cannot be disabled without rebuilding. If needed in production, grep for log calls and conditionally skip them. For development, they provide critical visibility.

## Related Files

- [API Reference - TizenPortal.log/warn/error](./Api-Reference.md#tizenportallog--warn--error)
- [Diagnostics System](./Architecture.md#diagnostics-system)
- [Features](./Architecture.md#features-subsystem)
