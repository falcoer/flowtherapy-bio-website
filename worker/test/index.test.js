import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorker,validate} from '../src/worker.js';

class FakeEmailMessage{constructor(from,to,raw){this.from=from;this.to=to;this.raw=raw}}
const worker=createWorker(FakeEmailMessage,async()=>Response.json({success:true,hostname:'flowtherapymusic.com'}));

const valid=(overrides={})=>({subject:'booking',email:'artist@example.com',phone:'+33 6 00 00 00 00',message:'Bonjour, nous souhaitons programmer Flow Therapy.',company:'',startedAt:String(Date.now()-5000),turnstileToken:'valid-test-token',...overrides});
const request=(body,origin='https://flowtherapymusic.com')=>new Request('https://flowtherapymusic.com/api/contact',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.1'},body:JSON.stringify(body)});

test('validates accepted payload',()=>assert.equal(typeof validate(valid()),'object'));
test('rejects honeypot and invalid fields',()=>{assert.equal(validate(valid({company:'bot'})),'spam');assert.equal(validate(valid({email:'bad'})),'invalid_email');assert.equal(validate(valid({message:'short'})),'invalid_message')});
test('rejects origins outside the site',async()=>assert.equal((await worker.fetch(request(valid(),'https://evil.example'),{})).status,403));
test('sends a valid message to the contact alias',async()=>{
  let sent;
  const env={TURNSTILE_SECRET:'secret',CONTACT_RATE_LIMIT:{limit:async()=>({success:true})},EMAIL:{send:async message=>{sent=message;return {messageId:'test'}}}};
  const response=await worker.fetch(request(valid()),env);
  assert.equal(response.status,202);assert.equal(sent.to,'flowtherapymusic@gmail.com');assert.match(sent.raw,/Reply-To: artist@example.com/);assert.match(sent.raw,/From: Flow Therapy <contact@flowtherapymusic.com>/);
});
test('rate limits before sending',async()=>{
  const env={TURNSTILE_SECRET:'secret',CONTACT_RATE_LIMIT:{limit:async()=>({success:false})},EMAIL:{send:async()=>assert.fail('must not send')}};
  assert.equal((await worker.fetch(request(valid()),env)).status,429);
});
test('requires a successful Turnstile verification',async()=>{
  const guarded=createWorker(FakeEmailMessage,async()=>Response.json({success:false}));
  const env={TURNSTILE_SECRET:'secret',CONTACT_RATE_LIMIT:{limit:async()=>({success:true})},EMAIL:{send:async()=>assert.fail('must not send')}};
  assert.equal((await guarded.fetch(request(valid()),env)).status,403);
});
