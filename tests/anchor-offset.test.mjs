import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

test('anchor offset compensates for the fixed header exactly once', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const dom = new JSDOM(`<style>${css}</style><section class="section" id="target"></section>`);
  const rootStyle = dom.window.getComputedStyle(dom.window.document.documentElement);
  const sectionStyle = dom.window.getComputedStyle(dom.window.document.querySelector('#target'));

  assert.equal(rootStyle.scrollPaddingTop, 'var(--header-height)');
  assert.notEqual(sectionStyle.scrollMarginTop, 'var(--header-height)');
});
