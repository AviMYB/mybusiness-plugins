import { config } from './config.js';
import { makeSeed, statuses } from './data.js';
import { catalog } from './catalog.js';
import { esc, options, field, icon, money } from './ui.js';
import gallery from './pages/gallery.js';
import records from './pages/records.js';
import dashboard from './pages/dashboard.js';
import settings from './pages/settings.js';
import kanban from './pages/kanban.js';
import calendar, { weekDates } from './pages/calendar.js';
import wizard from './pages/wizard.js';
import documentPage, { docTotal } from './pages/document.js';
import inbox from './pages/inbox.js';
import reports, { columns } from './pages/reports.js';
import importPage from './pages/import.js';
import activity from './pages/activity.js';
import knowledge, { articles } from './pages/knowledge.js';

const views = { gallery, records, dashboard, settings, kanban, calendar, wizard, document:documentPage, inbox, reports, import:importPage, activity, knowledge };
let state = makeSeed();
let storageWorks = true;
try {
  const saved = JSON.parse(localStorage.getItem(config.storageKey));
  if (saved && saved.version === 1 && ['records','events','messages','activities','requests'].every(k=>Array.isArray(saved[k])) && saved.settings && Array.isArray(saved.document?.rows)) state = saved;
} catch { storageWorks = false; }
const freshUI = () => ({ query:'', status:'', sort:1, page:1, size:10, owner:'',email:'',createdFrom:'',createdTo:'',settingsSection:'',dashboardTab:'', error:false, dashboardOwner:'', week:0, wizardStep:0, wizardDone:false, wizard:{title:'',email:'',owner:'צוות 1',date:'2026-09-23'}, document:structuredClone(state.document), inboxQuery:'', conversation:'conversation-1', drafts:{}, report:null, reportColumns:['name','status','amount'],reportStatus:'',importValidated:false, activityQuery:'',knowledgeQuery:'',knowledgeCategory:'' });
let ui = freshUI();
let page = '';
let toastTimer;
let lastFocus;
const main = document.querySelector('#main');
const dialog = document.querySelector('#dialog');
document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();});

