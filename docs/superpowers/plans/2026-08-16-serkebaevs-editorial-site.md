# Serkebaev's Studio Editorial Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, responsive, Russian-language static portfolio and conversion site for Serkebaev's Studio using only supplied facts, project photos, and review text.

**Architecture:** Serve a semantic single-page `index.html` with a standalone design system in `styles.css` and progressively enhanced interaction controllers in `script.js`. Preprocess the supplied JPEG screenshots into local AVIF/WebP assets with a small Sharp build script; verify content, local resources, image formats, and DOM behavior with Node's built-in test runner plus JSDOM.

**Tech Stack:** HTML5, CSS3, vanilla ES modules, Node.js 22+, `node:test`, JSDOM, Sharp.

**Spec:** `docs/superpowers/specs/2026-08-16-serkebaevs-editorial-site-design.md`

## Global Constraints

- The site language is Russian and all public copy must come from the supplied brief or review screenshots.
- The approved visual direction is «классический editorial premium»: black/graphite, warm white, muted gray, and a restrained sand accent.
- The site contains exactly five top-level sections: hero, about, projects, reviews, and contacts/footer.
- Every order CTA uses the exact supplied WhatsApp URL.
- Do not invent prices, guarantees, timings, social profile URLs, services, awards, or claims.
- Do not publish or add hosting configuration.
- Do not use external scripts, UI libraries, trackers, cookies, storage, forms, or server code.
- Project JPEG sources remain unchanged; generated presentation assets use AVIF first and WebP fallback.
- Desktop sections target roughly 1–1.5 viewport heights; mobile sections use natural content height.
- Interactions must remain keyboard accessible and respect `prefers-reduced-motion`.

---

## File Map

- `package.json` — local build/test commands and development dependencies.
- `package-lock.json` — reproducible dependency versions.
- `scripts/optimize-images.mjs` — deterministic crop and AVIF/WebP conversion pipeline.
- `assets/logo.avif`, `assets/logo.webp` — optimized site avatar/logo.
- `assets/projects/*.{avif,webp}` — cropped project photography grouped by descriptive filenames.
- `index.html` — all semantic content, navigation, gallery metadata, review slides, and contact information.
- `styles.css` — tokens, editorial layout, responsive behavior, accessible states, and motion preferences.
- `script.js` — menu, filters, lightbox, reviews, and back-to-top controllers.
- `tests/assets.test.mjs` — validates generated image inventory, dimensions, and formats.
- `tests/site-content.test.mjs` — validates structure, sourced copy, CTA URLs, security attributes, and resources.
- `tests/interactions.test.mjs` — exercises UI controllers in JSDOM.

---

### Task 1: Establish the local test harness

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `tests/site-content.test.mjs`

**Interfaces:**

- Consumes: Node.js 22+ installed on the workstation.
- Produces: `npm test`, `npm run build:assets`, and a reusable JSDOM site loader.

- [ ] **Step 1: Create the package manifest**

```json
{
  "name": "serkebaevs-studio-site",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build:assets": "node scripts/optimize-images.mjs",
    "test": "node --test",
    "check": "node --check script.js && node --test"
  },
  "devDependencies": {
    "jsdom": "^26.1.0",
    "sharp": "^0.34.3"
  }
}
```

- [ ] **Step 2: Install and lock dependencies**

Run: `npm install`

Expected: exit 0 and a new `package-lock.json` with no production runtime dependencies loaded by the page.

- [ ] **Step 3: Write the first failing content test**

```js
// tests/site-content.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

export async function loadSite() {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  return new JSDOM(html, { url: 'https://serkebaevs.local/' });
}

test('renders the five required top-level sections', async () => {
  const { window } = await loadSite();
  const ids = [...window.document.querySelectorAll('main > section, body > footer')]
    .map((node) => node.id);
  assert.deepEqual(ids, ['home', 'about', 'projects', 'reviews', 'contacts']);
});
```

