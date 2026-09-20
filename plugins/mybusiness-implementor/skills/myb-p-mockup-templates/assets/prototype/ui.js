export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
export const money = value => new Intl.NumberFormat('he-IL', { style:'currency', currency:'ILS', maximumFractionDigits:0 }).format(value);
export const options = (values, selected) => values.map(v => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(v || 'הכול')}</option>`).join('');
export const field = (label, name, value = '', extra = '') => `<label class="field"><span>${esc(label)}</span><input name="${name}" id="${name}" value="${esc(value)}" ${extra}></label>`;
export const empty = (title = 'אין רשומות להצגה', text = 'נסו לשנות את החיפוש או להוסיף רשומה חדשה.') => `<div class="empty"><h2>${title}</h2><p class="muted">${text}</p></div>`;
export function icon(name) {
  const paths = { edit:'M4 16l12-12 4 4L8 20H4zM14 6l4 4', people:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a6 6 0 0 1 12 0v3M17 4a4 4 0 0 1 0 8M17 15a5 5 0 0 1 5 5', building:'M5 21V3h14v18H5zM9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3', list:'M4 5h16M4 12h16M4 19h16', chart:'M4 20V11h4v9m4 0V4h4v16m4 0V8h2v12', settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6', board:'M3 4h5v16H3zM10 4h5v12h-5zM17 4h4v9h-4z', calendar:'M3 5h18v16H3zM3 10h18M8 3v4M16 3v4', flow:'M4 4h5v5H4zM15 15h5v5h-5zM9 6h8v9', document:'M5 3h10l4 4v14H5zM9 12h6M9 16h6', chat:'M3 4h18v13H9l-6 4zM7 9h10M7 13h6', upload:'M12 16V3M7 8l5-5 5 5M4 16v5h16v-5', clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5l4 3', book:'M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3zM12 6v15', grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.grid}"/></svg>`;
}
