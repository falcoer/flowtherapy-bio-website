const ALLOWED_ORIGINS=new Set(['https://flowtherapymusic.com','https://www.flowtherapymusic.com']);
const SUBJECTS=new Set(['booking','event','press','collaboration','pressKit','other']);
const MAX_BODY_BYTES=8192;
const EMAIL_PATTERN=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FROM='contact@flowtherapymusic.com';
const DESTINATION='flowtherapymusic@gmail.com';

const json=(body,status,origin,extraHeaders={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin',...extraHeaders}});
const clean=value=>typeof value==='string'?value.trim():'';

export function validate(payload,now=Date.now()){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return 'invalid_payload';
  const subject=clean(payload.subject),email=clean(payload.email),phone=clean(payload.phone),message=clean(payload.message),company=clean(payload.company);
  const startedAt=Number(payload.startedAt);
  if(company)return 'spam';
  if(!Number.isFinite(startedAt)||now-startedAt<3000||now-startedAt>7200000)return 'spam';
  if(!SUBJECTS.has(subject))return 'invalid_subject';
  if(email.length>254||!EMAIL_PATTERN.test(email))return 'invalid_email';
  if(phone.length>40)return 'invalid_phone';
  if(message.length<10||message.length>255)return 'invalid_message';
  return {subject,email,phone,message};
}

const encodeHeader=value=>`=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(value)))}?=`;
const makeRawEmail=(data,subjectLabel)=>[
  `From: Flow Therapy <${FROM}>`,`To: ${DESTINATION}`,`Reply-To: ${data.email}`,
  `Subject: ${encodeHeader(`[Site Flow Therapy] ${subjectLabel}`)}`,'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: 8bit','',
  'Nouvelle demande via flowtherapymusic.com','',`Sujet : ${subjectLabel}`,`E-mail : ${data.email}`,
  `Téléphone : ${data.phone||'Non renseigné'}`,'','Message :',data.message
].join('\r\n');

export const createWorker=EmailMessageClass=>({
  async fetch(request,env){
    const origin=request.headers.get('Origin')||'';
    if(!ALLOWED_ORIGINS.has(origin))return new Response('Forbidden',{status:403,headers:{'Cache-Control':'no-store'}});
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'}});
    if(request.method!=='POST')return json({error:'method_not_allowed'},405,origin,{Allow:'POST, OPTIONS'});
    if(new URL(request.url).pathname!=='/api/contact')return json({error:'not_found'},404,origin);
    const referer=request.headers.get('Referer');
    if(referer&&!ALLOWED_ORIGINS.has(new URL(referer).origin))return json({error:'forbidden_referer'},403,origin);
    const contentLength=Number(request.headers.get('Content-Length')||0);
    if(contentLength>MAX_BODY_BYTES)return json({error:'payload_too_large'},413,origin);
    if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return json({error:'unsupported_media_type'},415,origin);
    const raw=await request.text();
    if(new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES)return json({error:'payload_too_large'},413,origin);
    let payload;
    try{payload=JSON.parse(raw)}catch{return json({error:'invalid_json'},400,origin)}
    const data=validate(payload);
    if(typeof data==='string')return json({error:data},data==='spam'?400:422,origin);
    const rate=await env.CONTACT_RATE_LIMIT.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'});
    if(!rate.success)return json({error:'rate_limited'},429,origin,{'Retry-After':'60'});
    const labels={booking:'Concert / programmation',event:'Événement privé ou professionnel',press:'Presse / média',collaboration:'Collaboration artistique',pressKit:'Dossier de presse / fiche technique',other:'Autre demande'};
    try{
      await env.EMAIL.send(new EmailMessageClass(FROM,DESTINATION,makeRawEmail(data,labels[data.subject])));
      console.log(JSON.stringify({event:'contact_sent',subject:data.subject}));
      return json({ok:true},202,origin);
    }catch(error){
      console.error(JSON.stringify({event:'contact_send_failed',error:error instanceof Error?error.message:String(error)}));
      return json({error:'delivery_failed'},502,origin);
    }
  }
});
