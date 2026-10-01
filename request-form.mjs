import {previewFormConfig} from './preview-config.mjs?v=20261001-catalog110-recs';
import {attachPhoneMask} from './phone-input.mjs';
import {readRepertoireDraft} from './shared/preferences.mjs?v=20261001-catalog110-recs';
export async function initRequestForm(){
 const form=document.querySelector('#request-form');if(!form)return;
 const fields=document.querySelector('#request-fields'),button=document.querySelector('#request-submit'),status=document.querySelector('#request-status'),note=document.querySelector('#request-service-note'),retry=document.querySelector('#request-retry');
 const phone=attachPhoneMask(form.elements.contact);
 const withRepertoire=form.dataset.repertoire==='true';
 let config=null,pendingPayload=null,busy=false,settled=false,selectedLineup='';
 function say(message,kind='info'){status.textContent=message;status.dataset.kind=kind;}
 function validate(){
  const name=form.elements.name;name.setCustomValidity(name.value.trim()?'':'Укажите ваше имя');
  form.elements.contact.setCustomValidity(phone.getValue()?'':'Введите номер полностью: +7 и 10 цифр');
  form.elements.preferredChannel.setCustomValidity(['','phone','whatsapp','telegram','max'].includes(form.elements.preferredChannel.value)?'':'Выберите удобный способ связи');
  return form.reportValidity();
 }
 function payload(){
  const d=new FormData(form);const include=withRepertoire;
  return {requestId:crypto.randomUUID(),name:String(d.get('name')).trim(),contactMethod:'phone',contact:phone.getValue(),preferredChannel:String(d.get('preferredChannel')),eventType:'',date:String(d.get('date')||''),place:'',message:selectedLineup?`Состав: ${selectedLineup}`:'',includeRepertoire:include,...(include?{repertoire:{version:config.catalogVersion,choices:readRepertoireDraft()}}:{}),consent:{personalData:d.get('personalData')==='on',version:config.consentVersion},website:String(d.get('website')||''),csrfToken:config.csrfToken};
 }
 function lock(value){busy=value;fields.disabled=value||settled;button.disabled=value||!config?.enabled||settled;document.querySelector('#retry-request').disabled=value;form.setAttribute('aria-busy',String(value));}
 async function getConfig(){return {...previewFormConfig};}
 async function send(){
  if(busy||!pendingPayload||!config?.enabled)return;
  lock(true);retry.hidden=true;say('Отправляем заявку…');
  try{
   let response=await fetch('/demo-version/api/requests',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(pendingPayload),signal:AbortSignal.timeout(25000)});
   let result=await response.json();
   if(response.status===403&&result.code==='CSRF_INVALID'){
    config=await getConfig();if(!config.enabled)throw new Error('disabled');pendingPayload.csrfToken=config.csrfToken;
    response=await fetch('/demo-version/api/requests',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(pendingPayload),signal:AbortSignal.timeout(25000)});result=await response.json();
   }
   if(response.ok&&result.ok&&result.status==='delivered'){
    settled=true;say('Спасибо! Заявка отправлена. Свяжемся с вами по указанному контакту','success');note.textContent=`Номер заявки: ${result.requestId}`;if(!withRepertoire){form.reset();phone.sync();}pendingPayload=null;
   }else if(response.status===202&&result.status==='pending'){
    settled=true;say('Заявка сохранена, но подтверждение доставки ещё не получено. Не отправляйте её повторно','pending');note.textContent=`Номер заявки: ${result.requestId}. При необходимости свяжитесь с нами по контактам рядом`;
   }else if(result.code==='DELIVERY_FAILED'){
    settled=true;say('Заявка сохранена, но доставить её сейчас не удалось. Пожалуйста, свяжитесь с нами напрямую','error');note.textContent=`Номер заявки: ${result.requestId}`;
   }else if(response.status===503&&result.code!=='FORM_UNAVAILABLE'){throw new Error('temporary');}
   else if([400,403,409,413,415,429,503].includes(response.status)){
    say(result.message||'Не удалось отправить заявку. Проверьте данные и попробуйте позже','error');
    if(response.status===409){settled=true;note.textContent='Запрос с этим номером уже существует. Свяжитесь с нами напрямую';}
    else if(response.status!==429)pendingPayload=null;
    if(response.status===503){config.enabled=false;note.textContent='Пока можно связаться с нами напрямую по контактам рядом';}
   }else throw new Error('unknown');
  }catch{
   say('Не удалось подтвердить результат отправки. Проверьте соединение и повторите этот же запрос','error');retry.hidden=false;note.textContent='Содержимое заявки сохранено в этой вкладке. Повтор использует тот же номер заявки';
  }finally{
   lock(false);
   // After an ambiguous network result keep fields locked; retry sends the same frozen payload.
   if(!retry.hidden){fields.disabled=true;button.disabled=true;}
  }
 }
 form.addEventListener('submit',event=>{event.preventDefault();if(!config||busy||settled)return;if(!config.enabled){say('Это предварительная версия сайта. Отправка заявок пока не подключена','info');return;}if(!validate())return;if(!pendingPayload)pendingPayload=payload();send();});
 document.querySelector('#retry-request').addEventListener('click',send);
 form.addEventListener('reset',()=>queueMicrotask(()=>phone.sync()));
 form.addEventListener('input',event=>{event.target.setCustomValidity?.('');if(pendingPayload&&!busy&&!settled&&retry.hidden)pendingPayload=null;});
 document.querySelectorAll('[data-lineup]').forEach(link=>link.addEventListener('click',()=>{if(!fields.disabled)selectedLineup=link.dataset.lineup;}));
 try{config=await getConfig();fields.disabled=false;button.disabled=false;form.noValidate=!config.enabled;say('');note.textContent='';}
 catch{fields.disabled=false;button.disabled=true;say('Форма временно недоступна. Свяжитесь с нами по контактам рядом','error');}
 document.documentElement.dataset.requestReady='true';
}
