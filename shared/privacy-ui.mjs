const COOKIE_NAME='station_mir_cookie_notice';
const MAX_AGE=180*24*60*60;
let panel,openedBy;
function acknowledged(){
 try{return document.cookie.split(';').some(part=>part.trim()===`${COOKIE_NAME}=v1`);}catch{return false;}
}
function acknowledge(){
 try{document.cookie=`${COOKIE_NAME}=v1; Max-Age=${MAX_AGE}; Path=/demo-version/; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;}catch{}
}
export function initPrivacyUI(){
 if(panel)return;
 panel=document.createElement('section');panel.className='privacy-banner';panel.id='cookie-settings';panel.setAttribute('aria-labelledby','cookie-title');panel.hidden=true;
 panel.innerHTML='<div class="privacy-banner-copy"><h2 id="cookie-title">Файлы cookie</h2><p>Мы используем файлы cookie для сбора данных и улучшения работы сайта. Продолжая использовать сайт, вы соглашаетесь с нашей <a href="/demo-version/legal/privacy.html">Политикой обработки персональных данных</a>.</p></div><div class="privacy-banner-actions"><button type="button" data-cookie-ack>Принять cookie</button></div>';
 document.body.append(panel);
 function open(trigger){openedBy=trigger;panel.hidden=false;if(trigger)panel.querySelector('[data-cookie-ack]').focus({preventScroll:true});}
 document.addEventListener('click',event=>{const trigger=event.target.closest('[data-cookie-settings]');if(!trigger)return;event.preventDefault();open(trigger);});
 panel.querySelector('[data-cookie-ack]').addEventListener('click',()=>{acknowledge();panel.hidden=true;openedBy?.focus({preventScroll:true});openedBy=null;});
 if(!acknowledged()||location.hash==='#cookie-settings')open();
 addEventListener('hashchange',()=>{if(location.hash==='#cookie-settings')open();});
}