- [ ] **Step 4: Run the test and confirm RED**

Run: `npm test -- tests/site-content.test.mjs`

Expected: FAIL with `ENOENT` for `index.html`; this proves the test is checking the missing page.

- [ ] **Step 5: Commit the harness**

```powershell
git add -- package.json package-lock.json tests/site-content.test.mjs
git commit -m "test: add static site harness"
```

---

### Task 2: Crop and optimize supplied imagery

**Files:**

- Create: `tests/assets.test.mjs`
- Create: `scripts/optimize-images.mjs`
- Create: `assets/logo.avif`
- Create: `assets/logo.webp`
- Create: `assets/projects/*.avif`
- Create: `assets/projects/*.webp`

**Interfaces:**

- Consumes: `images/main-logo.jpg`, `images/serkebaev-img-1.jpg` through `images/serkebaev-img-20.jpg`; Sharp.
- Produces: `logo.avif`, `logo.webp`, and 19 named project asset pairs with stable filenames used by `index.html`.

- [ ] **Step 1: Write the failing asset inventory test**

```js
// tests/assets.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import sharp from 'sharp';

const stems = [
  'bathroom-01', 'bathroom-02', 'bathroom-03', 'bathroom-04', 'bathroom-05',
  'kitchen-01', 'kitchen-02', 'kitchen-03',
  'kids-01', 'kids-02', 'kids-03',
  'upholstered-01', 'upholstered-02',
  'storage-01', 'storage-02', 'storage-03', 'storage-04', 'storage-05', 'storage-06'
];

test('provides AVIF and WebP for the logo and every selected project', async () => {
  const files = ['logo.avif', 'logo.webp', ...stems.flatMap((stem) => [
    `projects/${stem}.avif`, `projects/${stem}.webp`
  ])];
  await Promise.all(files.map((file) => access(new URL(`../assets/${file}`, import.meta.url))));
});

test('removes phone chrome from project captures', async () => {
  const metadata = await sharp(new URL('../assets/projects/bathroom-01.avif', import.meta.url)).metadata();
  assert.equal(metadata.format, 'heif');
  assert.equal(metadata.width, 591);
  assert.equal(metadata.height, 1052);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm test -- tests/assets.test.mjs`

Expected: FAIL with a missing `assets/logo.avif` or project file.

- [ ] **Step 3: Implement the deterministic optimizer**

```js
// scripts/optimize-images.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const source = new URL('../images/', import.meta.url);
const output = new URL('../assets/', import.meta.url);
const projectOutput = new URL('./projects/', output);

const projects = [
  ['serkebaev-img-1.jpg', 'bathroom-01'], ['serkebaev-img-2.jpg', 'bathroom-02'],
  ['serkebaev-img-3.jpg', 'bathroom-03'], ['serkebaev-img-4.jpg', 'bathroom-04'],
  ['serkebaev-img-5.jpg', 'bathroom-05'], ['serkebaev-img-6.jpg', 'kitchen-01'],
  ['serkebaev-img-8.jpg', 'kitchen-02'], ['serkebaev-img-9.jpg', 'kitchen-03'],
  ['serkebaev-img-10.jpg', 'kids-01'], ['serkebaev-img-11.jpg', 'kids-02'],
  ['serkebaev-img-13.jpg', 'kids-03'], ['serkebaev-img-14.jpg', 'upholstered-01'],
  ['serkebaev-img-15.jpg', 'upholstered-02'], ['serkebaev-img-12.jpg', 'storage-01'],
  ['serkebaev-img-16.jpg', 'storage-02'], ['serkebaev-img-17.jpg', 'storage-03'],
  ['serkebaev-img-18.jpg', 'storage-04'], ['serkebaev-img-19.jpg', 'storage-05'],
  ['serkebaev-img-20.jpg', 'storage-06']
];

await mkdir(projectOutput, { recursive: true });

async function encode(image, stem, directory) {
  await Promise.all([
    image.clone().avif({ quality: 80, effort: 6 }).toFile(new URL(`./${stem}.avif`, directory)),
    image.clone().webp({ quality: 88, smartSubsample: true }).toFile(new URL(`./${stem}.webp`, directory))
  ]);
}

await encode(
  sharp(new URL('./main-logo.jpg', source)).extract({ left: 16, top: 0, width: 1048, height: 1048 }).resize(512, 512),
  'logo', output
);

await Promise.all(projects.map(([filename, stem]) => encode(
  sharp(new URL(`./${filename}`, source)).extract({ left: 0, top: 109, width: 591, height: 1052 }),
  stem, projectOutput
)));
```

