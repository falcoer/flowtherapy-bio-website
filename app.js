const ASSET='assets/';
const icons={
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle class="dot" cx="17.4" cy="6.7" r="1"></circle></svg>',
  youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0 2.8-.3 4.6-.7 5.6a3 3 0 0 1-1.7 1.7C18.6 19.7 16.8 20 12 20s-6.6-.3-7.6-.7a3 3 0 0 1-1.7-1.7C2.3 16.6 2 14.8 2 12s.3-4.6.7-5.6a3 3 0 0 1 1.7-1.7C5.4 4.3 7.2 4 12 4s6.6.3 7.6.7a3 3 0 0 1 1.7 1.7c.4 1 .7 2.8.7 5.6Z" fill="currentColor"></path><path d="m10 8 5 4-5 4V8Z" fill="#e21b18"></path></svg>',
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.2H8v3.1h2.6v8h3.2Z" fill="currentColor"></path></svg>',
  qr:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect class="dot" x="5" y="5" width="3" height="3"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect class="dot" x="16" y="5" width="3" height="3"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect class="dot" x="5" y="16" width="3" height="3"></rect><rect class="dot" x="14" y="14" width="2" height="2"></rect><rect class="dot" x="18" y="14" width="3" height="2"></rect><rect class="dot" x="14" y="18" width="3" height="3"></rect><rect class="dot" x="19" y="18" width="2" height="3"></rect></svg>',
  contact:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"></rect><path d="m4 7 8 6 8-6"></path></svg>'
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orientationClass=item=>item.orientation==='portrait'?'ratio-portrait':'ratio-landscape';
const responsivePicture=(name,widths,className,alt='')=>`<picture><source type="image/avif" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.avif ${width}w`).join(', ')}"><source type="image/webp" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.webp ${width}w`).join(', ')}"><img class="${className}" src="${ASSET}generated/${name}-${widths[0]}.png" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.png ${width}w`).join(', ')}" sizes="${className==='logo'?'(max-width: 790px) 200px, 240px':'(max-width: 790px) 52vw, 640px'}" width="${widths[0]}" height="${Math.round(widths[0]*2/3)}" alt="${esc(alt)}" decoding="async"></picture>`;

const responsiveMediaPicture=(item,viewer=false)=>{
  const widths=Array.isArray(item.widths)?item.widths.filter(Number.isFinite):[];
  if(!item.asset||!widths.length)return '';
  const name=esc(item.asset);
  const sizes=viewer?'min(92vw, 1280px)':'(max-width: 520px) calc(50vw - 12px), (max-width: 900px) calc(33vw - 18px), 25vw';
  const srcset=extension=>widths.map(width=>`${ASSET}media/${name}-${width}.${extension} ${width}w`).join(', ');
  const fallback=widths[widths.length-1];
  return `<picture><source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}"><img src="${ASSET}media/${name}-${fallback}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}" alt="${esc(item.title)}" ${viewer?'':'loading="lazy"'} decoding="async"></picture>`;
};

function mediaVisual(item,index,viewer=false){
  const ratio=orientationClass(item);
  const ratioStyle=/^\d+:\d+$/.test(String(item.ratio))?` style="--media-ratio:${item.ratio.replace(':','/')}"`:'';
  const content=item.asset
    ? responsiveMediaPicture(item,viewer)
    : item.src
      ? `<img src="${esc(item.src)}" alt="${esc(item.title)}" ${viewer?'':'loading="lazy"'} decoding="async">`
      : `<div class="media-placeholder tone-${index%3+1}" aria-hidden="true"></div>`;
  return `<div class="media-frame ${ratio}"${ratioStyle}>${content}</div>`;
}

