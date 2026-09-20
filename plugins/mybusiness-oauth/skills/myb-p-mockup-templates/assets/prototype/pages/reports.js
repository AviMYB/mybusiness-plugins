import { esc } from '../ui.js';
import { nativePager, localDate } from './activity.js';
export const reportFields={records:{name:'שם',email:'אימייל',status:'סטטוס',owner:'אחראי',amount:'סכום',date:'נוצר בתאריך'},activityRecords:{title:'כותרת',customer:'לקוח - שם',owner:'אחראי',type:'סוג',status:'סטטוס',start:'זמן התחלה',end:'זמן סיום'}};
export function reportRows(state,report,filters) {
 if(!report)return [];
 let rows=state[report.source].map(r=>({...r,customer:state.records.find(x=>x.id===r.customer)?.name||''}));
 for(const rule of report.filters||[]) {
  const value=String(filters?.[rule.id]??rule.value??'');if(!value)continue;
  rows=rows.filter(r=>{const v=String(r[rule.field]??'');return rule.operator==='eq'?v===value:rule.operator==='ne'?v!==value:v.includes(value);});
 }
 if(report.sort)rows.sort((a,b)=>String(a[report.sort]??'').localeCompare(String(b[report.sort]??''),'he',{numeric:true})*(report.desc?-1:1));
 return rows;
}
export default function reports({state,ui}) {
 const report=state.reports.find(r=>r.id===ui.reportId),fields=report?reportFields[report.source]:{},rows=reportRows(state,report,ui.reportFilters),pager=nativePager(rows.length,ui,'reports');
 const menuGroup=shared=>state.reports.filter(r=>!!r.shared===shared).map(r=>`<button type="button" class="report-option" data-action="select-report" data-id="${esc(r.id)}">${esc(r.name)}</button>`).join('');
 return `<form data-form="report-search" class="record-search report-search"><div class="report-chooser"><button type="button" class="report-heading" data-action="report-menu" aria-expanded="${!!ui.reportMenu}">${esc(report?.name||'שם הדו"ח')} ▾</button>${ui.reportMenu?`<div class="report-menu"><p>הדוחות שלי</p>${menuGroup(false)||'<small>לא נמצאו דוחות</small>'}<p>דוחות משותפים</p>${menuGroup(true)}<div class="report-menu-footer"><button type="button" data-action="new-report">＋ צור דוח חדש</button></div></div>`:''}</div>${report?.filters?.length?`<div class="search-grid report-filter-grid">${report.filters.map(r=>`<label class="field"><span>${esc(fields[r.field])} ${r.operator==='eq'?'שווה ל':r.operator==='ne'?'לא שווה ל':'מכיל'}</span><input name="${esc(r.id)}" value="${esc(ui.reportFilters?.[r.id]??r.value)}"></label>`).join('')}</div>`:''}<div class="search-actions"><button>חפש</button>${report?'<button type="button" class="quiet" data-action="edit-report">הגדרות דוח</button><button type="button" class="quiet" data-action="export-report">ייצוא CSV</button>':''}</div></form><section class="record-results report-results"><div class="table-wrap"><table><thead><tr>${report?report.columns.map(k=>`<th>${esc(report.labels?.[k]||fields[k])}</th>`).join(''):'<th class="empty-report-heading"><span class="sr-only">תוצאות הדוח</span></th>'}</tr></thead><tbody>${report?rows.slice((ui.reportsPage-1)*(ui.reportsSize||10),ui.reportsPage*(ui.reportsSize||10)).map(r=>`<tr>${report.columns.map(k=>`<td>${esc(['start','end'].includes(k)?localDate(r[k]):r[k])}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${report.columns.length}" class="native-empty">אין רשומות התואמות לחיתוך</td></tr>`:''}</tbody></table></div>${pager}</section>`;
}