- [ ] **Step 4: Generate the assets and confirm GREEN**

Run: `npm run build:assets`

Expected: exit 0 and 40 files below `assets/`.

Run: `npm test -- tests/assets.test.mjs`

Expected: 2 tests pass.

- [ ] **Step 5: Commit the asset pipeline and generated assets**

```powershell
git add -- scripts/optimize-images.mjs tests/assets.test.mjs assets
git commit -m "feat: optimize supplied project imagery"
```

---

### Task 3: Build the semantic page and sourced content

**Files:**

- Modify: `tests/site-content.test.mjs`
- Create: `index.html`

**Interfaces:**

- Consumes: the stable asset filenames from Task 2 and exact content rules from the spec.
- Produces: DOM hooks `[data-menu-toggle]`, `[data-nav]`, `[data-filter]`, `[data-project]`, `[data-lightbox]`, `[data-review-track]`, and `[data-back-to-top]` for Tasks 4–5.

- [ ] **Step 1: Expand the failing page contract tests**

```js
const whatsapp = 'https://api.whatsapp.com/send/?phone=77077773618&text&type=phone_number&app_absent=0&wame_ctl=1&fbclid=PAT01DUATuqmdwZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp9sHR155g5neoKwtgaJE7EEgtjcXNy9ih5oTOPR2C66Fhi7OVMN79eHCEylS_aem_fo8ID266KlKwsY4toH-87w';

test('uses only the supplied WhatsApp destination for every order CTA', async () => {
  const { window } = await loadSite();
  const links = [...window.document.querySelectorAll('[data-whatsapp]')];
  assert.ok(links.length >= 3);
  assert.ok(links.every((link) => link.href === whatsapp));
});

test('contains sourced portfolio categories and six text reviews', async () => {
  const { window } = await loadSite();
  const filters = [...window.document.querySelectorAll('[data-filter]')].map((el) => el.textContent.trim());
  assert.deepEqual(filters, ['Все', 'Шкафы', 'Мягкая мебель', 'Детская мебель', 'Санузлы', 'Кухни']);
  assert.equal(window.document.querySelectorAll('[data-review]').length, 6);
  assert.equal(window.document.querySelectorAll('[data-project]').length, 19);
});

test('does not contain invented price claims or external executable resources', async () => {
  const { window } = await loadSite();
  assert.doesNotMatch(window.document.body.textContent, /₸|тенге|цена\s+от/i);
  assert.equal(window.document.querySelectorAll('script[src^="http"]').length, 0);
  assert.equal(window.document.querySelectorAll('link[rel="stylesheet"][href^="http"]').length, 0);
});

test('all local src and href resources exist and external new-tab links are isolated', async () => {
  const { access } = await import('node:fs/promises');
  const { window } = await loadSite();
  const nodes = [...window.document.querySelectorAll('[src], [href], source[srcset]')];
  for (const node of nodes) {
    const value = node.getAttribute('src') ?? node.getAttribute('href') ?? node.getAttribute('srcset');
    if (!value || value.startsWith('#') || value.startsWith('http')) continue;
    await access(new URL(`../${value}`, import.meta.url));
  }
  for (const link of window.document.querySelectorAll('a[target="_blank"]')) {
    const rel = new Set(link.rel.split(/\s+/));
    assert.ok(rel.has('noopener') && rel.has('noreferrer'));
  }
});
```

