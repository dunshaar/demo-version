import {initHeroScanner} from './hero-scanner.mjs?v=20260930-speed';
import {initPrivacyUI} from './shared/privacy-ui.mjs?v=20260929-copy-form';
import {initRequestForm} from './request-form.mjs?v=20260929-copy-form';
initPrivacyUI();
initRequestForm();
// Prepare already requested photographs for a fast scroll without delaying content.
for(const image of document.querySelectorAll('img[loading="eager"][fetchpriority="low"]')){
 image.decode().catch(()=>{});
}
const $=selector=>document.querySelector(selector);
const menuButton=$('.menu-toggle'),navigation=$('#navigation');
function closeMenu(){navigation.classList.remove('is-open');menuButton.setAttribute('aria-expanded','false');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));navigation.classList.toggle('is-open',open);});
navigation.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('is-open')){closeMenu();menuButton.focus();}});
matchMedia('(min-width:1081px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const mediaDialog=$('#media-dialog'),player=$('#media-player'),reviewDialog=$('#review-dialog');
function showDialog(dialog){closeMenu();document.body.classList.add('modal-open');dialog.showModal();}
function stopVideo(){player.pause();player.removeAttribute('src');player.load();}
for(const dialog of document.querySelectorAll('dialog')){
 const close=()=>{if(dialog===mediaDialog)stopVideo();dialog.close();};
 dialog.querySelector('.close-dialog')?.addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)close();}});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(dialog===mediaDialog&&player.getAttribute('src'))stopVideo();});
}
const videos=new Set(['promo','dancefloor-36','stage','club']);
document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
 const name=button.dataset.video;if(!videos.has(name))return;
 $('#media-title').textContent=button.dataset.title;$('#media-error').hidden=true;
 player.poster=`/demo-version/assets/${name}-poster.webp`;player.src=`/demo-version/assets/${name}.mp4`;
 showDialog(mediaDialog);player.play().catch(()=>{});
}));
player.addEventListener('error',()=>{if(player.getAttribute('src'))$('#media-error').hidden=false;});
document.querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',()=>{
 $('#review-image').src=`/demo-version/assets/review-${button.dataset.review}.webp`;$('#review-image').alt=`Оригинальный скриншот: ${button.dataset.author}`;$('#review-title').textContent=button.dataset.author;showDialog(reviewDialog);
}));
const heroScanner=initHeroScanner($('.hero-scan'));
const systemMotion=matchMedia('(prefers-reduced-motion: reduce)');let paused=systemMotion.matches;
const motionIcons={play:'<svg class="ui-icon" data-icon="play" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m7 4 13 8-13 8Z" fill="currentColor"/demo-version/></svg>',pause:'<svg class="ui-icon" data-icon="pause" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4h3v16H7zm7 0h3v16h-3z" fill="currentColor"/demo-version/></svg>'};
function updateMotion(){
 document.documentElement.classList.toggle('motion-paused',paused);
 heroScanner.setPaused(paused);
 document.querySelectorAll('[data-motion-toggle]').forEach(button=>{button.disabled=systemMotion.matches;button.setAttribute('aria-pressed',String(paused));button.setAttribute('aria-label',systemMotion.matches?'Движение уменьшено в настройках устройства':paused?'Включить анимации':'Приостановить анимации');if(button.classList.contains('ribbon-motion'))button.firstElementChild.innerHTML=paused?motionIcons.play:motionIcons.pause;else button.textContent=systemMotion.matches?'Движение уменьшено в настройках устройства':paused?'Включить анимации':'Приостановить анимации';});
}
document.querySelectorAll('[data-motion-toggle]').forEach(button=>button.addEventListener('click',()=>{paused=!paused;updateMotion();}));
systemMotion.addEventListener('change',e=>{paused=e.matches;updateMotion();});updateMotion();
// Content is visible immediately; only decorative elements animate.
// One scheduled frame per scroll event: no permanent rendering loop.
let frame=0;
function updateScroll(){frame=0;const height=document.documentElement.scrollHeight-innerHeight;document.documentElement.style.setProperty('--reading-progress',height>0?scrollY/height:0);}
addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateScroll);},{passive:true});addEventListener('resize',()=>{if(!frame)frame=requestAnimationFrame(updateScroll);});updateScroll();
// Old bookmarked chooser links now open the standalone repertoire page.
if(location.hash==='#choose-songs')location.replace('/demo-version/repertoire/');
