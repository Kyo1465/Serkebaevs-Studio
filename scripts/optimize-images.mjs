import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = new URL('../images/', import.meta.url);
const output = new URL('../assets/', import.meta.url);
const projectOutput = new URL('./projects/', output);

const projects = [
  ['serkebaev-img-1.jpg', 'bathroom-01'],
  ['serkebaev-img-2.jpg', 'bathroom-02'],
  ['serkebaev-img-3.jpg', 'bathroom-03'],
  ['serkebaev-img-4.jpg', 'bathroom-04'],
  ['serkebaev-img-5.jpg', 'bathroom-05'],
  ['serkebaev-img-6.jpg', 'kitchen-01'],
  ['serkebaev-img-8.jpg', 'kitchen-02'],
  ['serkebaev-img-9.jpg', 'kitchen-03'],
  ['serkebaev-img-10.jpg', 'kids-01'],
  ['serkebaev-img-11.jpg', 'kids-02'],
  ['serkebaev-img-13.jpg', 'kids-03'],
  ['serkebaev-img-14.jpg', 'upholstered-01'],
  ['serkebaev-img-15.jpg', 'upholstered-02'],
  ['serkebaev-img-12.jpg', 'storage-01'],
  ['serkebaev-img-16.jpg', 'storage-02'],
  ['serkebaev-img-17.jpg', 'storage-03'],
  ['serkebaev-img-18.jpg', 'storage-04'],
  ['serkebaev-img-19.jpg', 'storage-05'],
  ['serkebaev-img-20.jpg', 'storage-06'],
];

await mkdir(projectOutput, { recursive: true });

async function encode(image, stem, directory) {
  await Promise.all([
    image.clone().avif({ quality: 80, effort: 6 }).toFile(fileURLToPath(new URL(`./${stem}.avif`, directory))),
    image.clone().webp({ quality: 88, smartSubsample: true }).toFile(fileURLToPath(new URL(`./${stem}.webp`, directory))),
  ]);
}

await encode(
  sharp(fileURLToPath(new URL('./main-logo.jpg', source)))
    .extract({ left: 16, top: 0, width: 1048, height: 1048 })
    .resize(512, 512),
  'logo',
  output,
);

await Promise.all(projects.map(([filename, stem]) => encode(
  sharp(fileURLToPath(new URL(`./${filename}`, source)))
    .extract({ left: 0, top: 109, width: 591, height: 1052 }),
  stem,
  projectOutput,
)));
