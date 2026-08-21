const LANDSCAPES = [
  { id: 'urban', label: 'Paysage urbain original' },
  { id: 'himalaya', label: 'Himalaya' },
  { id: 'city', label: 'Métropole' },
  { id: 'amazonia', label: 'Amazonie' },
  { id: 'caribbean', label: 'Caraïbes' }
];

const LANDSCAPE_WIDTHS = [960, 1440, 1672];
const generatedUrl = (id, width, extension) => `assets/generated/landscape-${id}-${width}.${extension}`;
const landscapeSrcset = (id, extension) => LANDSCAPE_WIDTHS.map(width => `${generatedUrl(id, width, extension)} ${width}w`).join(', ');

function pictureMarkup(item, index) {
  const priority = index === 0 ? 'high' : 'low';
  return `<picture class="journey-landscape" data-landscape-index="${index}" aria-hidden="true">
    <source type="image/avif" srcset="${landscapeSrcset(item.id, 'avif')}" sizes="100vw">
    <source type="image/webp" srcset="${landscapeSrcset(item.id, 'webp')}" sizes="100vw">
    <img src="${generatedUrl(item.id, 960, 'png')}" srcset="${landscapeSrcset(item.id, 'png')}" sizes="100vw" width="1672" height="941" alt="" loading="eager" fetchpriority="${priority}" decoding="async">
  </picture>`;
}

function setupJourneyBackground() {
  if (document.querySelector('.journey-background')) return;

  const background = document.createElement('div');
  background.className = 'journey-background';
  background.setAttribute('aria-hidden', 'true');
  document.body.prepend(background);
  document.documentElement.classList.add('journey-background-ready');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mounted = new Map();
  const preloaded = new Set([0, 1]);
  let previousPosition = 0;
  let ticking = false;

  const mount = index => {
    if (mounted.has(index)) return mounted.get(index);
    background.insertAdjacentHTML('beforeend', pictureMarkup(LANDSCAPES[index], index));
    const slide = background.querySelector(`[data-landscape-index="${index}"]`);
    mounted.set(index, slide);
    return slide;
  };

  const visiblePair = position => {
    const first = Math.min(Math.floor(position), LANDSCAPES.length - 2);
    return [Math.max(0, first), Math.max(1, first + 1)];
  };

  const replaceRenderedLandscapes = indexes => {
    const required = new Set(indexes);
    for (const [index, slide] of mounted) {
      if (!required.has(index)) {
        slide.remove();
        mounted.delete(index);
      }
    }
    indexes.forEach(mount);
  };

  const preload = index => {
    if (index < 0 || index >= LANDSCAPES.length || preloaded.has(index)) return;
    preloaded.add(index);
    const item = LANDSCAPES[index];
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/avif';
    link.href = generatedUrl(item.id, 960, 'avif');
    link.imageSrcset = landscapeSrcset(item.id, 'avif');
    link.imageSizes = '100vw';
    link.fetchPriority = 'low';
    link.addEventListener('load', () => link.remove(), { once: true });
    link.addEventListener('error', () => link.remove(), { once: true });
    document.head.append(link);
  };

  const positionFromScroll = () => {
    const scrollHeight = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const progress = Math.min(Math.max(scrollY / scrollHeight, 0), 1);
    return progress * (LANDSCAPES.length - 1);
  };

  const render = (position, preloadFollowing = false) => {
    const pair = visiblePair(position);
    replaceRenderedLandscapes(pair);

    for (const index of pair) {
      const slide = mounted.get(index);
      const distance = Math.abs(index - position);
      const visibility = Math.max(0, 1 - distance);
      const opacity = 0.02 + visibility * 0.56;
      const scale = 1.018 - visibility * 0.028;
      const shift = Math.max(-1, Math.min(1, index - position)) * 5;
      const tilt = Math.max(-1, Math.min(1, index - position)) * 0.8;
      slide.style.setProperty('--landscape-opacity', String(opacity));
      slide.style.setProperty('--landscape-scale', String(scale));
      slide.style.setProperty('--landscape-shift', `${shift}vw`);
      slide.style.setProperty('--landscape-tilt', `${tilt}deg`);
    }

    if (preloadFollowing) {
      const direction = position >= previousPosition ? 1 : -1;
      preload(direction > 0 ? pair[1] + 1 : pair[0] - 1);
    }
    previousPosition = position;
  };

  if (reducedMotion) {
    mount(0).style.setProperty('--landscape-opacity', '.22');
    return;
  }

  const requestUpdate = preloadFollowing => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      render(positionFromScroll(), preloadFollowing);
    });
  };

  addEventListener('scroll', () => requestUpdate(true), { passive: true });
  addEventListener('resize', () => requestUpdate(false), { passive: true });
  render(0);
}

setupJourneyBackground();
