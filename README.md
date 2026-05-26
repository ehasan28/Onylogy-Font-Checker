<div align="center">

<img src="public/icon/128.png" alt="Onylogy Font Checker logo" width="96" height="96">

# Onylogy Font Checker

**The free Chrome extension for inspecting, identifying, and exporting typography from any website.**

Hover any text to see its exact font family, weight, size, line height, letter spacing, and color. Click to pin a card to the page. Detect Google Fonts, Adobe Fonts, self-hosted, and variable fonts. Generate ready-to-ship typography tokens for CSS, Tailwind, SCSS, JSON, Kadence, and responsive `clamp()`.

By **[Onylogy Studio](https://github.com/ehasan28)** · Created by **[Ehasanul Haque](https://github.com/ehasan28)**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Manifest_V3-004BD1?style=flat-square&logo=googlechrome&logoColor=white)](#install)
[![Version](https://img.shields.io/badge/version-0.2.0-004BD1?style=flat-square)](#changelog)
[![License](https://img.shields.io/badge/license-MIT-004BD1?style=flat-square)](#license)
[![Built with WXT](https://img.shields.io/badge/built_with-WXT-004BD1?style=flat-square)](https://wxt.dev)
[![React 19](https://img.shields.io/badge/React-19-004BD1?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-004BD1?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

## Table of contents

- [What it does](#what-it-does)
- [Who it's for](#who-its-for)
- [What makes it different](#what-makes-it-different)
- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Screenshots](#screenshots)
- [Exports](#exports)
- [Tech stack](#tech-stack)
- [Develop](#develop)
- [Permissions](#permissions)
- [Roadmap](#roadmap)
- [FAQ](#faq)
- [Changelog](#changelog)
- [License](#license)
- [Author](#author)

---

## What it does

Onylogy Font Checker is a free Chrome extension that turns any web page into a typography inspector. It identifies the exact fonts in use, surfaces every CSS typographic property, attributes the source (Google Fonts, Adobe Fonts, self-hosted, system, or variable fonts), analyzes readability, and exports the entire system as developer-ready tokens — all from a fast popup and a frosted-glass overlay that lives on the page.

If you've ever asked **"what font is this site using?"**, **"what size and line height is that heading?"**, or **"how do I capture this site's type scale into my Tailwind config?"**, this is built for that workflow.

## Who it's for

- **WordPress designers and developers** working with Gutenberg, Kadence, or any block theme who need fast typography inspection without opening DevTools.
- **Frontend developers** building design systems who want to capture an existing site's type scale into CSS variables, Tailwind, SCSS, or JSON tokens.
- **UI / UX designers** auditing typography hierarchy, readability, and font usage on competitor sites or their own work.
- **Accessibility specialists** checking body font size, line height, line length, contrast, and uppercase letter-spacing against WCAG baselines.
- **Educators and curious readers** who want to identify the fonts behind a site they love.

## What makes it different

Most "what font is this" tools tell you the family and stop. Onylogy Font Checker is built around three ideas that the existing tools miss:

1. **Pin multiple cards on the page.** Click any text to pin a typography card right where that element sits on the page — it scrolls with the content, not stuck to the screen. Inspect a heading, body, button, and caption side by side without losing context.
2. **Anchor cards to the document, not the viewport.** Pinned cards scroll with the page they were pinned on. Open, pin, scroll, compare.
3. **Export the whole system, not just one value.** A full hierarchy scan returns every role (H1–H6, body, button, link, caption, blockquote), the modular scale ratio behind them, and exports to six formats — including responsive `clamp()` and WordPress Kadence Global Typography.

Plus: a clean **light/dark** mode (light by default), Bricolage Grotesque + Montserrat in the chrome, AA-compliant contrast in both themes, and a brand-blue `#004BD1` accent.

## Features

### Live font inspector

- Hover any text element. A compact frosted-glass tooltip follows your cursor showing the font family.
- Click to **pin** a full data card right next to the element, with **Family, Weight, Size, Line height, Letter spacing, Color, Text transform**, all copyable.
- Pinned cards stay anchored to the page content — scroll the page and the cards scroll with it.
- Press **Esc** to exit inspect mode and clear pinned cards.

### Typography hierarchy detection

- One-click scan of the page returns every typographic role: **H1, H2, H3, H4, H5, H6, body, caption, button, link, blockquote**.
- Detects the **modular scale ratio** behind the sizes (1.067 minor-second through 1.618 golden ratio) with high/medium/low confidence.
- Lists every font family in use with usage counts and which roles each family appears in.

### Font source attribution

- Identifies whether each family is loaded from **Google Fonts**, **Adobe Fonts (Typekit)**, **self-hosted**, **system**, or unknown.
- Detects **variable fonts** and surfaces available axes (wght, wdth, etc.).
- Shows whether the font is loaded yet via the `document.fonts` FontFaceSet API.

### Accessibility analysis

Eight checks against widely cited readability baselines:

- Body font size ≥ 16px
- Caption font size ≥ 12px
- Body line-height ratio ≥ 1.4 (ideal 1.5+)
- Characters per line in the comfortable range (45–75)
- Uppercase letter-spacing ≥ 0.05em
- Color contrast meeting WCAG AA (normal and large text)
- Thin weights (≤ 300) at small sizes
- Numeric **score 0–100** with animated donut + filterable issue list

### Export system

Generate developer-ready tokens for your stack:

- **CSS variables** — `--font-h1-size`, `--font-h1-line-height`, `--font-family-sans`, etc.
- **Tailwind config** — `fontSize` and `fontFamily` extensions ready to paste.
- **SCSS** — `$font-h1-size`, `$font-family-sans`, etc.
- **JSON** — nested design-token shape compatible with Style Dictionary and similar pipelines.
- **WordPress Kadence** — `kadence_typography_options` JSON for the Kadence theme.
- **Responsive `clamp()`** — fluid type that scales between 320px and 1440px viewports per role.

Every output has a one-click copy button and an animated format switcher.

### Theme & UX

- **Light mode by default**, dark mode one click away. Theme persists across sessions.
- **Bricolage Grotesque** display type + **Montserrat** body + **JetBrains Mono** for values.
- **Frosted-glass cards** on the page with `backdrop-filter` blur.
- **1:1 cursor follow** — the hover tooltip is bound directly to mousemove via Framer Motion `motionValue`, so there is no spring lag.
- **AA contrast verified** in both themes for every text token.
- Browser-wide **keyboard shortcut** to toggle inspect mode from any tab.

## Install

### From the Chrome Web Store

_Coming soon._

### From source (manual)

```bash
git clone https://github.com/ehasan28/onylogy-font-checker.git
cd onylogy-font-checker
npm install
npm run build
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder inside this repository.

The extension icon (a blue "Aa" wordmark) will appear in your toolbar.

## Quick start

1. **Click the toolbar icon.** Inspect mode arms automatically.
2. **Hover** any text on the page — a small floating card shows the font family.
3. **Click** text to pin a full data card at that spot. Pin as many as you like.
4. **Scroll** the page — pinned cards scroll with the content.
5. **Press Esc** at any time to exit inspect mode and clear cards.
6. Open the **Hierarchy** tab in the popup to scan the whole page's type system, or the **Export** tab to copy out tokens in your preferred format.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Shift + F` | Toggle inspect mode (browser-wide; remappable at `chrome://extensions/shortcuts`) |
| `I` | Toggle inspect mode (when popup is open) |
| `T` | Toggle light / dark theme |
| `E` | Jump to Export tab |
| `1` `2` `3` `4` | Switch tabs (Inspect / Hierarchy / A11y / Export) |
| `Esc` | Exit inspect mode and clear pinned cards |

## Screenshots

> Replace the placeholders below with your own captures before publishing.

| Inspect mode | Hierarchy scan | Accessibility |
|---|---|---|
| ![Inspect tab](assets/screenshot-inspect.png) | ![Hierarchy tab](assets/screenshot-hierarchy.png) | ![A11y tab](assets/screenshot-a11y.png) |

| Pinned cards on a real page | Export panel | Dark mode |
|---|---|---|
| ![Pinned cards](assets/screenshot-pinned.png) | ![Export tab](assets/screenshot-export.png) | ![Dark mode](assets/screenshot-dark.png) |

## Exports

Each format below is what you get for a typical four-role hierarchy (H1, H2, body, caption). The Export tab generates these on the fly from whatever the page actually contains.

<details>
<summary><b>CSS variables</b></summary>

```css
:root {
  --font-family-sans: 'Inter', system-ui, sans-serif;

  --font-h1-size: 3rem;
  --font-h1-line-height: 1.1;
  --font-h1-weight: 700;
  --font-h1-letter-spacing: -0.02em;

  --font-body-size: 1rem;
  --font-body-line-height: 1.6;
  --font-body-weight: 400;
}
```
</details>

<details>
<summary><b>Tailwind config</b></summary>

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        body: ['1rem', { lineHeight: '1.6' }],
      },
    },
  },
};
```
</details>

<details>
<summary><b>Responsive clamp()</b></summary>

```css
:root {
  --font-h1-size: clamp(2.5rem, 1.875rem + 1.964vw, 3.5rem);
  --font-body-size: clamp(0.75rem, 0.625rem + 0.357vw, 1rem);
}
```
</details>

## Tech stack

- **[WXT](https://wxt.dev)** — Manifest V3 framework for Chrome / Firefox / Edge extensions.
- **React 19** + **TypeScript 5.9** — UI layer with strict typing.
- **Tailwind CSS 3.4** — utility-first styling with CSS-variable theme tokens (light + dark).
- **Framer Motion 11** — animations, including direct-to-DOM motion values for the 1:1 cursor follow.
- **Radix UI** (Tabs, Tooltip, Slider, Switch, Popover, ScrollArea, ToggleGroup, Separator) — accessible, headless primitives in the shadcn pattern.
- **Lucide React** — icon set.
- **Vitest** + **happy-dom** — unit tests (parse, scale detection, readability, exporters).
- **Playwright** — end-to-end tests against the packed extension.

## Develop

```bash
# Install
npm install

# Dev server with HMR (launches your configured Chromium browser)
npm run dev
npm run dev:firefox

# Tests
npm test              # unit tests with Vitest
npm run test:watch
npm run test:e2e      # Playwright; requires `npm run build` first

# Type-check
npm run compile

# Build for production
npm run build         # outputs to .output/chrome-mv3
npm run zip           # zipped distributable

# Regenerate toolbar icons
npm run gen:icons
```

### Project structure

```
onylogy-font-checker/
  entrypoints/
    background.ts                # service worker + shortcut command handler
    content.ts                   # message dispatcher + overlay host
    popup/                       # React popup UI
      App.tsx
      tabs/                      # Inspect, Hierarchy, A11y, Export
      components/
        ui/                      # Radix-wrapped shadcn-style primitives
        motion/                  # reusable Framer Motion building blocks
      hooks/                     # useInspectMode, useTheme
  src/
    content/
      typography-inspector.ts    # hover/click stream + Esc handling
      hierarchy-extractor.ts     # DOM walk → role aggregation → scale detection
      font-source-detector.ts    # FontFaceSet + @font-face scan
      accessibility-analyzer.ts  # readability + contrast checks
      overlay/                   # Shadow DOM overlay with motion values
    shared/
      types.ts, messaging.ts, storage.ts, clipboard.ts
      typography/                # parse, scale, readability, contrast, convert
      exporters/                 # CSS, Tailwind, SCSS, JSON, Kadence, clamp
  tests/
    typography.test.ts           # unit tests
    e2e/                         # Playwright fixture + spec
  scripts/
    gen-icons.mjs                # generates the toolbar PNG icon set
```

## Permissions

Onylogy Font Checker requests the absolute minimum permissions Chrome allows:

- **`activeTab`** — read the currently focused tab's DOM when you invoke the extension. No background tab access.
- **`scripting`** — inject the inspector into pages where the extension was installed after the tab was opened.
- **`storage`** — persist your preferences (theme, default unit, recent fonts) in `chrome.storage.local`. Nothing leaves your browser.

No host permissions, no analytics, no network calls. Open-source under the MIT license — read the code for yourself.

## Roadmap

Planned for upcoming releases:

- Multi-page hierarchy comparison (run a scan across several URLs).
- Variable font axis preview slider in pinned cards.
- Live font override mode (test alternate families on any site).
- Firefox + Edge distributables in the Chrome Web Store and AMO.
- Export to Style Dictionary, Theo, and CSS-in-JS token formats.
- WordPress plugin companion for two-way sync with Kadence.

## FAQ

### What is a font checker?

A font checker is a browser tool that identifies the typefaces in use on a web page and exposes their full CSS properties — family, weight, size, line height, letter spacing, color, and source. Onylogy Font Checker is a free Chrome extension that does this with hover, click-to-pin, hierarchy detection, and exportable tokens.

### How do I identify a font on a website?

Install Onylogy Font Checker, click the toolbar icon, and hover any text on the page. The exact font family will appear in a small card next to your cursor. Click to pin a full data card showing weight, size, line height, letter spacing, and color.

### Is Onylogy Font Checker free?

Yes. The extension is free and open source under the MIT license. No accounts, no premium tier, no telemetry.

### Does it work with WordPress and Kadence?

Yes — and it was specifically designed with WordPress workflows in mind. The Export tab includes a Kadence Global Typography format alongside CSS variables, Tailwind, SCSS, JSON, and responsive `clamp()`.

### Does it detect Google Fonts, Adobe Fonts, and variable fonts?

Yes. The hierarchy scan combines the browser's `document.fonts` FontFaceSet API with a stylesheet `@font-face` scan to classify every family as Google, Adobe, self-hosted, system, or unknown. Variable fonts are detected and their available axes (weight, width, etc.) are surfaced.

### Can I export the typography system to my codebase?

Yes. The Export tab generates ready-to-paste tokens in six formats: CSS variables, Tailwind config, SCSS variables, design-token JSON, WordPress Kadence Global Typography, and responsive `clamp()` for fluid type scales.

### How is this different from WhatFont?

WhatFont identifies the font family for the element you click. Onylogy Font Checker also: detects the full hierarchy (H1–H6 + body + button + link + caption), exports the system to six developer formats, runs WCAG readability checks, detects variable font axes, and anchors pinned cards to the document so they scroll with the page.

### What Chrome permissions does it use?

Only `activeTab`, `scripting`, and `storage`. No host permissions, no analytics, no network calls. Source is on GitHub.

### Does it work in dark mode?

Yes. Both the popup chrome and the on-page overlay support light and dark modes (light is the default), with AA-compliant contrast verified for every text token in both themes.

### Will it slow down my browser?

The extension is dormant until you click the toolbar icon or press the shortcut. While inspect mode is on, hover and scroll listeners are `passive: true` and use Framer Motion `motionValue` to bypass React's render cycle for cursor following — so the on-page performance impact is negligible.

### Does it support Firefox or Edge?

The build is Manifest V3 and works on Chromium-based browsers (Chrome, Edge, Brave, Vivaldi, Arc, Opera). A Firefox build is on the roadmap.

## Changelog

### 0.2.0

- Light/dark theme toggle (light default), brand color `#004BD1`, Bricolage Grotesque + Montserrat fonts.
- Pin-on-click cards with document-anchored positioning that scrolls with the page.
- Compact hover tooltip (family only) + full data card on pin.
- Frosted-glass overlay with `backdrop-filter` blur.
- Browser-wide keyboard shortcut (`Alt+Shift+F`) to toggle inspect.
- Auto-arm inspect on popup open.
- Escape clears inspect and pinned cards.
- AA contrast verified across all tokens in both themes.
- Transparent brand-blue "Aa" toolbar icon.
- Auto-inject content script via `chrome.scripting.executeScript` so existing tabs work after install.
- Inspect mode persists across popup close.

### 0.1.0

- Initial release: live inspector, hierarchy detection, font source attribution, accessibility analysis, six-format export, popup UI.

## License

[MIT](LICENSE) — free to use, fork, modify, and distribute.

## Author

Built with care by **Ehasanul Haque** under the **Onylogy Studio** banner.

- GitHub — [github.com/ehasan28](https://github.com/ehasan28)
- Issues & feature requests — [open one here](https://github.com/ehasan28/onylogy-font-checker/issues)

If this tool saves you time, the kindest thing you can do is **star the repo** and share it with another designer or developer.

---

<sub>Onylogy Font Checker · A free typography inspector Chrome extension by Onylogy Studio · Created by Ehasanul Haque. Identify fonts, inspect CSS typography, detect Google Fonts and Adobe Fonts, run WCAG readability checks, and export design tokens for CSS variables, Tailwind, SCSS, JSON, Kadence, and responsive clamp().</sub>
