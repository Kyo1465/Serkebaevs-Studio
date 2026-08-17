# Dark Gallery Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current editorial visual system with the approved Dark Gallery design while preserving all content, sections, links, assets, and JavaScript behavior, with a substantially more compact mobile hero.

**Architecture:** Keep `index.html` and `script.js` structurally stable and replace the presentation layer in `styles.css`. Verify the design contract through JSDOM CSSOM tests for tokens and mobile invariants, retain all existing DOM/interaction tests, then perform local HTTP and responsive visual checks when a browser surface is available.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, Node.js, `node:test`, JSDOM.

**Spec:** `docs/superpowers/specs/2026-08-17-dark-gallery-redesign-design.md`

## Global Constraints

- Preserve all public Russian copy, five section IDs, project assets, reviews, contact data, WhatsApp URL, Instagram URL, and Facebook URL.
- Preserve mobile navigation, anchor offset, filters, lightbox, review controls/swipe/keyboard behavior, back-to-top, CSP, and safe external-link attributes.
- Use the approved Dark Gallery palette: `#090A0B`, `#111315`, `#171A1D`, `#F4F5F2`, `#9A9FA5`, and `#C7CDD3`.
- Use a system sans-serif type system; no editorial serif or italic headline treatment in primary headings.
- Keep page-level horizontal overflow disabled; only filters and the projects shelf may scroll horizontally.
- Mobile header height is exactly `60px`; mobile section padding is between `56px` and `72px`.
- Mobile hero starts no more than `28px` below the fixed header and uses an image no taller than `44svh`.
- Maintain minimum 44×44 px interactive targets and `prefers-reduced-motion` support.
- Do not add UI libraries, remote fonts, external scripts, analytics, forms, new sections, or publishing configuration.

---

## File Map

- `styles.css` — completely replaced Dark Gallery tokens, layout, components, and responsive rules.
- `tests/redesign-contract.test.mjs` — CSSOM-level tests for the new palette, sans-serif heading system, horizontal section labels, and compact mobile hero.
- `index.html` — unchanged unless a structural class is proven necessary; public text must remain byte-for-byte equivalent at the DOM text level.
- `script.js` — unchanged unless an existing behavior test fails after styling.

---

### Task 1: Establish the Dark Gallery foundation and compact hero

**Files:**

- Create: `tests/redesign-contract.test.mjs`
- Modify: `styles.css`

**Interfaces:**

- Consumes: existing DOM classes including `.site-header`, `.section`, `.section-rail`, `.hero`, `.hero-copy`, `.hero-media`, `.hero-actions`, `.button`, and `.text-link`.
- Produces: Dark Gallery color/type tokens, 68 px desktop header, 60 px mobile header, horizontal section labels, and compact desktop/mobile hero rules used by all later component styles.

- [ ] **Step 1: Write the failing Dark Gallery and mobile hero tests**