- [ ] **Step 2: Run the content suite and confirm RED**

Run: `npm test -- tests/site-content.test.mjs`

Expected: the original section test and the new CTA/category/review tests fail because `index.html` does not exist.

- [ ] **Step 3: Create the semantic HTML**

Create `index.html` with this document shell:

```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Serkebaev's Studio — мебель и интерьерные решения по индивидуальным проектам в Алматы.">
  <meta name="theme-color" content="#080808">
  <link rel="icon" type="image/avif" href="assets/logo.avif">
  <link rel="stylesheet" href="styles.css">
  <script type="module" src="script.js"></script>
  <title>Serkebaev's Studio — мебель и интерьер в Алматы</title>
</head>
<body>
  <a class="skip-link" href="#home">К содержанию</a>
  <header class="site-header" data-header>
    <a class="brand" href="#home" aria-label="Serkebaev's Studio — на главную">
      <picture><source srcset="assets/logo.avif" type="image/avif"><img src="assets/logo.webp" width="48" height="48" alt=""></picture>
      <span>Serkebaev's Studio</span>
    </a>
    <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav"><span class="sr-only">Открыть меню</span></button>
    <nav id="site-nav" data-nav aria-label="Основная навигация">
      <a href="#home">Главная</a><a href="#about">О компании</a><a href="#projects">Проекты</a><a href="#reviews">Отзывы</a><a href="#contacts">Контакты</a>
    </nav>
  </header>
  <main>
    <section id="home" aria-labelledby="home-title"></section>
    <section id="about" aria-labelledby="about-title"></section>
    <section id="projects" aria-labelledby="projects-title"></section>
    <section id="reviews" aria-labelledby="reviews-title"></section>
  </main>
  <footer id="contacts" aria-labelledby="contacts-title"></footer>
  <div class="lightbox" data-lightbox hidden role="dialog" aria-modal="true" aria-labelledby="lightbox-title"><button type="button" data-lightbox-close>Закрыть</button><h2 id="lightbox-title"></h2><picture data-lightbox-picture></picture></div>
  <button class="back-to-top" data-back-to-top type="button" aria-label="Вернуться наверх" hidden>↑</button>
</body>
</html>
```

Populate the five empty landmarks using this exact copy contract:

| Section | Required public copy |
|---|---|
| Hero | `Алматы · рейтинг 4.9`, `Мебель и интерьер по индивидуальному проекту`, `Корпусная, мягкая и кухонная мебель на заказ — для вашего пространства и по вашему проекту.`, `Заказать`, `Смотреть проекты` |
| About | `О компании`, `Serkebaev's Studio специализируется на корпусной и мягкой мебели, мебели для кухни и дизайне интерьеров. Компания изготавливает мебель на заказ по индивидуальным проектам, а также предлагает готовую мебель в наличии.`, `Индивидуальные проекты`, `Готовая мебель`, `Несколько направлений`, `Ежедневно 09:00–18:00`, `Клиенты отмечают качество изделий, скорость изготовления и профессионализм сотрудников.` |
| Projects | `Готовые проекты`, `Реальные работы Serkebaev's Studio.` and filters `Все`, `Шкафы`, `Мягкая мебель`, `Детская мебель`, `Санузлы`, `Кухни` |
| Reviews | `Отзывы клиентов`, `О работе Serkebaev's Studio — словами клиентов.`, `Назад`, `Вперёд` |
| Contacts | `Контакты`, `Алматы, Шевченко 204 к5`, `ТД «Саламат 5», 3 этаж, салоны 20–21`, `Ежедневно с 09:00 до 18:00`, `+7 707 777 36 18`, `Instagram: serkebaevs_studio`, `Facebook: SerkebaevS.studio`, `Заказать в WhatsApp` |

Use this exact gallery inventory:

