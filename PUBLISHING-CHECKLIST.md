# Chrome Web Store — Publishing Checklist

End-to-end checklist for submitting **Onylogy Font Checker v0.2.0** to
the Chrome Web Store. Work top-to-bottom; everything is paste-ready.

> **One-time fee reminder:** Chrome charges a US$5 developer registration
> fee. Pay it at <https://chrome.google.com/webstore/devconsole/> if you
> haven't yet.

---

## A. Files you already have

| File | Where | Use for |
|---|---|---|
| `onylogy-font-checker-0.2.0-chrome.zip` | `.output/` | The "Upload new package" field on the Dashboard. **265 KB**. |
| `STORE-LISTING.md` | repo root | All copy: name, summary, description, justifications. |
| `PRIVACY.md` | repo root | Privacy policy. Push to GitHub, then link the raw URL on the Dashboard. |
| `LICENSE` | repo root | MIT license. |
| `README.md` | repo root | SEO-optimized GitHub README. |
| `public/icon/128.png` | repo root | Already inside the ZIP. Also used standalone for some legacy fields. |

---

## B. Assets you still need to create

Chrome Web Store accepts JPG or 24-bit PNG (no alpha for promo / marquee).
All dimensions are **fixed** — anything off-size is rejected.

### 1. Screenshots — REQUIRED, 1 to 5 images

- **Dimension:** 1280 × 800 px **or** 640 × 400 px (pick one and stay
  consistent across all five)
- **Format:** PNG (recommended) or JPG
- **Color space:** sRGB
- **Order matters** — the first screenshot is the "hero" and shows up in
  search results.

**Recommended shot list** (5 screenshots, in this order):

| # | What it shows | Caption idea (Chrome allows none, but plan the framing) |
|---|---|---|
| 1 | Inspect tab in the popup, hovering a heading on a real WordPress page, with the floating "Bricolage Grotesque" tooltip visible on the page | "Identify any font with one hover" |
| 2 | Multiple pinned cards on a real page, one per heading/body/button, with the page content visible behind the frosted-glass cards | "Pin every typographic role at once" |
| 3 | Hierarchy tab showing the extracted scale, the modular ratio name + confidence, and the list of fonts with source badges (Google / Self-hosted) | "Scan the whole type system" |
| 4 | Accessibility tab showing the animated score donut + a few example issues (body-too-small, line-height-too-tight) | "Catch readability gaps before you ship" |
| 5 | Export tab showing the Tailwind output with the format toggle highlighted and the Copy button | "Export to Tailwind, CSS, SCSS, JSON, Kadence, clamp()" |

> **How to capture:** Open the extension on a real WordPress page (your
> own portfolio works great), use a tool like CleanShot X or
> screencapture (Cmd+Shift+4 on macOS), then crop to exactly 1280×800.

### 2. Small promo tile — RECOMMENDED, required for featured placement

- **Dimension:** 440 × 280 px
- **Format:** PNG or JPG, **no alpha channel** (solid background)
- **Content:** The "Aa" wordmark in brand blue on a clean background.
  Title text like "Onylogy Font Checker" is welcome but keep it minimal —
  Google may auto-shrink the tile.

### 3. Marquee promo image — OPTIONAL

- **Dimension:** 1400 × 560 px
- **Format:** PNG or JPG, no alpha
- **Use case:** Featured carousel on the Chrome Web Store home. Worth
  designing if you have time — without it, you won't be eligible for
  feature placement.

### 4. (Optional) Marketing assets you may want anyway

- 16 / 32 / 48 / 96 / 128 px icons — **already in the ZIP**, no action
  needed.

---

## C. Pre-flight checks on the ZIP

Before you upload, sanity-check the package once:

```bash
# Unzip into a scratch folder
unzip -l .output/onylogy-font-checker-0.2.0-chrome.zip

# Expected entries:
#   manifest.json
#   popup.html
#   background.js
#   content-scripts/content.js
#   chunks/popup-*.js
#   assets/popup-*.css
#   icon/16.png 32.png 48.png 96.png 128.png
```

Quick manual confirm in `chrome://extensions`:

1. Toggle **Developer mode** on.
2. Drag the `.zip` (or click **Load unpacked** on the `.output/chrome-mv3`
   folder).
3. Verify:
   - Icon shows as the blue "Aa" on transparent.
   - Popup opens and auto-arms inspect.
   - Hover on a page shows the floating card.
   - Click pins a card; cards scroll with the page.
   - Esc exits inspect and clears pins.
   - Alt+Shift+F toggles inspect from any tab (after assigning the
     shortcut at `chrome://extensions/shortcuts`).
4. Open DevTools on the popup → Console. Expect **no errors** on open.

---

## D. Dashboard walkthrough

