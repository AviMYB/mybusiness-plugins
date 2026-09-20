import { esc, money, options } from '../ui.js';
import { statuses } from '../data.js';
export default function kanban({state}) {
 return `<div class="notice">אפשר לגרור כרטיס לשלב אחר או לבחור שלב מהרשימה שעל הכרטיס. השינוי מופיע גם ברשומות ובלוח הניהולי.</div><div class="board">${statuses.map(status=>{ const rows=state.records.filter(r=>r.status===status); return `<section class="lane" data-lane="${status}"><h2>${status}<span class="tag">${rows.length}</span></h2>${rows.map(r=>`<article class="board-card" draggable="true" data-id="${r.id}"><button class="quiet small" data-action="edit-record" data-id="${r.id}">${esc(r.name)}</button><p class="muted">${esc(r.owner)} · ${money(r.amount)}</p><label class="field"><span>שלב</span><select data-field="move" data-id="${r.id}" aria-label="שלב ${esc(r.name)}">${options(statuses,r.status)}</select></label></article>`).join('')}</section>`;}).join('')}</div>`;
}
