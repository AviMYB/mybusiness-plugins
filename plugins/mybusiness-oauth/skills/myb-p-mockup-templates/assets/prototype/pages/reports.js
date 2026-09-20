import { esc, options, money, empty } from '../ui.js';
import { statuses } from '../data.js';
export const columns = { name:'שם',status:'סטטוס',owner:'צוות',amount:'סכום' };
export default function reports({state,ui}) {
 const result=ui.report;
 return `<form class="card" data-form="report"><h2>הרכבת הדוח</h2><p class="muted">בחרו עמודות וסינון, ואז הריצו תצוגה מקדימה.</p><div class="checks">${Object.entries(columns).map(([key,label])=>`<label><input type="checkbox" name="columns" value="${key}" ${ui.reportColumns.includes(key)?'checked':''}>${label}</label>`).join('')}</div><div class="toolbar"><label class="field"><span>סטטוס</span><select name="status">${options(['',...statuses],ui.reportStatus)}</select></label><button>הרצת דוח</button></div><p id="report-error" class="error" hidden>יש לבחור לפחות עמודה אחת.</p></form>${result?`<section class="card"><div class="toolbar"><h2 class="grow">תוצאות · ${result.rows.length} רשומות</h2><button class="outline" data-action="export-report">ייצוא CSV</button></div>${result.rows.length?`<div class="table-wrap"><table><thead><tr>${result.columns.map(k=>`<th>${columns[k]}</th>`).join('')}</tr></thead><tbody>${result.rows.map(r=>`<tr>${result.columns.map(k=>`<td>${k==='amount'?money(r[k]):esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty()}</section>`:empty('מוכנים לבנות דוח','התוצאות יופיעו לאחר הרצה.')}`;
}
