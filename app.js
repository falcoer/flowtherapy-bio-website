const SITE_ROOT=new URL('./',import.meta.url);
const ASSET=new URL('assets/',SITE_ROOT).href;
const CONFIG_URL=new URL('config/site.json',SITE_ROOT);
const AGENDA_URL=new URL('config/agenda.json',SITE_ROOT);
const BUILD_INFO_URL=new URL('assets-manifest.json',SITE_ROOT);
const I18N_URL=locale=>new URL('i18n/'+locale+'.json',SITE_ROOT);
const CONTACT_URL=new URL('api/contact',SITE_ROOT);
const LOCALES={fr:{flag:'🇫🇷'},en:{flag:'🇬🇧'},es:{flag:'🇪🇸'},it:{flag:'🇮🇹'},de:{flag:'🇩🇪'},pt:{flag:'🇵🇹'},zh:{flag:'🇨🇳'},ja:{flag:'🇯🇵'}};
let siteConfig;
let activeLocale;
let activeCopy;
let languageOutsideHandler;
let buildInfoPromise;
const icons={
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle class="dot" cx="17.4" cy="6.7" r="1"></circle></svg>',
  youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12c0 2.8-.3 4.6-.7 5.6a3 3 0 0 1-1.7 1.7C18.6 19.7 16.8 20 12 20s-6.6-.3-7.6-.7a3 3 0 0 1-1.7-1.7C2.3 16.6 2 14.8 2 12s.3-4.6.7-5.6a3 3 0 0 1 1.7-1.7C5.4 4.3 7.2 4 12 4s6.6.3 7.6.7a3 3 0 0 1 1.7 1.7c.4 1 .7 2.8.7 5.6Z" fill="currentColor"></path><path d="m10 8 5 4-5 4V8Z" fill="#e21b18"></path></svg>',
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.8 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5H17V3.7c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.2H8v3.1h2.6v8h3.2Z" fill="currentColor"></path></svg>',
  qr:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect class="dot" x="5" y="5" width="3" height="3"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect class="dot" x="16" y="5" width="3" height="3"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect class="dot" x="5" y="16" width="3" height="3"></rect><rect class="dot" x="14" y="14" width="2" height="2"></rect><rect class="dot" x="18" y="14" width="3" height="2"></rect><rect class="dot" x="14" y="18" width="3" height="3"></rect><rect class="dot" x="19" y="18" width="2" height="3"></rect></svg>',
  contact:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"></rect><path d="m4 7 8 6 8-6"></path></svg>'
};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const alpacaMember=(hero,n)=>(hero?.members||[]).find(member=>Number(member.alpaca)===n&&member.description);
const orientationClass=item=>item.orientation==='portrait'?'ratio-portrait':'ratio-landscape';
// Lettrage « flow therapy » vectorisé depuis le logo original (assets-src/images/logo_transparent.png).
const LOGO_NAME_PATH='M890.3 185.1C883.7 182.9 877.3 178.4 875.4 174.9C873.3 170.8 873.6 164.8 876.0 162.2C879.6 158.3 884.1 158.2 895.9 161.5C900.9 162.9 901.7 162.8 904.9 161.2C911.3 158.1 914.6 151.0 917.5 134.1C918.3 129.5 919.0 123.2 919.0 120.1L919.0 114.5L917.1 117.6C907.0 134.2 887.0 137.4 875.0 124.4C867.6 116.3 864.2 105.4 863.3 86.5C862.9 76.8 863.2 71.2 864.4 64.2C867.0 49.4 871.2 43.0 878.2 43.0C886.8 43.0 889.7 50.5 890.9 75.7C892.0 96.6 893.0 99.3 899.8 99.8C902.8 100.0 905.1 99.5 907.4 98.0C913.1 94.6 914.2 90.6 915.1 71.9C915.9 52.1 917.5 47.2 923.5 44.3C927.0 42.6 927.3 42.6 930.8 44.5C940.2 49.5 945.9 72.2 946.0 104.0C946.0 138.7 940.0 162.0 927.4 175.9C920.5 183.6 912.9 187.0 903.0 187.0C898.5 186.9 893.4 186.2 890.3 185.1ZM784.2 184.5C781.1 182.2 778.4 176.5 776.9 168.9C775.3 161.2 775.5 63.2 777.1 56.2C779.1 46.9 784.1 41.0 789.8 41.0C792.9 41.0 796.7 44.7 798.5 49.4L800.2 53.8L804.7 50.4C811.0 45.6 813.6 44.4 820.5 42.9C835.9 39.8 849.4 51.1 853.5 70.7C855.4 79.5 855.4 96.0 853.5 104.9C848.4 129.1 832.3 142.8 814.5 137.9C812.3 137.3 809.0 135.7 807.2 134.4L804.0 131.9L804.0 141.2C803.9 165.1 801.4 178.7 796.2 183.3C793.3 185.9 787.1 186.5 784.2 184.5ZM407.5 143.3C399.9 141.6 397.4 140.5 394.1 137.4C392.0 135.5 389.2 131.6 387.9 128.7C385.6 123.7 385.5 122.6 385.5 100.0C385.5 87.1 385.8 74.4 386.2 71.8L387.0 67.0L382.2 67.0C372.4 67.0 366.0 63.3 366.0 57.5C366.0 51.6 372.1 47.1 383.0 44.9C386.6 44.2 389.6 43.5 389.8 43.5C389.9 43.4 390.5 39.6 391.1 35.0C392.9 19.9 398.1 12.0 406.1 12.0C414.2 12.0 417.7 19.4 416.6 34.5L416.0 43.5L423.3 43.6C443.1 43.8 444.6 58.0 425.4 64.0C421.7 65.1 417.8 66.0 416.5 66.0C414.5 66.0 414.2 66.6 413.6 71.8C412.3 83.5 411.8 110.5 412.8 113.2C413.4 114.7 415.1 116.7 416.5 117.6C418.8 119.1 419.9 119.2 425.1 118.2C435.0 116.4 440.3 119.9 440.3 128.3C440.3 135.2 434.7 140.2 424.1 142.6C418.6 143.9 411.5 144.2 407.5 143.3ZM745.3 142.1C741.5 139.7 739.3 136.5 738.4 132.2C738.0 130.4 737.6 129.0 737.4 129.0C737.2 129.0 735.0 130.5 732.6 132.4C712.6 147.6 686.0 136.3 686.0 112.6C686.0 101.9 693.5 92.7 707.5 86.1C714.2 82.9 727.7 79.0 731.8 79.0C734.1 79.0 734.2 78.8 733.7 74.4C732.4 62.1 722.0 59.6 709.0 68.6C701.8 73.6 698.9 74.4 694.4 73.0C691.8 72.1 690.4 70.9 689.4 68.3C683.3 53.9 707.6 36.6 729.1 40.1C746.3 42.9 756.3 54.6 761.2 77.6C763.0 85.9 763.3 91.1 763.4 110.0C763.5 130.2 763.3 132.9 761.6 136.3C758.2 143.2 751.1 145.7 745.3 142.1ZM99.3 141.3C91.2 139.7 85.9 121.6 84.5 90.5C83.9 78.0 84.3 70.4 86.5 51.5C87.0 47.3 86.9 46.7 85.8 48.0C81.6 53.0 73.7 54.6 69.3 51.5C66.9 49.8 65.0 44.4 65.0 39.3C65.0 30.4 59.0 27.2 55.4 34.3C53.7 37.5 51.1 50.4 51.0 55.8L51.0 59.0L58.5 59.0C64.1 59.0 67.1 59.5 69.9 61.0C74.0 63.1 75.0 64.6 75.0 68.9C75.0 73.7 67.3 79.3 57.5 81.5L52.5 82.6L52.0 105.6C51.5 125.1 51.1 129.1 49.6 132.3C46.2 139.2 37.1 141.5 32.3 136.7C28.3 132.8 26.9 125.4 26.3 104.9L25.7 86.3L19.4 85.7C9.2 84.7 4.5 81.4 4.7 75.3C4.9 70.3 9.0 66.4 16.8 64.0C20.3 62.9 24.1 62.0 25.1 62.0C26.7 62.0 27.0 61.3 27.0 57.6C27.0 55.1 27.5 49.6 28.1 45.4C31.3 22.0 42.5 7.1 58.8 4.6C73.0 2.4 83.2 11.0 87.9 29.1C89.0 33.2 89.9 35.6 89.9 34.4C90.1 30.0 94.2 20.4 97.2 17.3C99.8 14.6 101.2 14.0 104.5 14.0C113.4 14.0 115.6 20.7 114.4 45.0C113.9 54.1 113.5 76.8 113.5 95.5C113.5 128.9 113.5 129.6 111.2 134.2C109.7 137.3 107.8 139.3 105.6 140.4C103.7 141.3 102.0 141.9 101.8 141.9C101.7 141.8 100.5 141.5 99.3 141.3ZM152.4 141.0C142.8 138.0 133.0 126.8 128.9 114.2C125.8 104.6 125.1 86.7 127.5 76.8C131.1 61.5 140.1 47.9 150.0 43.0C156.2 39.8 165.3 39.3 172.5 41.5C183.7 45.1 193.3 57.3 197.1 73.0C198.8 80.1 198.8 98.9 197.1 106.0C195.1 114.4 188.6 127.2 183.8 132.2C177.6 138.5 171.1 141.4 162.5 141.7C158.7 141.8 154.1 141.5 152.4 141.0ZM502.3 140.5C498.0 137.5 496.8 131.8 495.9 109.8C495.3 95.6 494.6 88.0 493.6 85.7C491.2 79.8 486.1 78.4 480.3 82.0C475.0 85.2 474.1 88.4 473.0 105.7C471.5 128.3 469.2 136.3 462.9 139.6C456.2 143.0 450.1 139.4 447.3 130.2C443.8 118.9 445.9 55.7 450.6 30.8C453.8 13.9 460.3 5.4 467.2 9.1C474.3 12.9 476.5 20.8 476.5 43.1L476.5 60.8L479.8 57.9C484.6 53.7 492.5 50.0 498.1 49.3C508.3 48.1 516.0 53.8 519.6 65.4C522.9 75.9 522.5 119.5 518.9 132.4C517.3 138.2 513.1 142.0 508.3 142.0C506.2 142.0 503.5 141.3 502.3 140.5ZM624.4 140.1C621.6 138.9 618.5 134.5 617.1 129.5C615.7 124.8 613.7 80.1 614.2 65.5C614.7 50.3 619.2 43.0 627.9 43.0C633.1 43.0 639.0 51.3 639.0 58.5C639.0 59.7 640.3 58.8 643.2 55.5C645.6 52.8 649.6 49.7 652.5 48.4C664.9 42.6 681.9 48.1 685.0 58.9C687.0 65.8 683.4 71.9 676.2 74.1C672.6 75.1 671.3 75.0 665.7 73.1C657.2 70.3 655.7 70.4 651.1 74.5C644.3 80.6 642.8 85.9 641.9 105.7C641.1 124.9 639.5 132.4 635.2 137.0C632.3 140.2 627.8 141.5 624.4 140.1ZM287.4 138.1C281.1 134.3 273.5 118.4 268.9 99.2C267.6 94.2 266.2 90.0 265.8 90.0C265.4 90.0 265.0 90.6 265.0 91.2C265.0 93.2 253.8 115.8 249.6 122.4C241.9 134.3 236.2 139.0 229.4 139.0C222.1 139.0 217.1 130.5 212.5 110.4C207.6 88.6 206.4 53.0 210.5 46.3C212.9 42.2 218.1 39.6 222.0 40.5C230.2 42.3 235.1 56.2 237.8 85.4L238.5 93.2L243.9 79.4C251.4 60.0 257.5 47.5 260.6 45.1C262.1 43.9 264.7 43.0 266.7 43.0C270.9 43.0 274.8 46.8 278.7 54.4C281.5 59.9 289.4 83.2 290.5 89.3C291.6 95.0 292.6 92.7 293.9 81.1C296.2 62.0 300.8 48.2 306.7 43.0C313.8 36.8 323.1 40.5 324.5 50.1C325.3 55.6 323.8 67.6 320.4 82.8C313.4 114.1 305.5 133.3 297.7 138.0C293.7 140.5 291.3 140.5 287.4 138.1ZM561.3 137.6C555.4 135.7 551.0 132.7 545.9 127.3C535.9 116.5 532.7 107.5 532.6 90.0C532.6 79.1 532.9 76.4 535.2 68.9C539.7 54.7 548.5 43.4 558.9 38.6C565.6 35.6 578.8 35.6 584.7 38.8C590.7 42.0 595.8 46.7 598.3 51.4C600.1 54.7 600.5 57.2 600.5 64.5C600.5 72.3 600.1 74.2 597.8 78.6C592.2 89.2 580.2 97.7 567.3 100.2C564.1 100.8 561.1 101.6 560.7 102.0C559.3 103.2 564.9 108.9 568.5 109.9C572.9 111.1 577.8 109.9 583.6 106.4C586.1 104.8 589.8 102.5 591.8 101.3C596.4 98.5 600.0 98.4 603.3 101.0C607.6 104.4 607.8 109.0 604.1 116.5C599.2 126.5 589.1 134.4 577.5 137.4C570.5 139.3 566.9 139.3 561.3 137.6ZM166.7 115.5C173.7 110.6 175.1 82.9 168.9 70.8C166.8 66.8 163.0 65.0 160.1 66.7C154.7 69.9 151.0 87.2 153.0 99.8C155.3 114.0 160.4 119.9 166.7 115.5ZM729.8 111.4L735.0 108.9L735.0 103.4C735.0 98.2 734.9 98.0 732.2 98.0C728.5 98.0 719.5 102.3 716.5 105.6C713.4 108.9 713.3 111.4 716.2 113.5C719.0 115.4 722.4 114.8 729.8 111.4ZM822.6 107.5C829.5 103.2 831.6 81.9 826.0 74.1C821.7 68.0 811.4 69.6 805.9 77.3C803.3 80.9 803.0 82.1 803.0 88.9C803.0 101.8 805.5 106.7 813.0 108.8C816.8 109.9 819.3 109.5 822.6 107.5ZM571.8 75.1C575.7 73.1 579.0 68.6 579.0 65.2C579.0 62.9 574.6 59.0 572.1 59.0C567.0 59.0 561.1 66.5 559.6 74.9L559.0 78.3L563.5 77.7C566.0 77.3 569.7 76.2 571.8 75.1Z';
const responsivePicture=(name,widths,className,alt='')=>`<picture><source type="image/avif" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.avif ${width}w`).join(', ')}"><source type="image/webp" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.webp ${width}w`).join(', ')}"><img class="${className}" src="${ASSET}generated/${name}-${widths[0]}.png" srcset="${widths.map(width=>`${ASSET}generated/${name}-${width}.png ${width}w`).join(', ')}" sizes="${className==='logo'?'(max-width: 790px) 200px, 240px':'(max-width: 790px) 52vw, 640px'}" width="${widths[0]}" height="${Math.round(widths[0]*2/3)}" alt="${esc(alt)}" decoding="async"></picture>`;

const responsiveMediaPicture=(item,viewer=false)=>{
  const widths=Array.isArray(item.widths)?item.widths.filter(Number.isFinite):[];
  if(!item.asset||!widths.length)return '';
  const name=esc(item.asset);
  const sizes=viewer?'min(92vw, 1280px)':'(max-width: 620px) calc(50vw - 12px), (max-width: 1100px) calc(33vw - 18px), 20vw';
  const srcset=extension=>widths.map(width=>`${ASSET}media/${name}-${width}.${extension} ${width}w`).join(', ');
  const fallback=widths[widths.length-1];
  return `<picture><source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}"><img src="${ASSET}media/${name}-${fallback}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}" alt="${esc(item.title)}" ${viewer?'':'loading="lazy"'} decoding="async"></picture>`;
};