| Asset stem | `data-category` | Visible title | Alt text |
|---|---|---|---|
| `bathroom-01` | `bathroom` | Мебель для санузла 01 | Тумба с рифлёными фасадами и зеркалом в светлом санузле |
| `bathroom-02` | `bathroom` | Мебель для санузла 02 | Светлая тумба с раковиной в компактном санузле |
| `bathroom-03` | `bathroom` | Мебель для санузла 03 | Белые навесные шкафы в санузле с зелёной стеной |
| `bathroom-04` | `bathroom` | Мебель для санузла 04 | Белая тумба под раковину и зеркало в золотистой раме |
| `bathroom-05` | `bathroom` | Мебель для санузла 05 | Тумба с двумя накладными раковинами и большим зеркалом |
| `kitchen-01` | `kitchen` | Кухня 01 | Светлая кухня с островом и фасадами двух оттенков |
| `kitchen-02` | `kitchen` | Кухня 02 | Кухня в стиле лофт с графитовыми и деревянными фасадами |
| `kitchen-03` | `kitchen` | Кухня 03 | Компактная кухня с белыми верхними и серыми нижними фасадами |
| `kids-01` | `kids` | Детская мебель 01 | Белый шкаф с круглой мягкой нишей для отдыха |
| `kids-02` | `kids` | Детская мебель 02 | Рабочая зона у окна со стеллажами в детской комнате |
| `kids-03` | `kids` | Детская мебель 03 | Детская кровать с ящиками и компактным рабочим столом |
| `upholstered-01` | `upholstered` | Мягкая мебель 01 | Модульный круглый пуф с каретной стяжкой |
| `upholstered-02` | `upholstered` | Мягкая мебель 02 | Мягкая голубая кровать с высоким изголовьем |
| `storage-01` | `storage` | Система хранения 01 | Комод и высокий шкаф с рифлёными фасадами в спальне |
| `storage-02` | `storage` | Система хранения 02 | Встроенные шкафы с белыми и синими фасадами в прихожей |
| `storage-03` | `storage` | Система хранения 03 | Книжный шкаф с открытыми деревянными полками |
| `storage-04` | `storage` | Система хранения 04 | Шкаф и мягкая скамья у стены с деревянными рейками |
| `storage-05` | `storage` | Система хранения 05 | Белый распашной шкаф с открытой центральной секцией |
| `storage-06` | `storage` | Система хранения 06 | Встроенный шкаф во всю стену с длинными чёрными ручками |

Use these six review records verbatim apart from typographic punctuation:

| Name | Review |
|---|---|
| Гульмира Мак | Благодарю компанию за проект, который мне сделали! Действительно быстро и качественно выполнена работа. Как сделают ремонт, буду заказывать мебель у вас. |
| Gulzhana Tankakova | Зашла в студию, чтобы рассчитали стоимость мебели, которую хочу заказать. Познакомилась с приятным менеджером Айнур, которая отработала со мной от и до. Кстати, есть готовая мебель для тех, кто не хочет ждать исполнения заказа. |
| Талгат Арыстанов | Заказывал шкаф, кровать и стол для детской, шкаф и кровать для спальни. Особых замечаний и нареканий нет, всё выполнили и собрали в срок. Рекомендую. |
| Gulnara M | Ребята — молодцы. Чуткие, оперативные, качество держат! |
| Zhan Luck | Работал с этой компанией, самые приемлемые цены за дизайн. Специалисты — мастера своего дела, буду рекомендовать только вас. |
| Gulbar K. | Заказала две консоли, очень довольна, спасибо за заказ, отлично вписались в наш интерьер. |

Every order link uses the exact WhatsApp URL from the test and `target="_blank" rel="noopener noreferrer" data-whatsapp`. The later user-approved social links use `https://www.instagram.com/serkebaevs_studio/` and `https://www.facebook.com/SerkebaevS.studio/`. Each project uses `<picture>` with AVIF source, WebP fallback, `width="591"`, `height="1052"`, `loading="lazy"`, `decoding="async"`, and a button carrying `data-project`, `data-category`, `data-title`, `data-alt`, `data-full-avif`, and `data-full-webp`. The hero uses `storage-06`, sets `fetchpriority="high"`, and omits lazy loading.

