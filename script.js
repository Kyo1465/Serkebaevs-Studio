export function initMobileMenu(document, window) {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const label = toggle.querySelector('.sr-only');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (label) label.textContent = open ? 'Закрыть меню' : 'Открыть меню';
  };

  const close = (restoreFocus = false) => {
    const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(false);
    if (restoreFocus && wasOpen) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close(true);
  });

  const desktop = window.matchMedia?.('(min-width: 768px)');
  desktop?.addEventListener?.('change', (event) => {
    if (event.matches) close();
  });
}

export function initGalleryFilters(document) {
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const projects = [...document.querySelectorAll('[data-project]')];
  const grid = document.querySelector('[data-projects-grid]');
  if (!buttons.length || !projects.length) return;

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.filter;
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      projects.forEach((project) => {
        project.hidden = category !== 'all' && project.dataset.category !== category;
      });
      if (grid) grid.scrollLeft = 0;
    });
  });
}

export function initLightbox(document) {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog) return;

  const closeButton = dialog.querySelector('[data-lightbox-close]');
  const picture = dialog.querySelector('[data-lightbox-picture]');
  const title = dialog.querySelector('#lightbox-title');
  let trigger = null;

  const close = () => {
    if (dialog.hidden) return;
    dialog.hidden = true;
    document.body.classList.remove('lightbox-open');
    picture?.replaceChildren();
    trigger?.focus();
  };

  document.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      trigger = button;
      if (title) title.textContent = button.dataset.title ?? 'Проект';

      const source = document.createElement('source');
      const image = document.createElement('img');
      source.srcset = button.dataset.fullAvif ?? '';
      source.type = 'image/avif';
      image.src = button.dataset.fullWebp ?? '';
      image.alt = button.dataset.alt ?? '';
      image.width = 591;
      image.height = 1052;
      picture?.replaceChildren(source, image);

      dialog.hidden = false;
      document.body.classList.add('lightbox-open');
      closeButton?.focus();
    });
  });

  closeButton?.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !dialog.hidden) close();
    if (event.key === 'Tab' && !dialog.hidden) {
      event.preventDefault();
      closeButton?.focus();
    }
  });
}

export function initReviews(document) {
  const region = document.querySelector('[data-review-region]');
  if (!region) return;

  const slides = [...region.querySelectorAll('[data-review]')];
  const status = region.querySelector('[data-review-status]');
  if (!slides.length) return;

  let index = 0;
  let startX = 0;

  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.hidden = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (status) status.textContent = `${index + 1} / ${slides.length}`;
  };

  region.querySelector('[data-review-next]')?.addEventListener('click', () => show(index + 1));
  region.querySelector('[data-review-prev]')?.addEventListener('click', () => show(index - 1));
  region.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    }
  });
  region.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
  });
  region.addEventListener('pointerup', (event) => {
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 48) show(index + (delta < 0 ? 1 : -1));
  });

  show(0);
}

export function initBackToTop(document, window) {
  const button = document.querySelector('[data-back-to-top]');
  if (!button) return;

  const update = () => {
    button.hidden = window.scrollY < window.innerHeight * 0.75;
  };

  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
  update();
}

export function initSite(document, window) {
  document.documentElement.classList.replace('no-js', 'js');
  initMobileMenu(document, window);
  initGalleryFilters(document);
  initLightbox(document);
  initReviews(document);
  initBackToTop(document, window);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  initSite(document, window);
}