Sign in at <https://chrome.google.com/webstore/devconsole/>.

### Step 1 — Create a new item

1. Click **New item** at top-right.
2. Drop in `.output/onylogy-font-checker-0.2.0-chrome.zip`.
3. Wait for the upload to finish (usually under 30 seconds).
4. The Dashboard parses the manifest and opens the item form.

### Step 2 — Store listing

Open the **Store listing** tab.

| Field | Value (see `STORE-LISTING.md` for exact text) |
|---|---|
| Description | Paste the long description from `STORE-LISTING.md` § Detailed description |
| Category | **Developer Tools** |
| Language | **English (United States)** |
| Screenshots | Upload your 1280×800 captures (1-5 images, in order) |
| Small promo tile | Upload 440×280 PNG |
| Marquee promo tile | Upload 1400×560 PNG (optional) |

### Step 3 — Privacy practices

Open the **Privacy practices** tab.

1. **Single purpose** — paste § Single purpose from `STORE-LISTING.md`.
2. **Permission justifications** — paste each per-permission paragraph
   into the matching field. The Dashboard surfaces one input per
   permission found in your manifest, so you'll see fields for
   `activeTab`, `scripting`, and `storage` plus a "Remote code" question.
3. **Data usage** — answer the disclosure questions as listed in
   `STORE-LISTING.md` § Data usage disclosure. Every category is **No**.
4. **Certifications** — tick all three.
5. **Privacy policy URL** — paste the raw GitHub URL to `PRIVACY.md`
   (push to GitHub first; example URL is in `STORE-LISTING.md`).

### Step 4 — Distribution

Open the **Distribution** tab.

| Field | Value |
|---|---|
| Visibility | **Public** (or **Unlisted** if you want a soft launch) |
| Pricing | Free |
| Geographic distribution | **All regions** |
| Account contact email | `ehasan.artificial@gmail.com` (or your support email) |

### Step 5 — Submit for review

1. Click **Save draft** on every tab — green check marks appear when each
   tab is complete.
2. Click **Submit for review** at the top of the page.
3. Confirm the dialog.

**Review time:** typically 1-3 business days for a new extension. You'll
get an email when it goes live or if anything needs changes.

---

## E. Common rejection reasons (and how this listing avoids them)

| Rejection reason | How we handled it |
|---|---|
| Description doesn't match functionality | Description describes only features that exist in v0.2.0. |
| Excessive permissions | Only `activeTab`, `scripting`, `storage` — all justified. |
| Missing privacy policy | `PRIVACY.md` ships in the repo. |
| Remote code execution | Extension loads zero remote JS. Google Fonts is a CSS-only `<link>`. |
| Misleading metadata / keyword stuffing | Keywords appear naturally inside coherent sentences, not lists. |
| Screenshots are mockups, not the actual UI | Use real captures from `chrome://extensions` after `npm run build`. |
| Single purpose is unclear | Single-purpose statement is one paragraph, explicit. |

---

## F. After it ships

1. Update the badge in `README.md` from "Coming soon" to the live Chrome
   Web Store URL.
2. Tweet / post the listing — early traction matters for search ranking
   on the Web Store.
3. Watch the Developer Dashboard's "User feedback" tab for reviews.
4. For each new release: bump version in `wxt.config.ts` AND `package.json`,
   regenerate the ZIP with `npm run zip`, upload as a **new version** on
   the same item (not a new item).

---

## G. Quick command reference

```bash
# Build a fresh ZIP
npm run build && npm run zip

# Output:
#   .output/chrome-mv3/                  unpacked extension (sideload here)
#   .output/onylogy-font-checker-X.Y.Z-chrome.zip   <-- upload this

# Re-generate the toolbar icons (if you change scripts/gen-icons.mjs)
npm run gen:icons

# Pre-submission smoke
npm run compile && npm test && npm run test:e2e
```

---

## H. Submission packet — at a glance

Drop the following links / files into your submission:

- [x] **ZIP package** — `.output/onylogy-font-checker-0.2.0-chrome.zip`
- [x] **5 screenshots** — 1280×800, in the order from § B-1
- [x] **Small promo tile** — 440×280, no alpha
- [ ] **Marquee** — 1400×560 (optional but recommended)
- [x] **Store description** — `STORE-LISTING.md` § Detailed description
- [x] **Single purpose** — `STORE-LISTING.md` § Single purpose
- [x] **Permission justifications** — `STORE-LISTING.md`
- [x] **Privacy policy URL** — raw GitHub URL to `PRIVACY.md`
- [x] **Support email** — `ehasan.artificial@gmail.com`
- [x] **Website / support URL** — `https://github.com/ehasan28`

Good luck with the launch.

— Onylogy Studio · Ehasanul Haque