const responsiveReferencePicture=item=>{
  const widths=Array.isArray(item.widths)?item.widths.filter(Number.isFinite):[];
  if(!item.asset||!widths.length)return '';
  const name=esc(item.asset);
  const sizes='(max-width: 520px) calc(100vw - 48px), (max-width: 900px) calc(50vw - 38px), 23vw';
  const srcset=extension=>widths.map(width=>`${ASSET}references/${name}-${width}.${extension} ${width}w`).join(', ');
  const fallback=widths[widths.length-1];
  return `<picture><source type="image/avif" srcset="${srcset('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}"><img src="${ASSET}references/${name}-${fallback}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}" alt="" loading="lazy" decoding="async"></picture>`;
};

function showcaseVideo(references){
  const video=references?.showcase,copy=references?.video||{};
  if(!video?.url||!/^[\w-]{11}$/.test(String(video.youtubeId)))return '';
  return `<div class="showcase-video"><a class="showcase-video__thumb" href="${esc(video.url)}" target="_blank" rel="noopener" data-youtube-id="${video.youtubeId}" data-title="${esc(copy.title||'YouTube')}" aria-label="${esc(copy.play||copy.title||'YouTube')}"><img src="https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg" alt="" loading="lazy" decoding="async" onerror="this.remove()"><span class="showcase-video__play" aria-hidden="true">${icons.youtube}</span></a><div class="showcase-video__text"><p class="kicker">${esc(copy.kicker||'')}</p><p class="showcase-video__title">${esc(copy.title||'')}</p><a class="showcase-video__cta" href="${esc(video.url)}" target="_blank" rel="noopener" aria-label="${esc(copy.label||copy.cta||'')}">${esc(copy.cta||'')} <span aria-hidden="true">↗</span></a></div></div>`;
}

