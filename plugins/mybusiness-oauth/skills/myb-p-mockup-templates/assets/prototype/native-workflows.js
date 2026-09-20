import {esc,field,options} from './ui.js';
import {activityTypes,activityStatuses} from './pages/activity.js';
import {reportFields,reportRows} from './pages/reports.js';

// Native screen composition; all data operations stay within this demo's state.
export function nativeWorkflows({getState,getUI,render,openDialog,closeDialog,save,toast}) {
 const dialog=document.querySelector('#dialog');
 let draft,reportTab='settings',availableField='',selectedField='';
 const teams=['צוות 1','צוות 2','צוות 3'];
 function activityDialog(id,copy=false) {
  const state=getState(),old=state.activityRecords.find(r=>r.id===id);
  const r=old?{...old}:{title:'',location:'',customer:'',contact:'',start:'2026-09-23T10:00',end:'2026-09-23T11:00',status:'נקבעה',type:'פגישה',owner:state.settings.owner,reminder:false,reminderTime:'בזמן'};
  if(copy)r.title+=' — עותק';
  const select=(label,name,values,value)=>`<label class="field"><span>${label}</span><select name="${name}">${options(values,value)}</select></label>`;
  openDialog(old&&!copy?'פעילות: '+r.title:'פעילות חדשה',`<form data-form="activity-record" data-id="${copy?'':esc(id||'')}"><section class="activity-fields"><h3 class="underlined">פרטי פעילות</h3><div class="form-grid">${field('כותרת *','title',r.title,'required maxlength="100"')}${field('מיקום','location',r.location,'maxlength="120"')}<label class="field"><span>משויך ללקוח</span><select name="customer"><option value="">בחרו לקוח</option>${state.records.map(x=>`<option value="${esc(x.id)}" ${r.customer===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label class="field"><span>משויך לאיש קשר</span><select name="contact" ${r.customer?'':'disabled'}><option value="">בחרו איש קשר</option><option ${r.contact?'selected':''}>איש קשר לדוגמה</option></select></label>${field('זמן התחלה *','start',r.start,'type="datetime-local" required')}${field('זמן סיום *','end',r.end,'type="datetime-local" required')}</div><div class="activity-reminder"><label><input type="checkbox" name="reminder" ${r.reminder?'checked':''}> הזכר לי</label><select name="reminderTime" aria-label="מועד תזכורת" ${r.reminder?'':'disabled'}>${options(['בזמן','1 שעה לפני','2 שעות לפני','3 שעות לפני'],r.reminderTime)}</select></div><h3 class="underlined">פרטים נוספים</h3><div class="form-grid">${select('סטטוס','status',['',...activityStatuses],r.status)}${select('סוג פעילות','type',activityTypes,r.type)}${select('אחראי','owner',teams,r.owner)}</div><label class="field activity-users"><span>משתמשים נוספים</span><input name="additionalUsers" value="${esc(r.additionalUsers||'')}" placeholder="שם צוות נוסף"></label><p class="muted">תזכורות ומשתתפים נשמרים בכרטיס ההדגמה.</p></section><div class="record-savebar"><span>עריכה</span><div class="actions"><button name="saveMode" value="stay" class="outline">שמור וערוך</button><button name="saveMode" value="close">שמור וסגור</button></div></div></form>`,true);
  dialog.classList.add('activity-sheet');
 }
 const fieldOptions=(fields,selected,blank=false)=>(blank?'<option value="">ללא</option>':'')+Object.entries(fields).map(([k,v])=>`<option value="${k}" ${selected===k?'selected':''}>${esc(v)}</option>`).join('');
 function reportEditor(id) {
  draft=structuredClone(getState().reports.find(r=>r.id===id)||{name:'',source:'records',columns:[],filters:[],labels:{},sort:'',desc:false,default:false});
  reportTab='settings';availableField='';selectedField='';
  openDialog('הגדרות דוח','');dialog.classList.add('report-editor');paintEditor();dialog.querySelector('[name=name]').focus();
 }
 function paintEditor() {
  const fields=reportFields[draft.source];
  const tabs=[['settings','הגדרות'],['columns','עמודות לטבלה'],['labels','הגדרת עמודות'],['filters','חיתוך'],['calculated','Calculated fields'],['sharing','שיתוף'],['schedule','Schedule']];
  let body='';
  if(reportTab==='settings')body=`<div class="report-setting-rows"><label>שם הדוח:<input name="name" value="${esc(draft.name)}" maxlength="100"></label><label>הבא נתונים מטבלה:<select name="source"><option value="records" ${draft.source==='records'?'selected':''}>לקוחות (Accounts)</option><option value="activityRecords" ${draft.source==='activityRecords'?'selected':''}>פעילויות (Activities)</option></select></label><label>הגדר דוח כברירת מחדל<input name="default" type="checkbox" ${draft.default?'checked':''}></label></div>`;
  if(reportTab==='columns')body=`<div class="field-transfer"><section><h3>שדות אפשריים:</h3><div class="field-list"><input name="fieldSearch" aria-label="חיפוש שדות" placeholder="Search"><div id="available-fields">${Object.entries(fields).filter(([k])=>!draft.columns.includes(k)).map(([k,v])=>`<button type="button" data-action="pick-field" data-key="${k}" class="${availableField===k?'selected':''}">${esc(v)}</button>`).join('')}</div></div></section><div class="transfer-actions"><button type="button" data-action="add-report-field" aria-label="הוספת שדה לתצוגה" ${availableField?'':'disabled'}>❮</button><button type="button" data-action="remove-report-field" aria-label="הסרת שדה מהתצוגה" ${selectedField?'':'disabled'}>❯</button></div><section><h3>שדות להצגה:</h3><div class="field-list">${draft.columns.map(k=>`<button type="button" data-action="pick-selected-field" data-key="${k}" class="${selectedField===k?'selected':''}">${esc(fields[k])}</button>`).join('')}</div></section></div>`;
  if(reportTab==='labels')body=draft.columns.length?`<div class="column-labels">${draft.columns.map(k=>`<label class="field"><span>${esc(fields[k])}</span><input name="label-${k}" value="${esc(draft.labels?.[k]||fields[k])}"></label>`).join('')}</div>`:'<p class="muted">בחרו תחילה שדות בלשונית עמודות לטבלה.</p>';
  if(reportTab==='filters')body=`<div class="report-rules">${draft.filters.map((r,i)=>`<div class="report-rule"><select name="rule-field-${i}" aria-label="שדה חיתוך ${i+1}">${fieldOptions(fields,r.field)}</select><select name="rule-operator-${i}" aria-label="תנאי חיתוך ${i+1}"><option value="eq" ${r.operator==='eq'?'selected':''}>שווה ל</option><option value="ne" ${r.operator==='ne'?'selected':''}>לא שווה ל</option><option value="contains" ${r.operator==='contains'?'selected':''}>מכיל</option></select><input name="rule-value-${i}" aria-label="ערך חיתוך ${i+1}" value="${esc(r.value)}"><button type="button" class="quiet" data-action="remove-report-rule" data-index="${i}" aria-label="הסרת תנאי ${i+1}">×</button></div>`).join('')}</div><button type="button" class="outline" data-action="add-report-rule">הוסף שדה חדש</button><div class="report-sort"><label class="field"><span>מיין לפי</span><select name="sort">${fieldOptions(fields,draft.sort,true)}</select></label><label><input name="desc" type="checkbox" ${draft.desc?'checked':''}> סדר יורד</label></div>`;
  dialog.querySelector('.dialog-body').innerHTML=`<form data-form="report-editor"><div class="native-tabs report-tabs" role="tablist" aria-label="הגדרות דוח">${tabs.map(([key,label],i)=>`<button type="button" role="tab" aria-selected="${reportTab===key}" data-action="report-tab" data-tab="${key}" ${i>3?'disabled title="מחוץ להיקף ההדגמה"':''}>${label}</button>`).join('')}</div><section class="report-tab-panel" role="tabpanel">${body}</section><p id="report-error" class="error" hidden></p><div class="report-editor-footer"><button type="button" data-action="report-back">❯ חזור</button><small class="muted">שדות מחושבים, שיתוף ותזמון מחוץ להיקף ההדגמה.</small><div class="actions"><button type="button" class="outline" data-action="close-dialog">סגור</button><button>✎ שמור</button></div></div></form>`;
  dialog.querySelector('[role=tab][aria-selected=true]')?.focus();
 }
 function exportReport() {
  const ui=getUI(),state=getState(),r=state.reports.find(r=>r.id===ui.reportId);if(!r)return;
  const cell=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  const csv=[r.columns.map(k=>r.labels?.[k]||reportFields[r.source][k]),...reportRows(state,r,ui.reportFilters).map(row=>r.columns.map(k=>row[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\ufeff',csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='demo-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('הדוח יוצא לקובץ מקומי');
 }
 const actions={
  'new-activity':()=>activityDialog(),'edit-activity':el=>activityDialog(el.dataset.id),'duplicate-activity':el=>activityDialog(el.dataset.id,true),
  'delete-activity':el=>{openDialog('מחיקת פעילות לדוגמה','<p>למחוק את הפעילות מההדגמה המקומית?</p><div class="form-actions"><button class="outline" data-action="close-dialog">ביטול</button><button data-action="confirm-delete-activity" data-id="'+esc(el.dataset.id)+'">מחיקה</button></div>');},
  'confirm-delete-activity':el=>{const state=getState();state.activityRecords=state.activityRecords.filter(r=>r.id!==el.dataset.id);save('הפעילות נמחקה מההדגמה');closeDialog();render();},
  'clear-activity':()=>{getUI().activityFilters={};getUI().activityPage=1;render();},
  'native-size':el=>{getUI()[el.dataset.prefix+'Size']=Number(el.dataset.size);getUI()[el.dataset.prefix+'Page']=1;render();},
  'native-page':el=>{getUI()[el.dataset.prefix+'Page']+=Number(el.dataset.step);render();},
  'report-menu':()=>{getUI().reportMenu=!getUI().reportMenu;render();},
  'select-report':el=>{Object.assign(getUI(),{reportId:el.dataset.id,reportMenu:false,reportFilters:{},reportsPage:1});render();},
  'new-report':()=>{getUI().reportMenu=false;render();reportEditor();},'edit-report':()=>reportEditor(getUI().reportId),
  'report-tab':el=>{reportTab=el.dataset.tab;paintEditor();},'report-back':()=>{const tabs=['settings','columns','labels','filters'];reportTab=tabs[Math.max(0,tabs.indexOf(reportTab)-1)];paintEditor();},
  'pick-field':el=>{availableField=el.dataset.key;paintEditor();},'pick-selected-field':el=>{selectedField=el.dataset.key;paintEditor();},
  'add-report-field':()=>{if(availableField&&!draft.columns.includes(availableField))draft.columns.push(availableField);availableField='';paintEditor();},
  'remove-report-field':()=>{draft.columns=draft.columns.filter(k=>k!==selectedField);selectedField='';paintEditor();},
  'add-report-rule':()=>{draft.filters.push({id:'filter-'+crypto.randomUUID(),field:Object.keys(reportFields[draft.source])[0],operator:'eq',value:''});paintEditor();},
  'remove-report-rule':el=>{draft.filters.splice(Number(el.dataset.index),1);paintEditor();},'export-report':exportReport
 };
 function onEdit(e) {
  const el=e.target,form=el.closest('form');if(!form)return;
  if(form.dataset.form==='activity-record'&&e.type==='change'){
   if(el.name==='customer'){form.elements.contact.disabled=!el.value;form.elements.contact.value='';}
   if(el.name==='reminder')form.elements.reminderTime.disabled=!el.checked;
   if(el.name==='start'||el.name==='end')form.elements.end.setCustomValidity('');
  }
  if(form.dataset.form!=='report-editor')return;
  const key=el.name;if(!key)return;
  if(key==='source'&&e.type==='change'){draft.source=el.value;draft.columns=[];draft.filters=[];draft.labels={};draft.sort='';availableField='';selectedField='';paintEditor();return;}
  if(key==='fieldSearch'){form.querySelectorAll('#available-fields button').forEach(b=>b.hidden=!b.textContent.includes(el.value));return;}
  if(key.startsWith('label-')){draft.labels??={};draft.labels[key.slice(6)]=el.value;return;}
  const rule=key.match(/^rule-(field|operator|value)-(\d+)$/);if(rule){draft.filters[Number(rule[2])][rule[1]]=el.value;return;}
  if(['name','default','sort','desc'].includes(key))draft[key]=el.type==='checkbox'?el.checked:el.value;
 }
 dialog.addEventListener('input',onEdit);dialog.addEventListener('change',onEdit);
 function submit(kind,form,data,event) {
  const state=getState(),ui=getUI();
  if(kind==='activity-search'){ui.activityFilters=data;ui.activityPage=1;render();return true;}
  if(kind==='report-search'){ui.reportFilters=data;ui.reportsPage=1;ui.reportMenu=false;render();return true;}
  if(kind==='activity-record'){
   if(data.end<data.start){form.elements.end.setCustomValidity('זמן הסיום צריך להיות אחרי זמן ההתחלה.');form.elements.end.reportValidity();return true;}
   const old=state.activityRecords.find(r=>r.id===form.dataset.id),r={...data,title:data.title.trim(),reminder:data.reminder==='on'};delete r.saveMode;
   if(old)Object.assign(old,r);else{r.id='activity-'+crypto.randomUUID();state.activityRecords.unshift(r);form.dataset.id=r.id;}
   save('נשמרה פעילות: '+r.title);if(event.submitter?.value!=='stay')closeDialog();else dialog.querySelector('#dialog-title').textContent='פעילות: '+r.title;render();return true;
  }
  if(kind==='report-editor'){
   if(!draft.name.trim()||!draft.columns.length){const err=dialog.querySelector('#report-error');err.textContent=!draft.name.trim()?'יש להזין שם דוח בלשונית הגדרות.':'יש לבחור לפחות שדה אחד בלשונית עמודות לטבלה.';err.hidden=false;return true;}
   draft.name=draft.name.trim();draft.id||='report-'+crypto.randomUUID();
   if(draft.default)state.reports.forEach(r=>r.default=false);
   const i=state.reports.findIndex(r=>r.id===draft.id);if(i<0)state.reports.push(structuredClone(draft));else state.reports[i]=structuredClone(draft);
   Object.assign(ui,{reportId:draft.id,reportFilters:{},reportsPage:1,reportMenu:false});save('הדוח נשמר בהדגמה');closeDialog();render();return true;
  }
  return false;
 }
 return {actions,submit};
}
