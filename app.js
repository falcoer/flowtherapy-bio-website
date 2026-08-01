const iconSvg = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a3 3 0 0 0-2.1-2.1C17 5.6 12 5.6 12 5.6s-5 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.5 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.9.5 6.9.5 6.9.5s5 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>'
};

function externalLink(url, label, className = '') {
  return `<a class="${className}" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderSocials(socials) {
  return socials.map(({ label, url, icon }) => `
    <a class="social-card" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}">
      <span class="social-icon">${iconSvg[icon] ?? ''}</span>
      <span>${label}</span>
      <span class="arrow" aria-hidden="true">↗</span>
    </a>`).join('');
}

function renderPress(items) {
  return items.map(({ title, source, url }) => `
    <article class="press-card">
      <p class="press-source">${source}</p>
      <h3>${title}</h3>
      ${externalLink(url, 'Consulter', 'text-link')}
    </article>`).join('');
}

function renderPage(config) {
  const { site, hero, socials, about, press } = config;
  document.title = `${site.name} — ${site.tagline}`;

  document.querySelector('#app').innerHTML = `
    <header class="hero">
      <div class="brand-row">
        <img class="brand-logo" src="assets/logo.svg" alt="${site.name}">
        <button id="qr-open" class="qr-trigger" type="button" aria-label="Afficher le QR code de partage" title="Partager par QR code">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm11 0h2v2h-2zm3 0h2v5h-2zm-3 4h2v2h-2zm-3-4h2v2h-2zm0 4h2v2h-2z" fill="currentColor"/></svg>
        </button>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">${hero.eyebrow}</p>
        <h1>${hero.title}</h1>
        <p class="hero-subtitle">${hero.subtitle}</p>
        <p class="tagline">${site.tagline}</p>
      </div>
      <div class="social-grid">${renderSocials(socials)}</div>
    </header>

    <section class="content-section about-section">
      <p class="section-kicker">${site.location}</p>
      <h2>${about.title}</h2>
      <div class="prose">${about.paragraphs.map(paragraph => `<p>${paragraph}</p>`).join('')}</div>
    </section>

    <section class="content-section">
      <p class="section-kicker">Actualités et reconnaissance</p>
      <h2>${press.title}</h2>
      <div class="press-grid">${renderPress(press.items)}</div>
    </section>

    <footer>
      <img src="assets/logo.svg" alt="" class="footer-logo">
      <p>${site.copyright}</p>
    </footer>`;

  setupQr(site.url);
}

function setupQr(url) {
  const dialog = document.querySelector('#qr-dialog');
  const openButton = document.querySelector('#qr-open');
  const closeButton = document.querySelector('#qr-close');
  const target = document.querySelector('#qr-code');
  document.querySelector('#qr-url').textContent = url;

  let generated = false;
  const generateQr = () => {
    if (generated || typeof QRCode === 'undefined') return;
    target.innerHTML = '';
    new QRCode(target, {
      text: url,
      width: 280,
      height: 280,
      colorDark: '#11131a',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    generated = true;
  };

  openButton.addEventListener('click', () => {
    generateQr();
    dialog.showModal();
    requestAnimationFrame(() => dialog.classList.add('is-open'));
  });

  const close = () => {
    dialog.classList.remove('is-open');
    setTimeout(() => dialog.close(), 220);
  };

  closeButton.addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    close();
  });
}

async function init() {
  try {
    const response = await fetch('config/site.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Configuration inaccessible (${response.status})`);
    renderPage(await response.json());
  } catch (error) {
    console.error(error);
    document.querySelector('#app').innerHTML = '<p class="error">Le contenu du site ne peut pas être chargé pour le moment.</p>';
  }
}

init();