```js
// tests/redesign-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

async function loadStylesheet() {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const dom = new JSDOM(`<style>${css}</style><header class="site-header"></header><main><section class="section hero"><div class="section-rail"></div><h1>Заголовок</h1><figure class="hero-media"><picture><img></picture></figure></section></main>`);
  return { dom, sheet: dom.window.document.styleSheets[0] };
}

function findStyleRule(ruleList, selector, media = null) {
  for (const rule of ruleList) {
    if (rule.type === 4 && media && rule.conditionText === media) {
      const nested = findStyleRule(rule.cssRules, selector, null);
      if (nested) return nested;
    }
    if (!media && rule.type === 1 && rule.selectorText === selector) return rule;
  }
  return null;
}

test('uses the approved Dark Gallery palette and sans-serif headings', async () => {
  const { dom } = await loadStylesheet();
  const root = dom.window.getComputedStyle(dom.window.document.documentElement);
  const heading = dom.window.getComputedStyle(dom.window.document.querySelector('h1'));
  const headingFamily = root.getPropertyValue('--font-heading').trim();
  assert.equal(root.getPropertyValue('--color-bg').trim().toLowerCase(), '#090a0b');
  assert.equal(root.getPropertyValue('--color-surface').trim().toLowerCase(), '#111315');
  assert.equal(root.getPropertyValue('--color-accent').trim().toLowerCase(), '#c7cdd3');
  assert.match(headingFamily, /inter|helvetica neue|segoe ui|arial/i);
  assert.doesNotMatch(headingFamily, /bodoni|didot|times new roman|georgia/i);
  assert.equal(heading.fontStyle, 'normal');
});

test('renders section labels horizontally instead of as vertical rails', async () => {
  const { dom } = await loadStylesheet();
  const rail = dom.window.getComputedStyle(dom.window.document.querySelector('.section-rail'));
  assert.equal(rail.position, 'static');
  assert.equal(rail.flexDirection, 'row');
  assert.notEqual(rail.writingMode, 'vertical-rl');
});

test('defines a compact mobile header and hero contract', async () => {
  const { sheet } = await loadStylesheet();
  const media = '(max-width: 767px)';
  const root = findStyleRule(sheet.cssRules, ':root', media);
  const section = findStyleRule(sheet.cssRules, '.section, .projects', media);
  const hero = findStyleRule(sheet.cssRules, '.hero', media);
  const heroMedia = findStyleRule(sheet.cssRules, '.hero-media picture, .hero-media img', media);
  assert.equal(root.style.getPropertyValue('--header-height').trim(), '60px');
  assert.equal(section.style.padding.trim(), '64px 0');
  assert.equal(hero.style.paddingTop, 'calc(var(--header-height) + 24px)');
  assert.equal(hero.style.minHeight, 'calc(100svh - var(--header-height))');
  assert.equal(heroMedia.style.maxHeight, '44svh');
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm test -- tests/redesign-contract.test.mjs`

Expected: FAIL on the old `#080808` palette, serif heading family, vertical rail, 68 px mobile header, 82 px mobile section padding, and taller mobile hero.

- [ ] **Step 3: Replace the global foundation, header, controls, and hero styles**

Replace the top-level tokens and the global/header/hero blocks in `styles.css` with these exact foundation rules, expanding only selectors required by the existing markup:

```css
:root {
  --color-bg: #090a0b;
  --color-surface: #111315;
  --color-raised: #171a1d;
  --color-text: #f4f5f2;
  --color-muted: #9a9fa5;
  --color-dim: #6f747a;
  --color-line: rgba(244, 245, 242, 0.12);
  --color-line-strong: rgba(244, 245, 242, 0.22);
  --color-accent: #c7cdd3;
  --font-heading: Inter, "Helvetica Neue", "Segoe UI", Arial, sans-serif;
  --font-ui: Inter, "Helvetica Neue", "Segoe UI", Arial, sans-serif;
  --header-height: 68px;
  --container: min(1180px, calc(100vw - 64px));
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

.section {
  position: relative;
  width: var(--container);
  margin-inline: auto;
  padding: clamp(76px, 8vw, 112px) 0;
  border-bottom: 1px solid var(--color-line);
}

.section-rail {
  position: static;
  display: flex;
  width: 100%;
  height: auto;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 12px;
  border-right: 0;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-dim);
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.section-rail span:last-child {
  writing-mode: horizontal-tb;
  transform: none;
}

h1, h2 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-style: normal;
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

h1 em, h2 em {
  color: inherit;
  font-style: normal;
  font-weight: inherit;
}

.hero {
  display: grid;
  min-height: 100svh;
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  align-items: center;
  gap: clamp(42px, 6vw, 84px);
  padding-top: calc(var(--header-height) + 44px);
  padding-bottom: 44px;
}

.hero .section-rail {
  position: absolute;
  top: calc(var(--header-height) + 20px);
  left: 0;
  width: 100%;
  margin: 0;
}

.hero-media {
  width: min(100%, 480px);
  margin: 0 0 0 auto;
}

.hero-media::before { display: none; }
.hero-media picture { display: block; overflow: hidden; border-radius: var(--radius-lg); aspect-ratio: 4 / 5; }
.hero-media img { width: 100%; height: 100%; object-fit: cover; }
.hero-index { display: none; }

@media (max-width: 767px) {
  :root { --container: min(calc(100vw - 28px), 640px); --header-height: 60px; }
  .section, .projects { width: var(--container); padding: 64px 0; }
  .hero {
    display: flex;
    min-height: calc(100svh - var(--header-height));
    flex-direction: column;
    gap: 20px;
    padding-top: calc(var(--header-height) + 24px);
    padding-bottom: 24px;
  }
  .hero .section-rail { position: static; order: -3; margin-bottom: 0; }
  .hero-copy { order: -2; }
  .hero-media { order: -1; width: 100%; margin: 0; }
  .hero-media picture, .hero-media img { width: 100%; max-height: 44svh; aspect-ratio: 4 / 3; }
  h1 { font-size: clamp(2.15rem, 10.5vw, 2.75rem); }
  h2 { font-size: clamp(2rem, 9vw, 2.55rem); }
}
```