- [ ] **Step 4: Run the page contract and confirm GREEN**

Run: `npm test -- tests/site-content.test.mjs`

Expected: all content tests pass.

- [ ] **Step 5: Commit the semantic page**

```powershell
git add -- index.html tests/site-content.test.mjs
git commit -m "feat: add sourced studio page content"
```

---

### Task 4: Apply the approved editorial visual system

**Files:**

- Modify: `tests/site-content.test.mjs`
- Create: `styles.css`

**Interfaces:**

- Consumes: semantic classes and data hooks from Task 3.
- Produces: responsive desktop/mobile presentation, visible focus states, menu/lightbox/review states, and reduced-motion behavior without changing DOM semantics.

- [ ] **Step 1: Add a failing CSS contract test**

```js
test('ships responsive and reduced-motion design locally', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*767px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /--color-bg:\s*#080808/);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm test -- tests/site-content.test.mjs`

Expected: FAIL with `ENOENT` for `styles.css`.

- [ ] **Step 3: Implement the editorial design system**

Build `styles.css` around these exact tokens and layout rules:

```css
:root {
  --color-bg: #080808;
  --color-surface: #111111;
  --color-raised: #171717;
  --color-text: #f2efe9;
  --color-muted: #a9a49b;
  --color-line: rgba(242, 239, 233, .16);
  --color-accent: #c6aa82;
  --font-display: Georgia, 'Times New Roman', serif;
  --font-ui: Inter, 'Segoe UI', Arial, sans-serif;
  --header-height: 76px;
  --container: min(1180px, calc(100% - 48px));
  --radius: 2px;
}
html { scroll-behavior: smooth; scroll-padding-top: var(--header-height); }
body { margin: 0; background: var(--color-bg); color: var(--color-text); font-family: var(--font-ui); }
section, footer { scroll-margin-top: var(--header-height); }
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; }
.section-number { writing-mode: vertical-rl; color: var(--color-accent); letter-spacing: .16em; }
.projects-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.project-card:nth-child(6n + 1), .project-card:nth-child(6n + 4) { grid-column: span 7; }
.project-card { grid-column: span 5; }
.project-card[hidden], .review[hidden], .lightbox[hidden] { display: none !important; }
@media (max-width: 767px) {
  :root { --container: min(100% - 32px, 640px); --header-height: 68px; }
  [data-nav] { position: fixed; inset: var(--header-height) 0 auto; transform: translateY(-120%); }
  [data-nav].is-open { transform: translateY(0); }
  .projects-grid { grid-template-columns: 1fr; }
  .project-card, .project-card:nth-child(n) { grid-column: 1; }
  .section-number { writing-mode: horizontal-tb; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

Complete the stylesheet with a sticky translucent header, compact logo, split hero, restrained 44px-minimum controls, 1–1.5 viewport desktop section rhythm, editorial image crops, filter pills, readable review cards, modal overlay, footer grid, and a fixed circular back-to-top control. Ensure `body.menu-open` prevents background scroll and print styles expose content without overlays.

- [ ] **Step 4: Run the CSS contract and confirm GREEN**

Run: `npm test -- tests/site-content.test.mjs`

Expected: all content/CSS tests pass.

- [ ] **Step 5: Commit styling**

```powershell
git add -- styles.css tests/site-content.test.mjs
git commit -m "feat: style editorial studio experience"
```

---

### Task 5: Add progressive enhancement controllers

**Files:**

- Create: `tests/interactions.test.mjs`
- Create: `script.js`

**Interfaces:**

- Consumes: Task 3 DOM hooks and Task 4 state classes.
- Produces: named exports `initMobileMenu(document, window)`, `initGalleryFilters(document)`, `initLightbox(document)`, `initReviews(document)`, `initBackToTop(document, window)`, and `initSite(document, window)`.

- [ ] **Step 1: Write failing behavior tests**

```js
// tests/interactions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initMobileMenu, initGalleryFilters, initReviews } from '../script.js';

