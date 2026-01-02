# ABS Preset Minified Code Reference

This file maps the minified ABS preset code back to readable names for debugging.

## Minified Variable Names (Terser output)

| Minified | Original | Description |
|----------|----------|-------------|
| `e` | various | Loop iterator, event, element (context-dependent) |
| `t` | various | DOM element, fragment, second param |
| `n` | various | Element, nuxtEl, node |
| `o` | various | Options, original element |
| `i` | various | Index, id |
| `r` | various | Result, row element |
| `s` | various | String, siderail, submitBtn |
| `c` | various | Clone, category |
| `a` | various | Anchor, navItem |
| `l` | various | Link, label |
| `d` | various | Dropdown reference |
| `u` | various | URL, appbar |
| `h` | various | HUD element, libDropdown |
| `m` | various | Menu item |
| `p` | various | Paragraph element, configLink |
| `g` | various | Settings button |
| `f` | various | Search input reference |
| `v` | various | Search button |
| `y` | various | Series clone |
| `b` | various | Image element |
| `x` | various | Image clone |
| `k` | various | Label div |
| `C` | various | Series text |
| `E` | `apiImages` | API images array |
| `S` | various | Loop index |
| `T` | `apiImg` | API image element |
| `F` | `apiId` | API image ID |
| `A` | `aClone` | API image clone |
| `w` | `aImgEl` | API image element clone |
| `I` | `clickable` | Clickable parent |

## Key ABS Object Properties

```javascript
ABS = {
    state: 'INIT',           // Current state: INIT, WAIT_NUXT, DETECT_PAGE, READY
    boat: null,              // #tp-lifeboat container element
    nav: null,               // #tp-navbar sidebar element
    menu: null,              // #tp-menu forms panel element
    observer: null,          // MutationObserver instance
    cache: {
        processedBooks: {},  // Already rendered book IDs
        processedHeadings: {},// Already rendered section headers
        processedNav: false  // Whether nav extraction is complete
    },
    mode: null,              // 'content' or 'form'
    menuFocused: false,      // Is menu panel active
    menuExpanded: false,     // (unused)
    selectedFormIdx: 0,      // Currently selected form in menu
    forms: [],               // Detected form groups
    initialized: false       // Prevent double-init
}
```

## Key Functions

| Function | Purpose |
|----------|---------|
| `ABS.init()` | Entry point, starts state machine |
| `ABS.waitForNuxt()` | Polls for Nuxt app ready, creates lifeboat |
| `ABS.createLifeboat()` | Creates #tp-lifeboat, #tp-navbar, #tp-menu |
| `ABS.extractNavigation()` | Scrapes siderail links into navbar |
| `ABS.setupMutationObserver()` | Watches DOM for content changes |
| `ABS.detectAndRender()` | Main detection: finds books, forms |
| `ABS.detectForms()` | Finds login/search/filter inputs |
| `ABS.renderMenuUI()` | Renders form category list |
| `ABS.selectForm(idx)` | Switches active form category |
| `ABS.renderSelectedForm()` | Renders inputs for selected form |
| `ABS.renderSearchForm()` | Creates search input proxy |
| `ABS.renderLoginForm()` | Calls TizenUtils.handleLogin() |
| `ABS.renderFilterForm()` | Creates select proxy elements |
| `ABS.toggleMenuFocus()` | Shows/hides form menu |
| `ABS.renderContent()` | Renders book/series cards to lifeboat |

## CSS Selectors Used

| Selector | Purpose |
|----------|---------|
| `[id^="book-card-"]` | Book cards (from LazyBookCard.vue) |
| `[id^="series-card-"]` | Series cards |
| `[id^="collection-card-"]` | Collection cards |
| `#bookshelf` | Main content container |
| `#siderail-buttons-container` | Sidebar nav links |
| `#appbar` | Top app bar |
| `input[name="username"]` | ABS login username field |
| `input[name="password"]` | ABS login password field |
| `#nuxt-loading` | Nuxt loader overlay |
| `[id*="__nuxt"]` | Nuxt app container |
| `img[src*="/api/"]` | API-served cover images |

## State Machine

```
INIT → waitForNuxt() → WAIT_NUXT
                           ↓
                      createLifeboat()
                      setupMutationObserver()
                           ↓
                      DETECT_PAGE
                           ↓ (on content found)
                      renderContent() or renderMenuUI()
                           ↓
                        READY
```

## Remote Key Codes

| Code | Key | Action in ABS |
|------|-----|---------------|
| 13 | Enter | Click focused item |
| 27 | Escape | Blur/close menu |
| 10009 | Back | Blur/close menu |
| 38 | Up | Navigate up |
| 40 | Down | Navigate down |
| 406 | Blue | Toggle forms menu (handled in userScript) |

## CSS Classes

| Class | Purpose |
|-------|---------|
| `.tp-lifeboat-active` | Added to body when lifeboat is active |
| `.tp-nav-item` | Navbar button style |
| `.tp-menu-item` | Form category list item |
| `.tp-rescued-card` | Cloned book card style |

## Original Source Files (ABS repo)

- `SideRail.vue` → `#siderail-buttons-container`
- `Appbar.vue` → `#appbar`, search, settings
- `LazyBookCard.vue` → `[id^="book-card-"]`
- `login.vue` → `input[name="username/password"]`
- `default.vue` → `#app-content`
