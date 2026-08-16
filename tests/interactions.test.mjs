import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  initMobileMenu,
  initGalleryFilters,
  initLightbox,
  initReviews,
  initBackToTop,
} from '../script.js';

function makeDom(markup) {
  const dom = new JSDOM(markup, { url: 'https://serkebaevs.local/' });
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
  return dom;
}

test('mobile menu toggles and closes after choosing an anchor', () => {
  const dom = makeDom('<button data-menu-toggle aria-expanded="false"></button><nav data-nav><a href="#about">О компании</a></nav>');
  const { document } = dom.window;
  initMobileMenu(document, dom.window);

  document.querySelector('button').click();
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'true');
  assert.equal(document.querySelector('nav').classList.contains('is-open'), true);

  document.querySelector('a').click();
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'false');
  assert.equal(document.querySelector('nav').classList.contains('is-open'), false);
});

test('Escape closes the mobile menu and restores toggle focus', () => {
  const dom = makeDom('<button data-menu-toggle aria-expanded="false"></button><nav data-nav></nav>');
  const { document } = dom.window;
  initMobileMenu(document, dom.window);
  document.querySelector('button').click();
  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(document.querySelector('button').getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, document.querySelector('button'));
});

test('gallery filters expose only matching project cards', () => {
  const dom = makeDom('<button data-filter="storage" aria-pressed="false"></button><button data-filter="all" aria-pressed="true"></button><article data-project data-category="storage"></article><article data-project data-category="kitchen"></article>');
  const { document } = dom.window;
  initGalleryFilters(document);
  document.querySelector('[data-filter="storage"]').click();
  assert.equal(document.querySelector('[data-category="storage"]').hidden, false);
  assert.equal(document.querySelector('[data-category="kitchen"]').hidden, true);
  assert.equal(document.querySelector('[data-filter="storage"]').getAttribute('aria-pressed'), 'true');
});

test('review controls move one slide at a time and wrap', () => {
  const dom = makeDom('<div data-review-region tabindex="0"><article data-review></article><article data-review></article><button data-review-next></button><button data-review-prev></button><span data-review-status></span></div>');
  const { document } = dom.window;
  initReviews(document);
  document.querySelector('[data-review-next]').click();
  assert.equal(document.querySelectorAll('[data-review]')[1].hidden, false);
  assert.equal(document.querySelector('[data-review-status]').textContent, '2 / 2');
  document.querySelector('[data-review-next]').click();
  assert.equal(document.querySelectorAll('[data-review]')[0].hidden, false);
});

test('review region responds to arrow keys', () => {
  const dom = makeDom('<div data-review-region><article data-review></article><article data-review></article><button data-review-next></button><button data-review-prev></button><span data-review-status></span></div>');
  const { document } = dom.window;
  initReviews(document);
  document.querySelector('[data-review-region]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(document.querySelectorAll('[data-review]')[1].hidden, false);
});

test('lightbox opens a project and Escape closes it with focus restored', () => {
  const dom = makeDom('<button data-project data-title="Проект" data-alt="Проект" data-full-avif="a.avif" data-full-webp="a.webp"></button><div data-lightbox hidden><div><button data-lightbox-close></button><h2 id="lightbox-title"></h2><picture data-lightbox-picture></picture></div></div>');
  const { document } = dom.window;
  initLightbox(document);
  const project = document.querySelector('[data-project]');
  project.click();
  assert.equal(document.querySelector('[data-lightbox]').hidden, false);
  assert.equal(document.querySelector('[data-lightbox-picture] img').src, 'https://serkebaevs.local/a.webp');

  document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(document.querySelector('[data-lightbox]').hidden, true);
  assert.equal(document.activeElement, project);
});

test('back-to-top visibility follows the viewport and click scrolls to the top', () => {
  const dom = makeDom('<button data-back-to-top hidden></button>');
  const { document } = dom.window;
  Object.defineProperty(dom.window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(dom.window, 'scrollY', { configurable: true, value: 900 });
  let scrollOptions;
  dom.window.scrollTo = (options) => { scrollOptions = options; };
  initBackToTop(document, dom.window);
  assert.equal(document.querySelector('[data-back-to-top]').hidden, false);
  document.querySelector('[data-back-to-top]').click();
  assert.deepEqual(scrollOptions, { top: 0, behavior: 'smooth' });
});