function setupShowcase(){
  const thumb=document.querySelector('.showcase-video__thumb[data-youtube-id]');
  if(!thumb)return;
  thumb.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.button!==0)return;
    event.preventDefault();
    const frame=document.createElement('div');
    frame.className='showcase-video__thumb is-playing';
    const iframe=document.createElement('iframe');
    iframe.src=`https://www.youtube-nocookie.com/embed/${thumb.dataset.youtubeId}?autoplay=1&rel=0&playsinline=1`;
    iframe.title=thumb.dataset.title||'YouTube';
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    frame.append(iframe);
    thumb.replaceWith(frame);
    iframe.focus();
  });
}

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

function renderPage(config){
  const {site,hero,navigation,socials,about,references,media,contact,agenda}=config;
  const mediaItems=media?.items||[];
  const referenceItems=references?.items||[];
  const agendaItems=upcomingEvents(agenda?.items);
  document.title=`${site.name} — ${hero.lines.join(' ')}`;
  document.querySelector('#app').innerHTML=`
<header id="accueil" class="home">
  <nav class="nav" aria-label="Navigation principale"><div class="socials header-socials" aria-label="Réseaux sociaux">${socials.map(s=>`<a class="social ${s.icon}" href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.label)}">${icons[s.icon]||esc(s.label[0])}</a>`).join('')}<button id="qr-open" class="social qr-social" type="button" aria-label="Partager par QR code">${icons.qr}</button><a class="social contact-social" href="#contact" aria-label="Nous contacter" title="Nous contacter">${icons.contact}</a></div><div class="nav-side"><div class="links">${navigation.map(n=>`<a href="${n.href}">${esc(n.label)}</a>`).join('')}</div><div class="tools"><button id="theme" class="theme" type="button" aria-label="Activer le thème sombre" aria-pressed="false"><span aria-hidden="true">☀</span><span aria-hidden="true">☾</span></button></div></div></nav>
  <div class="doodle-field hero-doodles" aria-hidden="true"><span class="doodle doodle-paint tone-pink"></span><span class="doodle doodle-star tone-orange"></span><span class="doodle doodle-spark tone-blue"></span><span class="doodle doodle-heart tone-pink"></span><span class="doodle doodle-arrow tone-blue"></span><span class="doodle doodle-underline tone-purple"></span></div>
  <div class="hero-grid"><div class="copy"><h1>${hero.heading?`<span class="hero-heading">${esc(hero.heading)} – </span>`:''}${hero.lines.map((l,i)=>`<span class="line l${i+1}">${esc(l)}</span>`).join('')}</h1><p>${esc(site.tagline)}</p><div class="actions"><a class="primary" href="#agenda">AGENDA</a><a class="secondary" href="#medias">MÉDIAS</a></div></div>
  <div class="art logo-stage" aria-label="Logo Flow Therapy"><div class="logo-frame" aria-hidden="true"><div class="logo-backdrop"></div></div><div class="alpacas">${[1,2,3].map(n=>{const member=alpacaMember(hero,n);return member?`<button class="alpaca" type="button" data-alpaca="${n}" data-member="${esc(member.id)}" aria-expanded="false" aria-controls="alpaca-bio" aria-label="${esc((hero.membersOpen||'{name}').replace('{name}',member.name))}">${responsivePicture(`alpaga${n}-nu`,[640,768,1024],'alpaca-nude')}</button>`:`<div class="alpaca" data-alpaca="${n}" aria-hidden="true">${responsivePicture(`alpaga${n}-nu`,[640,768,1024],'alpaca-nude')}</div>`}).join('')}</div><svg class="logo-name" viewBox="-18 -18 986 227" aria-hidden="true" focusable="false"><path d="${LOGO_NAME_PATH}"/></svg><div id="alpaca-bio" class="alpaca-bio" role="region" aria-live="polite" aria-label="${esc(hero.membersTitle||'')}" hidden><p class="alpaca-bio__name"></p><p class="alpaca-bio__text"></p></div></div></div>
