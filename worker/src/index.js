import {EmailMessage} from 'cloudflare:email';
import {createWorker} from './worker.js';

export default createWorker(EmailMessage);
