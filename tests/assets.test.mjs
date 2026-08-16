import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const stems = [
  'bathroom-01', 'bathroom-02', 'bathroom-03', 'bathroom-04', 'bathroom-05',
  'kitchen-01', 'kitchen-02', 'kitchen-03',
  'kids-01', 'kids-02', 'kids-03',
  'upholstered-01', 'upholstered-02',
  'storage-01', 'storage-02', 'storage-03', 'storage-04', 'storage-05', 'storage-06',
];

test('provides AVIF and WebP for the logo and every selected project', async () => {
  const files = [
    'logo.avif',
    'logo.webp',
    ...stems.flatMap((stem) => [`projects/${stem}.avif`, `projects/${stem}.webp`]),
  ];
  await Promise.all(files.map((file) => access(new URL(`../assets/${file}`, import.meta.url))));
});

test('removes phone chrome from project captures', async () => {
  const metadata = await sharp(fileURLToPath(new URL('../assets/projects/bathroom-01.avif', import.meta.url))).metadata();
  assert.equal(metadata.format, 'heif');
  assert.equal(metadata.width, 591);
  assert.equal(metadata.height, 1052);
});

test('exports a square optimized site avatar', async () => {
  const metadata = await sharp(fileURLToPath(new URL('../assets/logo.avif', import.meta.url))).metadata();
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 512);
});