function render(config){
  const {site,hero,navigation,socials,about,media}=config;
  const mediaItems=media?.items||[];
  const listen=socials.find(s=>s.icon==='youtube')?.url||socials[0]?.url||'#contact';
  document.title=`${site.name} — ${hero.lines.join(' ')}`;
  document.querySelector('#app').innerHTML=`
<header id="accueil" class="home">
  <nav class="nav" aria-label="Navigation principale"><a class="logo-link" href="#accueil" aria-label="Retour en haut de la page">${responsivePicture('logo-transparent',[320,480],'logo','Flow Therapy')}</a><div class="socials header-socials" aria-label="Réseaux sociaux">${socials.map(s=>`<a class="social ${s.icon}" href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icons[s.icon]||esc(s.label[0])}</a>`).join('')}<button id="qr-open" class="social qr-social" type="button" aria-label="Partager par QR code">${icons.qr}</button><a class="social contact-social" href="#contact" aria-label="Nous contacter" title="Nous contacter">${icons.contact}</a></div><div class="nav-side"><div class="links">${navigation.map(n=>`<a href="${n.href}">${esc(n.label)}</a>`).join('')}</div><div class="tools"><button id="theme" class="theme" type="button" aria-label="Activer le thème sombre" aria-pressed="false"><span aria-hidden="true">☀</span><span aria-hidden="true">☾</span></button></div></div></nav>
  <div class="doodle-field hero-doodles" aria-hidden="true"><span class="doodle doodle-paint tone-pink"></span><span class="doodle doodle-star tone-orange"></span><span class="doodle doodle-spark tone-blue"></span><span class="doodle doodle-heart tone-pink"></span><span class="doodle doodle-arrow tone-blue"></span><span class="doodle doodle-underline tone-purple"></span></div>
  <div class="hero-grid"><div class="copy"><h1>${hero.lines.map((l,i)=>`<span class="line l${i+1}">${esc(l)}</span>`).join('')}</h1><p>${esc(site.tagline)}</p><div class="actions"><a class="primary" href="${listen}" target="_blank" rel="noopener">▶ ÉCOUTER</a><a class="secondary" href="#medias">MÉDIAS</a></div></div>
  <div class="art" aria-label="Composition graphique Flow Therapy"><div class="watermark" aria-hidden="true"></div><div class="alpacas" aria-hidden="true">${[1,2,3].map(n=>`<div class="alpaca" data-alpaca="${n}">${responsivePicture(`alpaga${n}-nu`,[640,768,1024],'alpaca-nude')}</div>`).join('')}</div><div class="brush">${esc(hero.signature)}</div></div></div>
</header>
<section id="groupe" class="section"><div class="doodle-field section-doodles" aria-hidden="true"><span class="doodle doodle-paint tone-blue"></span><span class="doodle doodle-swoosh tone-pink"></span><span class="doodle doodle-star tone-purple"></span><span class="doodle doodle-heart tone-orange"></span></div><p class="kicker">${esc(site.location)}</p><h2>${esc(about.title)}</h2><div class="prose">${about.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div></section>
<section id="medias" class="section media-section" aria-label="Médias"><div class="media-grid">${mediaItems.map((item,index)=>`<button class="media-card ${orientationClass(item)}" type="button" data-media-index="${index}" aria-label="Ouvrir ${esc(item.title)} dans la galerie">${mediaVisual(item,index)}</button>`).join('')}</div></section>
<section id="contact" class="section contact-section" aria-labelledby="contact-title">
  <div class="contact-layout">
    <header class="contact-heading">
      <span class="contact-heading-icon" aria-hidden="true">✉</span>
      <div>
        <p>Une question, un projet&nbsp;?</p>
        <h2 id="contact-title">Nous contacter</h2>
        <p class="contact-intro">Concert, événement, presse ou collaboration&nbsp;: choisissez le sujet de votre demande et laissez-nous vos coordonnées.</p>
      </div>
    </header>
    <div class="contact-panel">
      <form id="contact-form" class="contact-form">
        <label for="contact-subject">Sujet</label>
        <select id="contact-subject" name="subject" required>
          <option value="">Choisir un sujet</option>
          <option>Concert / programmation</option>
          <option>Événement privé ou professionnel</option>
          <option>Presse / média</option>
          <option>Collaboration artistique</option>
          <option>Dossier de presse / fiche technique</option>
          <option>Autre demande</option>
        </select>
        <label for="contact-email">Adresse e-mail</label>
        <input id="contact-email" name="email" type="email" autocomplete="email" required placeholder="votre.nom@exemple.fr">
        <label for="contact-phone">Numéro de téléphone <span>(facultatif)</span></label>
        <input id="contact-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+33 6 00 00 00 00">
        <div class="contact-message-label"><label for="contact-message">Votre message</label><span><output id="contact-count">0</output>/255</span></div>
        <textarea id="contact-message" name="message" maxlength="255" rows="5" required placeholder="Décrivez votre demande…"></textarea>
        <button class="contact-submit" type="submit" disabled>Envoi bientôt disponible</button>
        <p class="contact-notice">Le formulaire est en préparation. L’envoi des messages sera activé prochainement.</p>
      </form>
    </div>
  </div>
</section>
<footer><span>${esc(site.copyright)}</span></footer>`;
  setupTheme();
  setupQr(site.url);
  setupContact();
  setupAlpacaReveal();
  setupMediaViewer(mediaItems);
}

