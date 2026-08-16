import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const whatsapp = 'https://api.whatsapp.com/send/?phone=77077773618&text&type=phone_number&app_absent=0&wame_ctl=1&fbclid=PAT01DUATuqmdwZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp9sHR155g5neoKwtgaJE7EEgtjcXNy9ih5oTOPR2C66Fhi7OVMN79eHCEylS_aem_fo8ID266KlKwsY4toH-87w';

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

test('uses only the supplied WhatsApp destination for every order CTA', async () => {
  const { window } = await loadSite();
  const links = [...window.document.querySelectorAll('[data-whatsapp]')];
  assert.ok(links.length >= 3);
  assert.ok(links.every((link) => link.href === whatsapp));
});

test('contains sourced portfolio categories and six text reviews', async () => {
  const { window } = await loadSite();
  const filters = [...window.document.querySelectorAll('[data-filter]')].map((element) => element.textContent.trim());
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
