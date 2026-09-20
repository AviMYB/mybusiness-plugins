import { esc, empty } from '../ui.js';
export default function activity({state,ui}) {
 const rows=state.activities.filter(a=>a.text.includes(ui.activityQuery));
 return `<div class="toolbar"><label class="field grow"><span>חיפוש בפעילות</span><input id="activity-query" data-field="activityQuery" value="${esc(ui.activityQuery)}" placeholder="לדוגמה: רשומה"></label></div><section class="card"><h2>מה השתנה בהדגמה</h2>${rows.length?`<div class="timeline">${rows.map(a=>`<article class="timeline-item"><p>${esc(a.text)}</p><time class="muted">${new Date(a.date).toLocaleString('he-IL')}</time></article>`).join('')}</div>`:empty('אין פעילות תואמת','נסו לשנות את החיפוש.')}</section>`;
}