test('mobile menu toggles and closes after choosing an anchor', () => {
  const dom = new JSDOM('<button data-menu-toggle aria-expanded="false"></button><nav data-nav><a href="#about">О компании</a></nav>');
  const { document } = dom.window;
  initMobileMenu(document, dom.window);
  document.querySelector('button').click();
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'true');
  document.querySelector('a').click();
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'false');
});

test('gallery filters expose only matching project cards', () => {
  const dom = new JSDOM('<button data-filter="storage"></button><article data-project data-category="storage"></article><article data-project data-category="kitchen"></article>');
  const { document } = dom.window;
  initGalleryFilters(document);
  document.querySelector('button').click();
  assert.equal(document.querySelector('[data-category="storage"]').hidden, false);
  assert.equal(document.querySelector('[data-category="kitchen"]').hidden, true);
});

test('review controls move one slide at a time and wrap', () => {
  const dom = new JSDOM('<div data-review-region><article data-review></article><article data-review hidden></article><button data-review-next></button><button data-review-prev></button><span data-review-status></span></div>');
  const { document } = dom.window;
  initReviews(document);
  document.querySelector('[data-review-next]').click();
  assert.equal(document.querySelectorAll('[data-review]')[1].hidden, false);
  document.querySelector('[data-review-next]').click();
  assert.equal(document.querySelectorAll('[data-review]')[0].hidden, false);
});
```

- [ ] **Step 2: Run the interaction tests and confirm RED**

Run: `npm test -- tests/interactions.test.mjs`

Expected: FAIL because `script.js` or its exports do not exist.

- [ ] **Step 3: Implement the controllers**

```js
// script.js
export function initMobileMenu(document, window) {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;
  const close = () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open'); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { close(); toggle.focus(); } });
  window.matchMedia('(min-width: 768px)').addEventListener?.('change', (event) => { if (event.matches) close(); });
}

export function initGalleryFilters(document) {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const projects = [...document.querySelectorAll('[data-project]')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    projects.forEach((project) => { project.hidden = category !== 'all' && project.dataset.category !== category; });
  }));
}

export function initReviews(document) {
  const region = document.querySelector('[data-review-region]');
  if (!region) return;
  const slides = [...region.querySelectorAll('[data-review]')];
  const status = region.querySelector('[data-review-status]');
  let index = 0;
  let startX = 0;
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    if (status) status.textContent = `${index + 1} / ${slides.length}`;
  };
  region.querySelector('[data-review-next]')?.addEventListener('click', () => show(index + 1));
  region.querySelector('[data-review-prev]')?.addEventListener('click', () => show(index - 1));
  region.addEventListener('keydown', (event) => { if (event.key === 'ArrowRight') show(index + 1); if (event.key === 'ArrowLeft') show(index - 1); });
  region.addEventListener('pointerdown', (event) => { startX = event.clientX; });
  region.addEventListener('pointerup', (event) => { const delta = event.clientX - startX; if (Math.abs(delta) > 48) show(index + (delta < 0 ? 1 : -1)); });
  show(0);
}
```

In the same file implement:

```js
export function initLightbox(document) {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog) return;
  let trigger = null;
  const close = () => { dialog.hidden = true; document.body.classList.remove('lightbox-open'); trigger?.focus(); };
  document.querySelectorAll('[data-project]').forEach((button) => button.addEventListener('click', () => {
    trigger = button;
    dialog.querySelector('#lightbox-title').textContent = button.dataset.title;
    const picture = dialog.querySelector('[data-lightbox-picture]');
    const source = document.createElement('source');
    const image = document.createElement('img');
    source.srcset = button.dataset.fullAvif;
    source.type = 'image/avif';
    image.src = button.dataset.fullWebp;
    image.alt = button.dataset.alt;
    image.width = 591;
    image.height = 1052;
    picture.replaceChildren(source, image);
    dialog.hidden = false;
    document.body.classList.add('lightbox-open');
    dialog.querySelector('[data-lightbox-close]').focus();
  }));
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', close);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !dialog.hidden) close(); });
}