Use a 68 px translucent header, compact 36 px logo, pill-like nav hover states, 52 px desktop CTA, 48 px mobile CTA, no shifted hero frame, and no decorative background word. Keep the existing menu classes and state selectors required by `script.js`.

- [ ] **Step 4: Run the focused contract and existing anchor test**

Run: `npm test -- tests/redesign-contract.test.mjs tests/anchor-offset.test.mjs`

Expected: all Dark Gallery and anchor-offset tests pass.

- [ ] **Step 5: Commit the foundation and hero**

```powershell
git add -- styles.css tests/redesign-contract.test.mjs
git commit -m "style: establish dark gallery foundation"
```

---

### Task 2: Restyle about, projects, reviews, and contacts

**Files:**

- Modify: `styles.css`
- Modify: `tests/redesign-contract.test.mjs`

**Interfaces:**

- Consumes: Dark Gallery tokens and global primitives from Task 1 plus existing HTML classes for advantages, gallery, review carousel, contacts, lightbox, and back-to-top.
- Produces: unified card system, compact horizontal gallery, stable review panel, modern contact rows, and compact one-column mobile sections.

- [ ] **Step 1: Add failing component contract tests**

Append:

```js
test('uses one coherent rounded card system for primary components', async () => {
  const { sheet } = await loadStylesheet();
  const advantages = findStyleRule(sheet.cssRules, '.advantage');
  const project = findStyleRule(sheet.cssRules, '.project-card');
  const reviews = findStyleRule(sheet.cssRules, '.reviews-shell');
  assert.equal(advantages.style.borderRadius, 'var(--radius-md)');
  assert.equal(project.style.borderRadius, 'var(--radius-md)');
  assert.equal(reviews.style.borderRadius, 'var(--radius-lg)');
});

test('keeps gallery horizontal and social profile names unbroken on mobile', async () => {
  const { sheet } = await loadStylesheet();
  const grid = findStyleRule(sheet.cssRules, '.projects-grid');
  const social = findStyleRule(sheet.cssRules, '.contact-social-row strong');
  assert.equal(grid.style.gridAutoFlow, 'column');
  assert.match(grid.style.overflowX, /auto/);
  assert.equal(social.style.whiteSpace, 'nowrap');
});
```

- [ ] **Step 2: Run the component tests and confirm RED**

Run: `npm test -- tests/redesign-contract.test.mjs`

Expected: FAIL because old advantages are border-only cells, the project card has no shared radius, and the review shell does not use the new radius token.

- [ ] **Step 3: Implement the component system**

Use these exact component decisions:

```css
.advantages { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; border: 0; }
.advantage { min-height: 220px; padding: 24px; border: 1px solid var(--color-line); border-radius: var(--radius-md); background: var(--color-surface); }
.client-note { padding: 28px; border: 1px solid var(--color-line); border-radius: var(--radius-lg); background: var(--color-surface); }

.projects-grid { display: grid; grid-auto-columns: clamp(260px, 25vw, 344px); grid-auto-flow: column; gap: 14px; overflow-x: auto; scroll-snap-type: inline mandatory; }
.project-card { overflow: hidden; border: 1px solid var(--color-line); border-radius: var(--radius-md); background: var(--color-surface); }
.project-card picture { aspect-ratio: 4 / 5; }

.reviews-shell { overflow: hidden; border: 1px solid var(--color-line); border-radius: var(--radius-lg); background: var(--color-surface); }
.review { min-height: 360px; padding: clamp(28px, 5vw, 58px); }
.review blockquote { font-family: var(--font-heading); font-size: clamp(1.3rem, 2.4vw, 2rem); line-height: 1.35; }

.contacts { display: grid; min-height: auto; grid-template-columns: 1.05fr 0.95fr; gap: clamp(48px, 8vw, 96px); }
.contact-social-row strong { white-space: nowrap; }
.lightbox-panel { overflow: hidden; border-radius: var(--radius-lg); background: var(--color-surface); }
.back-to-top { border-radius: 14px; background: rgba(17, 19, 21, 0.9); }
```

