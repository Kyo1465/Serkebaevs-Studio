import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

async function loadStylesheet() {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const dom = new JSDOM(`<style>${css}</style><header class="site-header"></header><main><section class="section test-section"><div class="section-rail"></div></section><section class="section hero"><div class="section-rail"></div><h1>Heading</h1><figure class="hero-media"><picture><img></picture></figure></section></main>`);
  return { dom, sheet: dom.window.document.styleSheets[0] };
}

function normalizeSelector(selector) {
  return selector.split(',').map((part) => part.trim()).join(', ');
}

function findStyleRule(ruleList, selector, media = null) {
  for (const rule of ruleList) {
    if (rule.type === 4 && media && rule.conditionText === media) {
      const nested = findStyleRule(rule.cssRules, selector, null);
      if (nested) return nested;
    }

    if (!media && rule.type === 1 && normalizeSelector(rule.selectorText) === normalizeSelector(selector)) return rule;
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
  const rail = dom.window.getComputedStyle(dom.window.document.querySelector('.test-section .section-rail'));

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

  assert.ok(root, 'mobile root rule must exist');
  assert.ok(section, 'mobile section rule must exist');
  assert.ok(hero, 'mobile hero rule must exist');
  assert.ok(heroMedia, 'mobile hero media rule must exist');
  assert.equal(root.style.getPropertyValue('--header-height').trim(), '60px');
  assert.equal(section.style.getPropertyValue('padding').trim(), '64px 0');
  assert.equal(hero.style.getPropertyValue('padding-top').trim(), 'calc(var(--header-height) + 24px)');
  assert.equal(hero.style.getPropertyValue('min-height').trim(), 'calc(100svh - var(--header-height))');
  assert.equal(heroMedia.style.getPropertyValue('max-height').trim(), '44svh');
});

test('uses one coherent rounded card system for primary components', async () => {
  const { sheet } = await loadStylesheet();
  const advantage = findStyleRule(sheet.cssRules, '.advantage');
  const project = findStyleRule(sheet.cssRules, '.project-card');
  const reviews = findStyleRule(sheet.cssRules, '.reviews-shell');

  assert.equal(advantage.style.getPropertyValue('border-radius').trim(), 'var(--radius-md)');
  assert.equal(project.style.getPropertyValue('border-radius').trim(), 'var(--radius-md)');
  assert.equal(reviews.style.getPropertyValue('border-radius').trim(), 'var(--radius-lg)');
});

test('keeps gallery compact and horizontal with unbroken social profile names', async () => {
  const { sheet } = await loadStylesheet();
  const grid = findStyleRule(sheet.cssRules, '.projects-grid');
  const mobileGrid = findStyleRule(sheet.cssRules, '.projects-grid', '(max-width: 767px)');
  const social = findStyleRule(sheet.cssRules, '.contact-social-row strong');

  assert.equal(grid.style.getPropertyValue('grid-auto-flow').trim(), 'column');
  assert.match(grid.style.getPropertyValue('overflow-x').trim(), /auto/);
  assert.equal(mobileGrid.style.getPropertyValue('grid-auto-columns').trim(), 'min(82vw, 310px)');
  assert.equal(social.style.getPropertyValue('white-space').trim(), 'nowrap');
});
