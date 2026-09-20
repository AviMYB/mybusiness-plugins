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
    activityRecords: [{id:'activity-demo-1',title:'פגישת היכרות לדוגמה',customer:'demo-1',contact:'',owner:'צוות 1',type:'פגישה',status:'נקבעה',start:'2026-09-23T10:00',end:'2026-09-23T11:00',location:'משרד לדוגמה',reminder:false,reminderTime:'בזמן',additionalUsers:''}],
    reports: [{id:'report-demo-1',name:'לקוחות לדוגמה',source:'records',columns:['name','email','owner','status'],filters:[],labels:{},sort:'name',default:false,shared:false},{id:'report-demo-2',name:'פעילויות לדוגמה',source:'activityRecords',columns:['title','customer','owner','type','status','start'],filters:[],labels:{},sort:'start',default:false,shared:true}],
    imported: false,
    requests: []
  };
}