function setupMediaViewer(items){
  const dialog=document.querySelector('#media-dialog');
  if(!dialog||!items.length)return;
  const cards=[...document.querySelectorAll('[data-media-index]')];
  const title=document.querySelector('#media-viewer-title');
  const counter=document.querySelector('#media-counter');
  const visual=document.querySelector('#media-visual');
  const meta=document.querySelector('#media-meta');
  const info=document.querySelector('#media-info');
  const closeButton=document.querySelector('#media-close');
  let current=0;
  let opener=null;

  const update=()=>{
    const item=items[current];
    title.textContent=item.title;
    counter.textContent=`${current+1} / ${items.length}`;
    visual.innerHTML=mediaVisual(item,current,true);
    document.querySelector('#media-type').textContent=item.type||'—';
    document.querySelector('#media-ratio').textContent=item.ratio||'—';
    document.querySelector('#media-date').textContent=item.date||'—';
    document.querySelector('#media-credit').textContent=item.credit||'—';
    document.querySelector('#media-description').textContent=item.description||'';
  };
  const move=delta=>{current=(current+delta+items.length)%items.length;update()};
  const close=()=>dialog.close();
  const open=(index,button)=>{
    current=index;
    opener=button;
    meta.hidden=true;
    info.setAttribute('aria-expanded','false');
    info.textContent='Infos';
    update();
    dialog.showModal();
    closeButton.focus();
  };

  cards.forEach(card=>card.addEventListener('click',()=>open(Number(card.dataset.mediaIndex),card)));
  document.querySelector('#media-prev').onclick=()=>move(-1);
  document.querySelector('#media-next').onclick=()=>move(1);
  closeButton.onclick=close;
  info.onclick=()=>{
    meta.hidden=!meta.hidden;
    const expanded=!meta.hidden;
    info.setAttribute('aria-expanded',String(expanded));
    info.textContent=expanded?'Masquer les infos':'Infos';
  };
  dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
  dialog.addEventListener('close',()=>opener?.focus());
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}
    if(event.key==='ArrowRight'){event.preventDefault();move(1)}
  });
}

const ALPACA_NUDE_HOLD_MS=1800;
const wait=duration=>new Promise(resolve=>window.setTimeout(resolve,duration));
const decodeImage=image=>typeof image.decode==='function'?image.decode().catch(()=>undefined):image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',resolve,{once:true})});
const mountCostumes=group=>{
  if(!group.dataset.costumesMounted){
    group.querySelectorAll('[data-alpaca]').forEach(alpaca=>alpaca.insertAdjacentHTML('beforeend',responsivePicture(`alpaga${alpaca.dataset.alpaca}`,[640,768,1024],'alpaca-costumed')));
    group.dataset.costumesMounted='true';
  }
  return Promise.all([...group.querySelectorAll('.alpaca-costumed')].map(decodeImage));
};
function setupAlpacaReveal(){
  const group=document.querySelector('.alpacas');
  if(!group)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){mountCostumes(group);group.classList.add('is-costumed');return}
  const reveal=async()=>{
    if(group.dataset.revealStarted)return;
    group.dataset.revealStarted='true';
    group.classList.add('is-nude-visible');
    await Promise.all([mountCostumes(group),wait(ALPACA_NUDE_HOLD_MS)]);
    group.classList.add('is-costumed');
  };
  if(!matchMedia('(max-width: 790px)').matches||!('IntersectionObserver' in window)){
    requestAnimationFrame(reveal);
    return;
  }
  const observer=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.35)){
      observer.disconnect();
      reveal();
    }
  },{threshold:[0,.35],rootMargin:'0px 0px -8% 0px'});
  observer.observe(group);
}
function setupTheme(){const button=document.querySelector('#theme'),meta=document.querySelector('meta[name="theme-color"]');let theme=localStorage.getItem('ft-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const apply=()=>{document.documentElement.dataset.theme=theme;button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label',theme==='dark'?'Activer le thème clair':'Activer le thème sombre');meta.content=theme==='dark'?'#07101d':'#fbf8f2'};apply();button.onclick=()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('ft-theme',theme);apply()}}
let qrCodeLoader;
function loadQrCode(){
  if(window.QRCode)return Promise.resolve(window.QRCode);
  if(!qrCodeLoader)qrCodeLoader=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=`${ASSET}vendor/qrcodejs/qrcode.min.js`;script.onload=()=>resolve(window.QRCode);script.onerror=()=>reject(new Error('Le générateur QR code local est indisponible'));document.head.append(script)});
  return qrCodeLoader;
}
function setupQr(url){const d=document.querySelector('#qr-dialog'),o=document.querySelector('#qr-open'),c=document.querySelector('#qr-close'),t=document.querySelector('#qr-code');let done=false;const close=()=>{d.classList.remove('is-open');setTimeout(()=>{if(d.open)d.close()},180)};o.onclick=async()=>{o.disabled=true;try{await loadQrCode();if(!done){new QRCode(t,{text:url,width:280,height:280,correctLevel:QRCode.CorrectLevel.H});done=true}d.showModal();requestAnimationFrame(()=>d.classList.add('is-open'));c.focus()}catch(error){console.error(error)}finally{o.disabled=false}};c.onclick=close;d.onclick=e=>{if(e.target===d)close()};d.addEventListener('cancel',e=>{e.preventDefault();close()})}

function setupContact(){
  const form=document.querySelector('#contact-form');
  const message=document.querySelector('#contact-message');
  const counter=document.querySelector('#contact-count');
  if(!form||!message||!counter)return;
  const updateCount=()=>{counter.textContent=String(message.value.length)};
  message.addEventListener('input',updateCount);
  form.addEventListener('submit',event=>event.preventDefault());
  updateCount();
}

fetch('config/site.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Configuration indisponible (${r.status})`);return r.json()}).then(render).catch(e=>{console.error(e);document.querySelector('#app').innerHTML='<p class="error">Le contenu du site ne peut pas être chargé.</p>'});
