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
  return `<picture class="travel-landscape" data-landscape-index="${index}" aria-hidden="true">
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

function setupLandscapeWheel(watermark, home) {
  watermark.classList.add('travel-wheel-ready');
  watermark.innerHTML = `<div class="travel-wheel" aria-hidden="true">${LANDSCAPES.map(pictureMarkup).join('')}</div>`;
  const slides = [...watermark.querySelectorAll('.travel-landscape')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    slides.forEach((slide, index) => slide.style.setProperty('--landscape-angle', index === 0 ? '0deg' : '28deg'));
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = home.getBoundingClientRect();
    const scrollable = Math.max(home.offsetHeight - innerHeight, 1);
    const travelled = Math.min(Math.max(-rect.top, 0), scrollable);
    const progress = travelled / scrollable;
    const position = progress * (LANDSCAPES.length - 1);

    slides.forEach((slide, index) => {
      const delta = index - position;
      const angle = delta * 23;
      const distance = Math.abs(delta);
      const opacity = Math.max(0, 1 - distance * 0.9);
      const scale = Math.max(0.86, 1 - distance * 0.06);
      slide.style.setProperty('--landscape-angle', `${angle}deg`);
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
  const app = document.querySelector('#app');
  if (!app) return;

  const observer = new MutationObserver(async () => {
    const watermark = document.querySelector('.watermark');
    const home = document.querySelector('.home');
    if (!watermark || !home || watermark.dataset.travelLandscapeInit) return;
    watermark.dataset.travelLandscapeInit = 'true';
    observer.disconnect();

    if (await assetAvailable()) setupLandscapeWheel(watermark, home);
  });

  observer.observe(app, { childList: true, subtree: true });
}

installTravelLandscapes();
