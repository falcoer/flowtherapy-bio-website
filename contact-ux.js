const CONTACT_MIN_MESSAGE_LENGTH=10;

const messages={
  fr:{message:`Votre message doit contenir au moins ${CONTACT_MIN_MESSAGE_LENGTH} caractères.`,email:'Vérifiez votre adresse e-mail.',subject:'Choisissez un sujet dans la liste.'},
  en:{message:`Your message must contain at least ${CONTACT_MIN_MESSAGE_LENGTH} characters.`,email:'Please check your email address.',subject:'Please choose a subject from the list.'}
};

const labels=()=>messages[document.documentElement.lang]||messages.en;

function enhanceContactForm(form){
  if(form.dataset.contactUxEnhanced==='true')return;
  form.dataset.contactUxEnhanced='true';

  const message=form.querySelector('#contact-message');
  const notice=form.querySelector('.contact-notice');
  if(!message||!notice)return;

  message.minLength=CONTACT_MIN_MESSAGE_LENGTH;
  notice.tabIndex=-1;

  form.addEventListener('invalid',event=>{
    const field=event.target;
    const copy=labels();
    let text='';
    if(field.id==='contact-message')text=copy.message;
    else if(field.id==='contact-email')text=copy.email;
    else if(field.id==='contact-subject')text=copy.subject;
    if(!text)return;
    notice.textContent=text;
    notice.className='contact-notice is-error';
  },true);

  const observer=new MutationObserver(()=>{
    if(!notice.classList.contains('is-error')&&!notice.classList.contains('is-success'))return;
    notice.focus({preventScroll:true});
    notice.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
  });
  observer.observe(notice,{attributes:true,attributeFilter:['class']});
}

const enhance=()=>document.querySelectorAll('#contact-form').forEach(enhanceContactForm);
enhance();
new MutationObserver(enhance).observe(document.querySelector('#app'),{childList:true,subtree:true});