function toast(text, force=false) {
  if (!force && !state.settings.notifications) return;
  clearTimeout(toastTimer);
  const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');
  toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);
}
function save(message) {
  if(message) state.activities.unshift({text:message,date:new Date().toISOString()});
  try { localStorage.setItem(config.storageKey,JSON.stringify(state)); storageWorks=true; }
  catch { storageWorks=false; }
  toast(storageWorks ? message || 'השינויים נשמרו' : 'האחסון אינו זמין — השינויים נשמרים עד סגירת העמוד בלבד.',!storageWorks);
}
function render() {
  const active=document.activeElement;
  const focusId=active?.id;
  const selection=active instanceof HTMLInputElement && ['text','search','email'].includes(active.type) ? [active.selectionStart,active.selectionEnd] : null;
  const nativeTitles={records:'לקוחות',dashboard:'מבט על',settings:'הגדרות',kanban:'מכירות',calendar:'יומן',activity:'פעילויות',reports:'דוחות'};
  document.body.dataset.page=page;
  document.querySelector('#page-title').innerHTML=icon(catalog.find(c=>c.id===page)?.icon||'grid')+' '+esc(nativeTitles[page]||catalog.find(c=>c.id===page)?.title||'ספריית התבניות');
  document.querySelector('#page-actions').innerHTML=page==='records'?'<button class="outline small" data-action="new-record">＋ לקוח חדש</button>':page==='kanban'?'<a class="outline small" href="#records">טבלה</a><button class="outline small" data-action="new-record">＋ מכירה חדשה</button>':'';
  document.title=(nativeTitles[page]||'ספריית התבניות')+' · MyBusiness · הדגמה';
  main.innerHTML=views[page]({state,ui});
  const navItems=[['dashboard','מבט-על','chart'],['records','לקוחות','building'],['kanban','מכירות','board'],['calendar','יומן','calendar'],['activity','פעילויות','clock'],['reports','דוחות','document'],['settings','הגדרות','settings']];
  document.querySelector('#navigation').innerHTML=navItems.map(([id,title,i])=>`<a href="#${id}" ${page===id?'aria-current="page"':''}><span class="nav-icon">${icon(i)}</span>${title}</a>`).join('')+'<div class="nav-bottom"><a href="#gallery">← ספריית התבניות</a></div>';
  if(focusId){const el=document.getElementById(focusId);if(el){el.focus();if(selection&&el.setSelectionRange)try{el.setSelectionRange(...selection);}catch{}}}
}
function navigate() {
  const target=location.hash.slice(1) || (state.settings.summary ? 'dashboard' : config.initialPage);
  const next=Object.hasOwn(views,target)?target:'gallery';
  if(page!==next){if(next==='document')ui.document=structuredClone(state.document);page=next;render();window.scrollTo(0,0);main.focus({preventScroll:true});}
}
function closeDialog() { dialog.close(); if(lastFocus?.isConnected)lastFocus.focus(); else main.focus({preventScroll:true}); }
function openDialog(title,body,sheet=false) {
  dialog.classList.toggle("record-sheet",sheet);
  lastFocus=document.activeElement;
  dialog.innerHTML=`<div class="dialog-head"><h2 id="dialog-title" style="margin:0">${esc(title)}</h2><button class="quiet" data-action="close-dialog" aria-label="סגירה">×</button></div><div class="dialog-body">${body}</div>`;
  dialog.showModal();
  (dialog.querySelector('input,select,textarea')||dialog.querySelector('button')).focus();
}
dialog.addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
dialog.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const items=Array.from(dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')).filter(el=>!el.hidden);
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
function recordDialog(id) {
 const r=state.records.find(r=>r.id===id)||{name:'',email:'',status:'חדש',owner:state.settings.owner,amount:0,note:'',date:new Date().toISOString().slice(0,10)};
 openDialog(id?'לקוח: '+r.name:'לקוח חדש',`<form data-form="record" data-id="${id||''}"><div class="record-sheet-layout"><section class="record-fields"><h3 class="underlined">פרטי לקוח</h3><div class="form-grid">${field('שם הארגון','name',r.name,'required maxlength="80"')}${field('אימייל לדוגמה','email',r.email,'type="email" required maxlength="120"')}<label class="field"><span>סטטוס לקוח</span><select name="status">${options(statuses,r.status)}</select></label><label class="field"><span>מנהל לקוח</span><select name="owner">${options(['צוות 1','צוות 2','צוות 3'],r.owner)}</select></label>${field('סכום לדוגמה','amount',r.amount,'type="number" min="0" max="9999999" required')}${field('תאריך יצירה','date',r.date,'type="date" required')}</div><label class="field note-field"><span>הערות</span><textarea name="note" maxlength="1000">${esc(r.note)}</textarea></label><div class="native-tabs" role="tablist" aria-label="מידע נוסף"><button type="button" role="tab" aria-selected="true" data-action="record-tab" data-tab="activity">פעילויות</button><button type="button" role="tab" aria-selected="false" data-action="record-tab" data-tab="details">פרטים נוספים</button></div><div id="record-related"><p class="muted">הפעילויות האחרונות מוצגות בציר הזמן.</p></div></section><aside class="record-timeline"><h3>ציר זמן</h3><div class="timeline">${state.activities.slice(0,5).map(a=>`<div class="timeline-item"><small>${esc(a.date.slice(0,10))}</small><p>${esc(a.text)}</p></div>`).join('')}</div></aside></div><div class="record-savebar"><span>עריכה</span><div class="actions"><button type="button" class="outline" data-action="close-dialog">ביטול</button><button name="saveMode" value="stay" class="outline">שמור</button><button name="saveMode" value="close">שמור וסגור</button></div></div></form>`,true);
}
function eventDialog(id) {
  const e=state.events.find(e=>e.id===id)||{title:'',date:weekDates(ui.week)[0],time:'10:00'};
  openDialog(id?'פרטי פגישה':'פגישה חדשה',`<form data-form="event" data-id="${id||''}"><div class="form-grid">${field('שם הפגישה','title',e.title,'required maxlength="80"')}${field('תאריך','date',e.date,'type="date" required')}${field('שעה (08:00–20:00)','time',e.time,'type="time" min="08:00" max="20:00" required')}</div><div class="form-actions"><button type="button" class="outline" data-action="close-dialog">ביטול</button><button>שמירת פגישה</button></div></form>`);
}
function moveRecord(id,status) {const r=state.records.find(r=>r.id===id);if(r&&statuses.includes(status)&&r.status!==status){r.status=status;save(`${r.name}: השלב שונה ל${status}`);render();}}
const actions={
 'search-records':()=>{ui.page=1;render();toast('תוצאות החיפוש עודכנו',true);},
 'clear-search':()=>{Object.assign(ui,{query:'',email:'',owner:'',status:'',createdFrom:'',createdTo:'',page:1});render();},
 'dashboard-tab':el=>{ui.dashboardTab=el.dataset.tab;render();},
 'settings-home':()=>{ui.settingsSection='';render();},
 'settings-section':el=>{const dest={accounts:'import',sales:'kanban',tasks:'wizard',calendar:'calendar',reports:'reports',knowledge:'knowledge',document:'document'}[el.dataset.section];if(dest)location.hash=dest;else{ui.settingsSection=el.dataset.section;render();}},
 'week-today':()=>{ui.week=0;render();},
 'record-tab':el=>{dialog.querySelectorAll('[data-action="record-tab"]').forEach(b=>b.setAttribute('aria-selected',String(b===el)));dialog.querySelector('#record-related').innerHTML=el.dataset.tab==='activity'?'<p class="muted">הפעילויות האחרונות מוצגות בציר הזמן.</p>':'<p class="muted">רשומת הדגמה מקומית. ניתן לערוך את פרטי הלקוח וההערות בטופס.</p>';},
 'new-record':()=>recordDialog(), 'edit-record':el=>recordDialog(el.dataset.id),
 'close-dialog':closeDialog, 'sort':()=>{ui.sort*=-1;render();},
 'next':()=>{ui.page++;render();}, 'previous':()=>{ui.page=Math.max(1,ui.page-1);render();},
 'toggle-error':()=>{ui.error=!ui.error;render();},
 'cancel-settings':()=>{render();toast('השינויים בוטלו',true);},
 'week-prev':()=>{ui.week--;render();},'week-next':()=>{ui.week++;render();},
 'new-event':()=>eventDialog(), 'edit-event':el=>eventDialog(el.dataset.id),
 'wizard-back':()=>{Object.assign(ui.wizard,Object.fromEntries(new FormData(main.querySelector('form'))));ui.wizardStep--;render();},
 'wizard-restart':()=>{ui.wizard=freshUI().wizard;ui.wizardStep=0;ui.wizardDone=false;render();},
 'add-line':()=>{ui.document.rows.push({name:'פריט לדוגמה',quantity:1,price:0});render();},
 'remove-line':el=>{if(ui.document.rows.length>1)ui.document.rows.splice(Number(el.dataset.index),1);render();},
 'cancel-document':()=>{ui.document=structuredClone(state.document);render();toast('השינויים בוטלו',true);},
 'conversation':el=>{ui.conversation=el.dataset.id;const c=state.messages.find(c=>c.id===ui.conversation);c.unread=false;render();},
 'export-report':()=>{
   if(!ui.report)return;
   const cell=value=>{let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
   const csv=[ui.report.columns.map(k=>columns[k]),...ui.report.rows.map(r=>ui.report.columns.map(k=>r[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
   const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='demo-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('הדוח יוצא לקובץ מקומי');
 },
 'validate-import':()=>{ui.importValidated=true;render();}, 'cancel-import':()=>{ui.importValidated=false;render();},
 'commit-import':()=>{if(state.imported||!ui.importValidated)return;for(let i=1;i<=2;i++)state.records.push({id:`import-demo-${i}`,name:`ארגון מיובא 0${i}`,email:`import${i}@example.com`,owner:state.settings.owner,status:'חדש',amount:0,note:'',date:'2026-09-20'});state.imported=true;save('נקלטו 2 רשומות לדוגמה');render();},
 'article':el=>{const a=articles.find(a=>a.id===el.dataset.id);openDialog(a.title,`<article class="article"><p>${esc(a.text)}</p><button class="outline" data-action="close-dialog">סגירה</button></article>`);},
 'confirm-reset':()=>{state=makeSeed();ui=freshUI();try{localStorage.removeItem(config.storageKey);}catch{}closeDialog();save();render();toast('נתוני ההדגמה אופסו',true);}
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el&&!el.disabled&&actions[el.dataset.action])actions[el.dataset.action](el);});
document.querySelector('#reset').addEventListener('click',()=>openDialog('איפוס ההדגמה',`<p>כל השינויים שבוצעו בהדגמה הזו יוחלפו בנתוני ההתחלה הפיקטיביים.</p><div class="form-actions"><button class="outline" data-action="close-dialog">ביטול</button><button data-action="confirm-reset">איפוס נתוני הדגמה</button></div>`));
function onField(e) {
  const el=e.target, key=el.dataset.field;if(!key)return;
  if(el.tagName==='SELECT'&&e.type!=='change')return;
  if(el.tagName!=='SELECT'&&e.type==='change')return;
  if(key==='move'){moveRecord(el.dataset.id,el.value);return;}
  if(key==='messageDraft'){ui.drafts[ui.conversation]=el.value;return;}
  if(key==='doc-title'){ui.document.title=el.value;return;}
  if(key==='doc-row'||key==='doc-discount'){
    if(key==='doc-discount')ui.document.discount=Number(el.value);
    else ui.document.rows[Number(el.dataset.index)][el.dataset.key]=el.dataset.key==='name'?el.value:Number(el.value);
    document.querySelector('#doc-total').textContent=money(docTotal(ui.document));
    document.querySelectorAll('[data-line-total]').forEach(td=>{const r=ui.document.rows[Number(td.dataset.lineTotal)];td.textContent=money(r.quantity*r.price);});return;
  }
  ui[key]=key==='size'?Number(el.value):el.value;
  if(['query','status','size','email','owner','createdFrom','createdTo'].includes(key))ui.page=1;
  render();
}
main.addEventListener('input',onField);main.addEventListener('change',onField);
document.addEventListener('submit',e=>{
  const form=e.target,kind=form.dataset.form;if(!kind)return;e.preventDefault();
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));
  if(['record','event','wizard','message','document'].includes(kind)){
    const requiredText=Array.from(form.querySelectorAll('[required]')).filter(el=>el.tagName==='TEXTAREA'||el.type==='text');
    const blank=requiredText.find(el=>!el.value.trim());
    if(blank){blank.setCustomValidity('יש להזין תוכן בשדה.');blank.reportValidity();blank.addEventListener('input',()=>blank.setCustomValidity(''),{once:true});return;}
  }
  if(kind==='record'){
    const old=state.records.find(r=>r.id===form.dataset.id);const r={...data,name:data.name.trim(),email:data.email.trim(),amount:Number(data.amount)};
    if(old)Object.assign(old,r);else{r.id='demo-'+crypto.randomUUID();state.records.unshift(r);form.dataset.id=r.id;}
    save(`נשמרה רשומה: ${r.name}`);if(e.submitter?.value!=='stay')closeDialog();else dialog.querySelector('#dialog-title').textContent='לקוח: '+r.name;render();
  } else if(kind==='event'){
    const old=state.events.find(r=>r.id===form.dataset.id);if(old)Object.assign(old,data);else state.events.push({...data,id:'event-'+crypto.randomUUID()});
    save(`נשמרה פגישה: ${data.title}`);closeDialog();render();
  } else if(kind==='settings'){
    state.settings={owner:data.owner,notifications:data.notifications==='on',summary:data.summary==='on'};save('ההעדפות נשמרו');toast('ההעדפות נשמרו',true);
  } else if(kind==='wizard'){
    Object.assign(ui.wizard,data);
    if(ui.wizardStep<2)ui.wizardStep++;else{state.requests.push({...ui.wizard,id:'request-'+crypto.randomUUID()});save(`הושלם תהליך: ${ui.wizard.title}`);ui.wizardDone=true;}render();
  } else if(kind==='document'){
    state.document=structuredClone(ui.document);save(`נשמרה טיוטה: ${state.document.title}`);render();
  } else if(kind==='message'){
    const c=state.messages.find(c=>c.id===ui.conversation)||state.messages[0];c.messages.push({text:data.message.trim(),direction:'out'});ui.drafts[c.id]='';save('נוספה הודעה לשיחת ההדגמה');render();
  } else if(kind==='report'){
    const selected=new FormData(form).getAll('columns');if(!selected.length){document.querySelector('#report-error').hidden=false;return;}
    ui.reportColumns=selected;ui.reportStatus=data.status;ui.report={columns:selected,rows:structuredClone(state.records.filter(r=>!data.status||r.status===data.status))};render();
  }
});
main.addEventListener('dragstart',e=>{const card=e.target.closest('.board-card');if(card)e.dataTransfer.setData('text/plain',card.dataset.id);});
main.addEventListener('dragover',e=>{if(e.target.closest('[data-lane]'))e.preventDefault();});
main.addEventListener('drop',e=>{const lane=e.target.closest('[data-lane]');if(lane){e.preventDefault();moveRecord(e.dataTransfer.getData('text/plain'),lane.dataset.lane);}});
window.addEventListener('hashchange',navigate);
navigate();
if(!storageWorks)toast('האחסון המקומי אינו זמין. ניתן להמשיך בהדגמה במצב זמני.',true);
