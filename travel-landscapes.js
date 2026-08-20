const LANDSCAPES = [
  { id: 'himalaya', label: 'Himalaya' },
  { id: 'city', label: 'Métropole' },
  { id: 'amazonia', label: 'Amazonie' },
  { id: 'caribbean', label: 'Caraïbes' }
];

const LANDSCAPE_WIDTHS = [960, 1440, 1672];
const generatedUrl = (id, width, extension) => `assets/generated/landscape-${id}-${width}.${extension}`;

function pictureMarkup(item, index) {
  const srcset = extension => LANDSCAPE_WIDTHS.map(width => `${generatedUrl(item.id, width, extension)} ${width}w`).join(', ');
  return `<picture class="journey-landscape" data-landscape-index="${index}" aria-hidden="true">
    <source type="image/avif" srcset="${srcset('avif')}">
    <source type="image/webp" srcset="${srcset('webp')}">
    <img src="${generatedUrl(item.id, 960, 'png')}" srcset="${srcset('png')}" sizes="100vw" width="1672" height="941" alt="" decoding="async">
  </picture>`;
}

async function assetAvailable() {
  try {
    const response = await fetch(generatedUrl('city', 960, 'webp'), { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

function setupJourneyBackground() {
  if (document.querySelector('.journey-background')) return;

  const background = document.createElement('div');
  background.className = 'journey-background';
  background.setAttribute('aria-hidden', 'true');
  background.innerHTML = LANDSCAPES.map(pictureMarkup).join('');
  document.body.prepend(background);

  const slides = [...background.querySelectorAll('.journey-landscape')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const scrollHeight = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
    const progress = Math.min(Math.max(scrollY / scrollHeight, 0), 1);
    const position = progress * (LANDSCAPES.length - 1);

    slides.forEach((slide, index) => {
      const distance = Math.abs(index - position);
      const visibility = Math.max(0, 1 - distance);
      const opacity = 0.06 + visibility * 0.42;
      const scale = 1.015 - visibility * 0.025;
      slide.style.setProperty('--landscape-opacity', String(opacity));
      slide.style.setProperty('--landscape-scale', String(scale));
    });
  };
  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate, { passive: true });
  update();
}

async function installTravelLandscapes() {
  if (await assetAvailable()) setupJourneyBackground();
}

installTravelLandscapes();