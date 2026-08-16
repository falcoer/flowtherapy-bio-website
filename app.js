const ASSET='assets/';
const icons={
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle class="dot" cx="17.4" cy="6.7" r="1"></circle></svg>',
  youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0 2.8-.3 4.6-.7 5.6a3 3 0 0 1-1.7 1.7C18.6 19.7 16.8 20 12 20s-6.6-.3-7.6-.7a3 3 0 0 1-1.7-1.7C2.3 16.6 2 14.8 2 12s.3-4.6.7-5.6a3 3 0 0 1 1.7-1.7C5.4 4.3 7.2 4 12 4s6.6.3 7.6.7a3 3 0 0 1 1.7 1.7c.4 1 .7 2.8.7 5.6Z" fill="currentColor"></path><path d="m10 8 5 4-5 4V8Z" fill="#e21b18"></path></svg>',
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.2H8v3.1h2.6v8h3.2Z" fill="currentColor"></path></svg>'
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orientationClass=item=>item.orientation==='portrait'?'ratio-portrait':'ratio-landscape';

function mediaVisual(item,index,viewer=false){
  const ratio=orientationClass(item);
  const ratioStyle=/^\d+:\d+$/.test(String(item.ratio))?` style="--media-ratio:${item.ratio.replace(':','/')}"`:'';
  const content=item.src
    ? `<img src="${esc(item.src)}" alt="${esc(item.title)}" ${viewer?'':'loading="lazy"'} decoding="async">`
    : `<div class="media-placeholder tone-${index%3+1}" aria-hidden="true"><span>FLOW<br>THERAPY</span><small>${esc(item.ratio)}</small></div>`;
  return `<div class="media-frame ${ratio}"${ratioStyle}>${content}</div>`;
}

function render(config){
  const {site,hero,navigation,socials,about,media}=config;
  const mediaItems=media?.items||[];
  const listen=socials.find(s=>s.icon==='youtube')?.url||socials[0]?.url||'#contact';
  document.title=`${site.name} — ${hero.lines.join(' ')}`;
  document.querySelector('#app').innerHTML=`
<header id="accueil" class="home">
  <nav class="nav" aria-label="Navigation principale"><a href="#accueil" aria-label="Accueil Flow Therapy"><img class="logo" src="assets/logo_transparent.png" alt="Flow Therapy"></a><div class="links">${navigation.map(n=>`<a href="${n.href}">${esc(n.label)}</a>`).join('')}</div><div class="tools"><button id="qr-open" class="icon-btn" type="button" aria-label="Partager par QR code">▦</button><button id="theme" class="theme" type="button" aria-label="Activer le thème sombre" aria-pressed="false"><span aria-hidden="true">☀</span><span aria-hidden="true">☾</span></button></div></nav><div class="socials hero-socials">${socials.map(s=>`<a class="social ${s.icon}" href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icons[s.icon]||esc(s.label[0])}</a>`).join('')}</div>
  <div class="hero-grid"><div class="copy"><h1>${hero.lines.map((l,i)=>`<span class="line l${i+1}">${esc(l)}</span>`).join('')}</h1><p>${esc(site.tagline)}</p><div class="actions"><a class="primary" href="${listen}" target="_blank" rel="noopener">▶ ÉCOUTER</a><a class="secondary" href="#medias">MÉDIAS</a></div></div>
  <div class="art" aria-label="Composition graphique Flow Therapy"><div class="watermark" aria-hidden="true"></div><div class="alpacas" aria-hidden="true">${[1,2,3].map(n=>`<div class="alpaca"><img class="alpaca-nude" src="${ASSET}alpaga${n}-nu.png" alt=""><img class="alpaca-costumed" src="${ASSET}alpaga${n}.png" alt=""></div>`).join('')}</div><div class="brush">${esc(hero.signature)}</div></div></div>
</header>
<section id="groupe" class="section"><p class="kicker">${esc(site.location)}</p><h2>${esc(about.title)}</h2><div class="prose">${about.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div></section>
<section id="medias" class="section media-section"><p class="kicker">Photos & contenus</p><div class="media-heading"><h2>${esc(media?.title||'Médias')}</h2><p>${esc(media?.intro||'')}</p></div><div class="media-grid">${mediaItems.map((item,index)=>`<button class="media-card ${orientationClass(item)}" type="button" data-media-index="${index}" aria-label="Ouvrir ${esc(item.title)} dans la galerie">${mediaVisual(item,index)}<span class="media-card-copy"><small>${esc(item.type)} · ${esc(item.ratio)}</small><strong>${esc(item.title)}</strong><span>Voir en grand <b aria-hidden="true">↗</b></span></span></button>`).join('')}</div></section>
<footer id="contact"><strong>Flow Therapy</strong><span>${esc(site.copyright)}</span>${socials.map(s=>`<a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</footer>`;
  setupTheme();
  setupQr(site.url);
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

function setupAlpacaReveal(){const group=document.querySelector('.alpacas');if(!group||matchMedia('(prefers-reduced-motion: reduce)').matches){group?.classList.add('is-costumed');return}requestAnimationFrame(()=>requestAnimationFrame(()=>group.classList.add('is-costumed')))}
function setupTheme(){const button=document.querySelector('#theme'),meta=document.querySelector('meta[name="theme-color"]');let theme=localStorage.getItem('ft-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const apply=()=>{document.documentElement.dataset.theme=theme;button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label',theme==='dark'?'Activer le thème clair':'Activer le thème sombre');meta.content=theme==='dark'?'#07101d':'#fbf8f2'};apply();button.onclick=()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('ft-theme',theme);apply()}}
function setupQr(url){const d=document.querySelector('#qr-dialog'),o=document.querySelector('#qr-open'),c=document.querySelector('#qr-close'),t=document.querySelector('#qr-code');document.querySelector('#qr-url').textContent=url;let done=false;const close=()=>{d.classList.remove('is-open');setTimeout(()=>{if(d.open)d.close()},180)};o.onclick=()=>{if(!done&&window.QRCode){new QRCode(t,{text:url,width:280,height:280,correctLevel:QRCode.CorrectLevel.H});done=true}d.showModal();requestAnimationFrame(()=>d.classList.add('is-open'));c.focus()};c.onclick=close;d.onclick=e=>{if(e.target===d)close()};d.addEventListener('cancel',e=>{e.preventDefault();close()})}

fetch('config/site.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Configuration indisponible (${r.status})`);return r.json()}).then(render).catch(e=>{console.error(e);document.querySelector('#app').innerHTML='<p class="error">Le contenu du site ne peut pas être chargé.</p>'});