At `max-width: 1023px`, use two advantage columns. At `max-width: 767px`, use one advantage column, 16 px card padding, 18 px about gaps, `min(82vw, 310px)` project columns, a review minimum height no greater than 360 px, contact gap 36 px, and no section-level vertical gap above the horizontal label. Preserve all `[hidden]`, `.is-open`, `.menu-open`, `.lightbox-open`, focus, print, and reduced-motion selectors.

- [ ] **Step 4: Run the full test suite**

Run: `npm run check`

Expected: JavaScript syntax succeeds and all existing plus redesign tests pass with 0 failures.

- [ ] **Step 5: Commit the remaining redesigned sections**

```powershell
git add -- styles.css tests/redesign-contract.test.mjs
git commit -m "style: modernize studio sections and cards"
```

---

### Task 3: Verify responsive density and regressions

**Files:**

- Modify: `styles.css` only for concrete visual defects.
- Modify: `tests/redesign-contract.test.mjs` before fixing any reproducible layout contract defect.
- Modify: `script.js` only after a failing interaction regression test demonstrates a behavior defect.

**Interfaces:**

- Consumes: complete Dark Gallery stylesheet and unchanged site behaviors.
- Produces: fresh automated, HTTP, and visual evidence for the redesigned site.

- [ ] **Step 1: Run complete automated verification**

Run: `npm run check`

Expected: all tests pass and `node --check script.js` exits 0.

- [ ] **Step 2: Start the local server**

Run: `npm run serve`

Expected: `Serkebaev's Studio: http://127.0.0.1:4173/`.

- [ ] **Step 3: Verify HTTP delivery**

Run:

```powershell
$page = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing
$css = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/styles.css' -UseBasicParsing
if ($page.StatusCode -ne 200 -or $css.StatusCode -ne 200) { throw 'Local site failed HTTP verification' }
```

Expected: HTML and CSS both return status 200 with local-only resources.

- [ ] **Step 4: Inspect responsive presentation when a browser surface is available**

Check 360×640, 390×844, 768×1024, 1024×768, and 1440×900. Verify:

- mobile header is 60 px and menu opens directly beneath it;
- at 360×640 there is no large blank area above the hero title;
- hero title, description, CTA controls, and at least the top portion of the image are visible within the first viewport;
- mobile hero image never exceeds 44% of the small viewport height;
- section labels are horizontal everywhere;
- advantages are cards rather than tall bordered columns;
- filters and projects scroll horizontally without page overflow;
- review cards do not jump excessively between slides;
- Instagram and Facebook remain platform/handle rows without word splitting;
- focus indicators, Escape behavior, swipe, anchor offsets, and back-to-top still work.

If the configured browser surface is unavailable, report that constraint and rely on the CSSOM contract, HTTP checks, and existing DOM/interaction tests; do not substitute unrelated browser automation.

- [ ] **Step 5: Add a regression test before correcting any defect**

For a mobile hero spacing defect, add a CSSOM assertion to `tests/redesign-contract.test.mjs` against the specific selector and declaration that caused it, run the focused test to observe RED, make the smallest CSS correction, and rerun until GREEN.

- [ ] **Step 6: Run fresh final verification**

Run: `npm run check`

Expected: 0 failures after the final styling correction.

- [ ] **Step 7: Commit verified corrections if any exist**

```powershell
git add -- styles.css tests/redesign-contract.test.mjs
git commit -m "test: verify dark gallery responsive layout"
```
