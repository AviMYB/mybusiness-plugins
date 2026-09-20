export const statuses = ['חדש', 'בטיפול', 'הושלם'];
export function makeSeed() {
  return {
    version: 1,
    records: Array.from({ length: 18 }, (_, i) => ({ id: `demo-${i + 1}`, name: `ארגון לדוגמה ${String(i + 1).padStart(2, '0')}`, email: `demo${i + 1}@example.com`, owner: `צוות ${i % 3 + 1}`, status: statuses[i % 3], amount: (i + 1) * 450, note: '', date: `2026-09-${String(14 + i % 7).padStart(2, '0')}` })),
    events: [{ id: 'event-1', title: 'פגישת היכרות לדוגמה', date: '2026-09-20', time: '10:00' }, { id: 'event-2', title: 'סקירת התהליך', date: '2026-09-22', time: '14:30' }],
    messages: [{ id: 'conversation-1', title: 'שיחה לדוגמה 01', unread: true, messages: [{ text: 'שלום, אשמח לדעת מה השלב הבא בתהליך.', direction: 'in' }] }, { id: 'conversation-2', title: 'שיחה לדוגמה 02', unread: false, messages: [{ text: 'תודה על העדכון, נוכל לתאם פגישה?', direction: 'in' }] }],
    settings: { notifications: true, owner: 'צוות 1', summary: false },
    document: { title: 'הצעת מחיר לדוגמה', discount: 0, rows: [{ name: 'שירות לדוגמה', quantity: 2, price: 450 }] },
    activities: [{ text: 'סביבת ההדגמה מוכנה', date: '2026-09-20T09:00:00' }],
    imported: false,
    requests: []
  };
}