</header>
<section id="groupe" class="section"><div class="doodle-field section-doodles" aria-hidden="true"><span class="doodle doodle-paint tone-blue"></span><span class="doodle doodle-swoosh tone-pink"></span><span class="doodle doodle-star tone-purple"></span><span class="doodle doodle-heart tone-orange"></span></div><p class="kicker">${esc(site.location)}</p><h2>${esc(about.title)}</h2><div class="prose">${about.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div></section>
<section id="references" class="section references-section" aria-labelledby="references-title"><p class="kicker">${esc(references?.eyebrow||'')}</p><h2 id="references-title">${esc(references?.title||'')}</h2><div class="reference-grid">${referenceItems.map((item,index)=>`<button class="reference-card reference-card--${esc(item.id)}" type="button" data-reference-index="${index}" aria-expanded="false" aria-controls="references-details" aria-label="${esc((references?.open||'Afficher les publications de {name}').replace('{name}',item.name))}"><span class="reference-card__visual" aria-hidden="true">${responsiveReferencePicture(item)}</span><span class="reference-card__more" aria-hidden="true">•••</span></button>`).join('')}<div id="references-details" class="reference-details" hidden aria-live="polite"></div></div></section>
<section id="agenda" class="section agenda-section" aria-labelledby="agenda-title"><p class="kicker">${esc(agenda?.eyebrow||'')}</p><h2 id="agenda-title">${esc(agenda?.title||'')}</h2>${agendaItems.length?`<ol class="agenda-list">${agendaItems.map(event=>agendaCard(event,agenda)).join('')}</ol>`:`<p class="agenda-empty">${esc(agenda?.empty||'')}</p>`}</section>
<section id="medias" class="section media-section" aria-label="Médias">${showcaseVideo(references)}<div class="media-grid">${mediaItems.map((item,index)=>`<button class="media-card ${orientationClass(item)}" type="button" data-media-index="${index}"${item.layout?` data-media-layout="${esc(item.layout)}"`:''} aria-label="Ouvrir ${esc(item.title)} dans la galerie">${mediaVisual(item,index)}</button>`).join('')}</div></section>
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
        <div class="contact-trap" aria-hidden="true"><label for="contact-company">Société</label><input id="contact-company" name="company" type="text" tabindex="-1" autocomplete="off"></div>
        <input name="startedAt" type="hidden" value="${Date.now()}">
        <div id="contact-turnstile" data-sitekey="${esc(contact?.turnstileSiteKey||'')}"></div>
        <button class="contact-submit" type="submit" disabled>Envoyer le message</button>
        <p class="contact-notice" role="status" aria-live="polite">Réponse habituelle sous quelques jours.</p>
      </form>
    </div>
  </div>
</section>
<footer><a class="footer-logo" href="#accueil" aria-label="Retour en haut de la page">${responsivePicture('logo-transparent',[320,480],'logo','Flow Therapy')}</a><span>${esc(site.copyright)}</span></footer>`;
  setupTheme();
  setupQr();
  setupAlpacaReveal();
  setupAlpacaBios(hero);
  setupReferences(referenceItems,references);
  setupShowcase();
  setupMediaViewer(mediaItems);
}

const todayParis=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date());
const upcomingEvents=items=>(Array.isArray(items)?items:[]).filter(event=>event.date>=todayParis()).sort((a,b)=>(a.date+(a.heure||'')).localeCompare(b.date+(b.heure||'')));
function agendaCard(event,copy){
  const date=new Date(event.date+'T12:00:00Z');
  const day=date.getUTCDate();
  const month=new Intl.DateTimeFormat(activeLocale,{month:'short',timeZone:'UTC'}).format(date);
  const full=new Intl.DateTimeFormat(activeLocale,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(date);
  const modality=event.modalites?copy.modalites?.[event.modalites]:'';
  const phone=event.telephone?String(event.telephone):'';
  return `<li class="agenda-card"><time class="agenda-date" datetime="${esc(event.date)}" aria-label="${esc(full)}"><span class="agenda-day">${day}</span><span class="agenda-month">${esc(month)}</span></time><div class="agenda-body"><h3>${esc(event.nom)}</h3><p class="agenda-place">${esc(event.etablissement)} · ${esc(event.lieu)}${event.heure?` · ${esc(event.heure.replace(':','h'))}`:''}</p>${modality?`<p class="agenda-modality">${esc(modality)}</p>`:''}${phone?`<p class="agenda-phone"><a href="tel:${esc(phone.replace(/[^\d+]/g,''))}" aria-label="${esc(copy.phone)} ${esc(phone)}">☎ ${esc(phone)}</a></p>`:''}</div></li>`;
}
function localizedConfig(config,copy){
  return {...config,site:{...config.site,...copy.site},hero:{...copy.hero,members:(config.hero?.members||[]).map(member=>({...member,description:copy.hero?.members?.[member.id]||''}))},navigation:[{label:copy.navigation.group,href:'#groupe'},{label:copy.navigation.agenda,href:'#agenda'},{label:copy.navigation.media,href:'#medias'}],agenda:{...copy.agenda,items:config.agenda?.evenements||[]},about:copy.about,references:{...copy.references,showcase:config.showcase},media:{...config.media,title:copy.media.title,intro:copy.media.intro,items:(config.media?.items||[]).map(item=>({...item,...(copy.media.items[item.id]||{})}))}};
}

function setupReferences(items,copy){
  const details=document.querySelector('#references-details');
  const cards=[...document.querySelectorAll('[data-reference-index]')];
  const grid=document.querySelector('.reference-grid');
  if(!details||!items.length)return;
  const show=index=>{
    const item=items[index];
    const publications=Array.isArray(item.publications)?item.publications:[];
    cards.forEach((card,cardIndex)=>{
      const selected=cardIndex===index;
      card.classList.toggle('is-active',selected);
      card.setAttribute('aria-expanded',String(selected));
    });
    details.hidden=false;
    details.innerHTML=`<div class="reference-details__inner"><p class="reference-details__brand">${esc(item.name)}</p>${publications.length?`<div class="reference-publications">${publications.map(publication=>`<article class="reference-publication"><p class="kicker">${esc(publication.date)}</p>${publication.url?`<a href="${esc(publication.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(publication.title)}</span><span class="reference-publication__source">${esc(publication.source)} <b aria-hidden="true">↗</b></span></a>`:`<div class="reference-publication__pending"><span>${esc(publication.title)}</span><span class="reference-publication__source">${esc(publication.source)} · ${esc(copy?.pending||'')}</span></div>`}</article>`).join('')}</div>`:`<p class="reference-empty">${esc(item.empty||copy?.empty||'')}</p>`}</div>`;
    if(matchMedia('(max-width: 520px)').matches)cards[index].insertAdjacentElement('afterend',details);
    else grid?.append(details);
  };
  cards.forEach(card=>card.addEventListener('click',()=>show(Number(card.dataset.referenceIndex))));
}
function setText(selector,value){const element=document.querySelector(selector);if(element)element.textContent=value;}
function translateRenderedPage(copy,locale){
  document.documentElement.lang=locale;document.title=copy.meta.title;
  const description=document.querySelector('meta[name="description"]');if(description)description.content=copy.meta.description;
  setText('.actions .primary',copy.navigation.agenda.toLocaleUpperCase(locale));setText('.actions .secondary',copy.hero.media);
  setText('.contact-heading > div > p:first-child',copy.contact.eyebrow);setText('#contact-title',copy.contact.title);setText('.contact-intro',copy.contact.intro);
  setText('label[for="contact-subject"]',copy.contact.subject);
  const subject=document.querySelector('#contact-subject');if(subject){subject.replaceChildren(new Option(copy.contact.chooseSubject,''));Object.entries(copy.contact.subjects).forEach(([value,label])=>subject.add(new Option(label,value)));}
  setText('label[for="contact-email"]',copy.contact.email);const email=document.querySelector('#contact-email');if(email)email.placeholder=copy.contact.emailPlaceholder;
  const phoneLabel=document.querySelector('label[for="contact-phone"]');if(phoneLabel)phoneLabel.replaceChildren(document.createTextNode(copy.contact.phone+' '),Object.assign(document.createElement('span'),{textContent:'('+copy.contact.optional+')'}));
  const phone=document.querySelector('#contact-phone');if(phone)phone.placeholder=copy.contact.phonePlaceholder;
  setText('label[for="contact-message"]',copy.contact.message);const message=document.querySelector('#contact-message');if(message)message.placeholder=copy.contact.messagePlaceholder;
  setText('.contact-submit',copy.contact.submit);setText('.contact-notice',copy.contact.notice);
  const info=document.querySelector('#media-info');if(info)info.textContent=copy.viewer.info;
  for(const [selector,label] of [['#media-close',copy.viewer.close],['#media-prev',copy.viewer.previous],['#media-next',copy.viewer.next],['#qr-close',copy.qr.close]]){const element=document.querySelector(selector);if(element)element.setAttribute('aria-label',label);}
  document.querySelectorAll('#media-meta dt').forEach((field,index)=>field.textContent=[copy.viewer.type,copy.viewer.format,copy.viewer.date,copy.viewer.credit][index]||'');
  setText('#qr-title',copy.qr.title);const qr=document.querySelector('#qr-code');if(qr)qr.setAttribute('aria-label',copy.qr.label);
  const mediaSection=document.querySelector('#medias');if(mediaSection)mediaSection.setAttribute('aria-label',copy.media.label);
  document.querySelectorAll('[data-media-index]').forEach((card,index)=>{const item=Object.values(copy.media.items)[index];if(item)card.setAttribute('aria-label',copy.media.open.replace('{title}',item.title));});
}
function setupLanguageSwitcher(locale,copy){
  const tools=document.querySelector('.tools');if(!tools)return;
  const switcher=document.createElement('div');switcher.className='language-switcher';
  switcher.innerHTML='<button id="language-toggle" class="language-toggle" type="button" aria-label="'+esc(copy.controls.language)+'" aria-expanded="false" aria-controls="language-menu"><span aria-hidden="true">'+LOCALES[locale].flag+'</span><span class="language-code" aria-hidden="true">'+locale.toUpperCase()+'</span></button><div id="language-menu" class="language-menu" hidden>'+Object.entries(LOCALES).map(([code,details])=>'<button type="button" class="language-option" data-locale="'+code+'" lang="'+code+'"'+(code===locale?' aria-current="true"':'')+'><span aria-hidden="true">'+details.flag+'</span>'+esc(copy.controls.languages[code])+'</button>').join('')+'</div>';
  tools.insertBefore(switcher,tools.firstChild);const toggle=switcher.querySelector('#language-toggle'),menu=switcher.querySelector('#language-menu');
  const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
  toggle.onclick=()=>{const opening=menu.hidden;menu.hidden=!opening;toggle.setAttribute('aria-expanded',String(opening));};
  menu.querySelectorAll('[data-locale]').forEach(button=>button.onclick=()=>setLocale(button.dataset.locale,{historyMode:'push'}));
  if(languageOutsideHandler)document.removeEventListener('click',languageOutsideHandler);languageOutsideHandler=event=>{if(!event.target.closest('.language-switcher'))close();};document.addEventListener('click',languageOutsideHandler);
}
function render(config,copy,locale){
  activeCopy=copy;activeLocale=locale;
  for(const selector of ['#media-dialog','#qr-dialog']){
    const dialog=document.querySelector(selector);if(!dialog)continue;
    if(dialog.open)dialog.close();
    const replacement=dialog.cloneNode(true);
    replacement.removeAttribute('open');replacement.classList.remove('is-open');
    dialog.replaceWith(replacement);
  }
  renderPage(localizedConfig(config,copy));translateRenderedPage(copy,locale);setupContact();setupLanguageSwitcher(locale,copy);setupBuildInfo();
}

function setupBuildInfo(){
  const logo=document.querySelector('.footer-logo');if(!logo)return;
  logo.addEventListener('dblclick',async event=>{
    event.preventDefault();
    try{
      buildInfoPromise??=fetch(BUILD_INFO_URL,{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error(String(response.status));return response.json()});
      const {built_at:dateBuild}=await buildInfoPromise;
      alert(dateBuild||'Date de build indisponible');
    }catch(error){console.error(error);alert('Date de build indisponible');}
  });
}

function setupMediaViewer(items){const labels=activeCopy?.viewer||{info:'Infos',hideInfo:'Masquer les infos'};
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
    info.textContent=labels.info;
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
    info.textContent=expanded?labels.hideInfo:labels.info;
  };
  dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
  dialog.addEventListener('close',()=>opener?.focus());
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'){event.preventDefault();move(-1)}
    if(event.key==='ArrowRight'){event.preventDefault();move(1)}
  });
}

const ALPACA_HIDDEN_HOLD_MS=1500;
const ALPACA_EXIT_ORDER=[[3,0],[1,650],[2,1000]];
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
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){mountCostumes(group);group.classList.add('is-costumed');group.querySelectorAll('[data-alpaca]').forEach(alpaca=>alpaca.classList.add('is-out'));return}
  const reveal=async()=>{
    if(group.dataset.revealStarted)return;
    group.dataset.revealStarted='true';
    await Promise.all([mountCostumes(group),wait(ALPACA_HIDDEN_HOLD_MS)]);
    group.classList.add('is-costumed');
    // Sortie en décalé de derrière le nom : Betty (3), Lauris (1), puis Jenni (2).
    ALPACA_EXIT_ORDER.forEach(([n,delay])=>window.setTimeout(()=>group.querySelector(`[data-alpaca="${n}"]`)?.classList.add('is-out'),delay));
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
function setupAlpacaBios(hero){
  const group=document.querySelector('.alpacas');
  const panel=document.querySelector('#alpaca-bio');
  const buttons=[...document.querySelectorAll('.alpaca[data-member]')];
  if(!group||!panel||!buttons.length)return;
  const art=group.closest('.art');
  const name=panel.querySelector('.alpaca-bio__name');
  const text=panel.querySelector('.alpaca-bio__text');
  let pinned=null;
  let hideTimer;
  // Sur mobile, la carte peut dépasser le bas de l'en-tête (coupé par overflow:hidden) : on réserve la place manquante.
  const fit=()=>{
    if(!art)return;
    art.style.marginBottom='';
    const home=art.closest('.home');
    if(!home||panel.hidden)return;
    // Sur ordinateur, la bulle se superpose sans décaler la mise en page ; sur mobile, on réserve sa place sous le logo.
    if(!matchMedia('(max-width: 900px)').matches)return;
    const overflow=panel.getBoundingClientRect().bottom-art.getBoundingClientRect().bottom+16;
    if(overflow>0)art.style.marginBottom=`${Math.ceil(overflow)}px`;
  };
  const show=button=>{
    window.clearTimeout(hideTimer);
    const member=(hero.members||[]).find(item=>item.id===button.dataset.member);
    if(!member)return;
    name.textContent=member.name;
    text.textContent=member.description;
    panel.hidden=false;
    panel.dataset.member=member.id;
    fit();
    requestAnimationFrame(()=>panel.classList.add('is-visible'));
    art?.classList.add('has-bio');
    buttons.forEach(item=>{
      const active=item===button;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-expanded',String(active));
    });
  };
  const hide=()=>{
    pinned=null;
    panel.classList.remove('is-visible');
    art?.classList.remove('has-bio');
    if(art)art.style.marginBottom='';
    buttons.forEach(item=>{item.classList.remove('is-active');item.setAttribute('aria-expanded','false')});
    hideTimer=window.setTimeout(()=>{if(!panel.classList.contains('is-visible'))panel.hidden=true},260);
  };
  const restore=()=>pinned?show(pinned):hide();
  buttons.forEach(button=>{
    button.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')show(button)});
    button.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')restore()});
    button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))show(button)});
    button.addEventListener('blur',()=>{if(!pinned)restore()});
    button.addEventListener('click',()=>{
      if(pinned===button){hide();return}
      pinned=button;
      show(button);
    });
  });
  group.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){hide();event.target.blur?.()}});
  if(document.alpacaBioOutside)document.removeEventListener('pointerdown',document.alpacaBioOutside);
  document.alpacaBioOutside=event=>{if(pinned&&!event.target.closest('.alpaca[data-member], #alpaca-bio'))hide()};
  document.addEventListener('pointerdown',document.alpacaBioOutside);
}
function setupTheme(){const button=document.querySelector('#theme'),meta=document.querySelector('meta[name="theme-color"]');const labels=activeCopy?.controls||{themeDark:'Activer le thème sombre',themeLight:'Activer le thème clair'};let theme=localStorage.getItem('ft-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');const apply=()=>{document.documentElement.dataset.theme=theme;button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label',theme==='dark'?labels.themeLight:labels.themeDark);meta.content=theme==='dark'?'#07101d':'#fbf8f2'};apply();button.onclick=()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('ft-theme',theme);apply()}}
function setupQr(){const d=document.querySelector('#qr-dialog'),o=document.querySelector('#qr-open'),c=document.querySelector('#qr-close');const close=()=>{d.classList.remove('is-open');setTimeout(()=>{if(d.open)d.close()},180)};o.onclick=()=>{d.showModal();requestAnimationFrame(()=>d.classList.add('is-open'));c.focus()};c.onclick=close;d.onclick=e=>{if(e.target===d)close()};d.addEventListener('cancel',e=>{e.preventDefault();close()})}

function setupContact(){
  const form=document.querySelector('#contact-form');
  const message=document.querySelector('#contact-message');
  const counter=document.querySelector('#contact-count');
  if(!form||!message||!counter)return;
  const button=form.querySelector('.contact-submit');
  const notice=form.querySelector('.contact-notice');
  const turnstileContainer=form.querySelector('#contact-turnstile');
  const turnstileSiteKey=turnstileContainer?.dataset.sitekey||'';
  let turnstileWidget;
  const labels={
    fr:{submit:'Envoyer le message',sending:'Envoi en cours…',success:'Merci, votre message a bien été envoyé.',error:'L’envoi a échoué. Réessayez dans quelques instants.',notice:'Réponse habituelle sous quelques jours.'},
    en:{submit:'Send message',sending:'Sending…',success:'Thank you, your message has been sent.',error:'Sending failed. Please try again shortly.',notice:'We usually reply within a few days.'}
  }[activeLocale]||{submit:activeCopy?.contact?.submit||'Send',sending:'Sending…',success:'Message sent.',error:'Sending failed. Please try again.',notice:''};
  const updateCount=()=>{counter.textContent=String(message.value.length)};
  message.addEventListener('input',updateCount);
  button.textContent=labels.submit;
  if(turnstileSiteKey){
    notice.textContent=labels.notice;
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;
    script.onload=()=>{turnstileWidget=window.turnstile.render(turnstileContainer,{sitekey:turnstileSiteKey,theme:'auto',callback:()=>{button.disabled=false},'expired-callback':()=>{button.disabled=true},'error-callback':()=>{button.disabled=true}});};
    document.head.append(script);
  }else{
    button.disabled=true;notice.textContent=activeLocale==='fr'?'Formulaire temporairement indisponible.':'Contact form temporarily unavailable.';
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    button.disabled=true;button.textContent=labels.sending;notice.textContent='';notice.className='contact-notice';
    const payload=Object.fromEntries(new FormData(form));
    payload.turnstileToken=window.turnstile?.getResponse(turnstileWidget)||'';
    if(!payload.turnstileToken){notice.textContent=activeLocale==='fr'?'Veuillez valider le contrôle anti-spam.':'Please complete the anti-spam check.';notice.classList.add('is-error');button.disabled=true;button.textContent=labels.submit;return;}
    try{
      const response=await fetch(CONTACT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok){
        const userErrors=activeLocale==='fr'
          ?{rate_limited:'Trop de tentatives. Réessayez dans une minute.',invalid_email:'Vérifiez votre adresse e-mail.',invalid_message:'Votre message doit contenir entre 10 et 255 caractères.',invalid_subject:'Choisissez un sujet dans la liste.'}
          :{rate_limited:'Too many attempts. Please try again in one minute.',invalid_email:'Please check your email address.',invalid_message:'Your message must be between 10 and 255 characters.',invalid_subject:'Please choose a subject from the list.'};
        throw new Error(userErrors[result.error]||labels.error);
      }
      form.reset();form.elements.startedAt.value=String(Date.now());updateCount();
      notice.textContent=labels.success;notice.classList.add('is-success');
    }catch(error){
      console.error(error);notice.textContent=error instanceof Error&&error.message?error.message:labels.error;notice.classList.add('is-error');
    }finally{window.turnstile?.reset(turnstileWidget);button.disabled=true;button.textContent=labels.submit;}
  });
  updateCount();
}

const localeFromUrl=()=>Object.keys(LOCALES).find(locale=>{const path=localePath(locale);return location.pathname===path||location.pathname===path.slice(0,-1)})||null;
const browserLocale=()=>{for(const value of [...(navigator.languages||[]),navigator.language].filter(Boolean)){const code=value.toLowerCase().split('-')[0];if(LOCALES[code])return code;}return 'fr';};
const isCrawler=()=>/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent||'');
const resolveLocale=()=>localeFromUrl()||browserLocale();
const localePath=locale=>new URL(locale+'/',SITE_ROOT).pathname;
async function setLocale(locale,{historyMode='none'}={}){
  if(!LOCALES[locale]||!siteConfig)return;const response=await fetch(I18N_URL(locale),{cache:'no-store'});if(!response.ok)throw new Error('Traduction indisponible ('+response.status+')');const copy=await response.json();
  if(historyMode!=='none')window.history[historyMode==='replace'?'replaceState':'pushState']({locale},'',localePath(locale)+location.search+location.hash);render(siteConfig,copy,locale);
}
async function boot(){const response=await fetch(CONFIG_URL,{cache:'no-store'});if(!response.ok)throw new Error('Configuration indisponible ('+response.status+')');siteConfig=await response.json();siteConfig.agenda=await fetch(AGENDA_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);const atRoot=!localeFromUrl(),crawler=isCrawler();const locale=atRoot&&crawler?'fr':resolveLocale();await setLocale(locale,{historyMode:atRoot&&!crawler?'replace':'none'});}
window.addEventListener('popstate',()=>{const locale=localeFromUrl()||resolveLocale();if(locale!==activeLocale)setLocale(locale);});
boot().catch(error=>{console.error(error);document.querySelector('#app').innerHTML='<p class="error">Le contenu de la préversion ne peut pas être chargé.</p>';});