export function initBackToTop(document, window) {
  const button = document.querySelector('[data-back-to-top]');
  if (!button) return;
  const update = () => { button.hidden = window.scrollY < window.innerHeight * .75; };
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  update();
}

export function initSite(document, window) {
  initMobileMenu(document, window);
  initGalleryFilters(document);
  initLightbox(document);
  initReviews(document);
  initBackToTop(document, window);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') initSite(document, window);
```

All lightbox nodes are created through DOM properties, and all data attributes are developer-authored; no HTML string injection is used.

- [ ] **Step 4: Run the interaction suite and confirm GREEN**

Run: `npm test -- tests/interactions.test.mjs`

Expected: 3 tests pass.

Run: `npm test`

Expected: all asset, content, and interaction tests pass with 0 failures.

- [ ] **Step 5: Commit interactions**

```powershell
git add -- script.js tests/interactions.test.mjs
git commit -m "feat: add accessible site interactions"
```

---

### Task 6: Verify behavior and responsive presentation

**Files:**

- Modify: `index.html` only if verification exposes a specific defect.
- Modify: `styles.css` only if verification exposes a specific defect.
- Modify: `script.js` only after adding a failing regression test for a behavior defect.

**Interfaces:**

- Consumes: complete site from Tasks 1–5.
- Produces: fresh automated and visual evidence that the local static site meets the approved spec.

- [ ] **Step 1: Run the complete automated verification**

Run: `npm run check`

Expected: JavaScript syntax check exits 0 and every Node test passes with 0 failures.

- [ ] **Step 2: Serve and visually inspect the site**

Run: `python -m http.server 4173`

Inspect `http://127.0.0.1:4173/` at 360×800, 768×1024, 1024×768, and 1440×900. At each width verify:

- no horizontal overflow or clipped text;
- header and section offsets are correct;
- mobile menu opens, closes after an anchor click, and returns focus on Escape;
- project filters work and all image crops exclude phone chrome;
- lightbox opens/closes by button, backdrop, and Escape;
- reviews move by controls, keyboard, and swipe;
- back-to-top appears after the first screen and reaches the hero;
- all three WhatsApp CTAs point to the supplied URL;
- the final section contains the exact address, hours, and social handles;
- focus indicators remain visible and reduced-motion mode removes animated movement.

- [ ] **Step 3: For each defect, add a focused failing regression test before changing behavior**

For example, if Escape fails to close the lightbox, add:

```js
test('Escape closes the lightbox and restores project focus', () => {
  const dom = new JSDOM('<button data-project data-title="Проект" data-alt="Проект" data-full-avif="a.avif" data-full-webp="a.webp"></button><div data-lightbox hidden><button data-lightbox-close></button><h2 id="lightbox-title"></h2><picture data-lightbox-picture></picture></div>');
  const { document } = dom.window;
  initLightbox(document);
  const project = document.querySelector('[data-project]');
  project.click();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(document.querySelector('[data-lightbox]').hidden, true);
  assert.equal(document.activeElement, project);
});
```

Run: `npm test -- tests/interactions.test.mjs`

Expected: FAIL for the observed defect before changing `script.js`, then PASS after the smallest correction.

- [ ] **Step 4: Re-run verification after any visual correction**

Run: `npm run check`

Expected: all checks pass with 0 failures after the final edit.

- [ ] **Step 5: Commit the verified result**

```powershell
git add -- index.html styles.css script.js tests/site-content.test.mjs
git commit -m "test: verify responsive static site"
```
