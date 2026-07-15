# Output Contract — Fit-Gap Report

> Render with `../../myb-p-kb/assets/doc-template.html`, {{DOC_TYPE}}="ניתוח התאמה ופערים — Fit-Gap". Hebrew. Files: `index.html` + `fit-gap.csv`.

## 1. Report sections

| # | Section | Content | S | M/L |
|---|---|---|---|---|
| 1 | תקציר מנהלים | `.kpi-row`: REQ count · per-class counts (chips) · tier · effort rollup · in-scope/phase-2/out counts; one-paragraph recommendation | ✔ | ✔ |
| 2 | עקרון העבודה | 3 lines: fit-to-standard first, ladder, evidence-based — so the customer understands the philosophy | ✔ | ✔ |
| 3 | טבלת הסיווג המלאה | the workbook (§2 below) as a styled table; class as colored chip; effort as chip s/m/l/xl. **Preceded by a legend (מקרא) and an interactive filter bar — both mandatory; see §5.** Rows carry `data-*` attributes and each process group is wrapped in a `.domain-block` so the filter can hide empty groups | ✔ | ✔ |
| 4 | רישום פערים (Gap register) | per Gap/Custom row: linked process, business need, disposition + justification (decision factors), connected-process impact, resolution | inline in table | ✔ dedicated |
| 5 | חלוקה לשלבים | now / שלב ב' (+revisit dates) / out — with effort per phase | ✔ | ✔ |
| 6 | פריטים הדורשים החלטת לקוח | the explicit ask list: paid items for גורם מאשר approval, process-change agreements, deferred wishes | ✔ | ✔ |
| 7 | הנחות וסיכונים | incl. expiring claims used ("בהנחה שפיצ'ר X שב-QA ישוחרר") | ✔ | ✔ |
| 8 | אישור | scope sign-off block | ✔ | ✔ |

Order the classification table by **process/event** (catalog-ordered, not REQ-number-ordered) — the customer reads processes, not IDs.

## 2. Workbook schema (HTML table + `fit-gap.csv` — identical columns)

```
REQ ID,Process,Requirement (HE),Priority,Class,Disposition,Solution sketch,Evidence (matrix/blueprint/demo),Components,Effort,Owner,Dev-consult,Risk/Limitations,Decision,Phase,Actual effort,Variance note
```

- `Class`: Native/Config/Custom-JS/Custom-Server/External/Gap (chips: native/config/custom-js/custom-server/external/gap).
- `Disposition`: empty, or Process-change / Defer(date) / Workaround / Descope.
- `Evidence`: the citation — matrix row title, blueprint #, or "demo: works-as-is" — **mandatory, no exceptions**.
- `Components`: tables/pages/triggers/roles… touched (feeds spec grouping).
- `Decision`: In scope / Phase 2 / Workaround / Out — must be filled before the doc leaves draft.
- `Actual effort`,`Variance note`: empty at authoring — **`build` fills them at its completion gate** (per-REQ rollup from the build-ledger, joined on REQ ID); variances >1 size class feed back into the estimation anchors.
- CSV is the **contract with `functional-spec`** — exact header, UTF-8.

## 3. Visual rules

- Class chip colors come from the template (`.chip.native` green → `.chip.gap` red) — never restyle.
- Gap rows: add `.warn` callout with the written resolution under the table (S) or in the gap register (M/L).
- Items pending customer decision: `.chip.open` + collected in section 6 (the ask list is the meeting agenda).
- KPI numbers in section 1 must equal the table's actual counts — compute, don't estimate.
- **Legend + interactive filter are mandatory** (every report, S and M/L) — see §5 for the drop-in snippet.

## 4. Handoff message (end of run)

Report to the user: file locations; per-class counts; tier; total effort by phase; the dev-consult list; the customer-decision list; and the single next action ("לקבוע פגישת סקופ עם הלקוח" / "להריץ functional-spec על השורות שאושרו").

## 5. Interactive filter & legend (MANDATORY in every report)

The classification table must be **client-usable live**: a legend that decodes every chip value, and a filter bar that slices the table by priority / class / effort / decision / domain + free-text, hiding empty process groups and showing a visible-count. Both render inside `<main>` (the doc-template has no script hook, so an inline `<script>` at the end of the content is correct and works).

**Data contract** — when emitting the classification table:
- each row: `<tr data-priority="…" data-class="…" data-effort="…" data-decision="…" data-domain="…">` (raw values: Hebrew priority, `Custom-Server` etc., `S|M|L|XL`, `In scope` etc., domain name);
- each process/domain group wrapped: `<div class="domain-block" data-domain="…"> <h3>…</h3> <table>…</table> </div>` (lets the JS hide groups that filter to zero rows).

**Drop-in snippet** (place the legend+bar immediately before the table; place the script once at the end of the content). Build the `<select>` option lists from the actual values present.

```html
<style>
  .fg-legend{background:var(--soft);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin:14px 0;font-size:13px;line-height:2.1}
  .fg-filter{position:sticky;top:0;z-index:5;background:#fff;border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin:14px 0;display:flex;gap:12px;flex-wrap:wrap;align-items:center;box-shadow:0 2px 10px rgba(0,0,32,.07)}
  .fg-filter label{font-size:13px;color:var(--navy2);font-weight:600;display:flex;gap:5px;align-items:center}
  .fg-filter select,.fg-filter input{font:inherit;font-size:13px;padding:4px 8px;border:1px solid var(--border);border-radius:6px}
  .fg-filter button{font:inherit;font-size:13px;padding:5px 12px;border:none;border-radius:6px;background:var(--navy2);color:#fff;cursor:pointer}
  #fgCount{font-size:13px;color:var(--muted);font-weight:600;margin-inline-start:auto}
  @media print{.fg-filter{display:none}}
</style>
<div class="fg-legend">
  <b>מקרא — סיווג (Class), מהזול ליקר:</b>
  <span class="chip native">Native</span> עובד מהקופסה/הגדרה ·
  <span class="chip config">Config</span> ללא-קוד (שדות/דפים/תצוגות/טריגרים/חוקי-טופס/הרשאות/מונחים) ·
  <span class="chip custom-js">Custom-JS</span> JS/CSS ברמת דף ·
  <span class="chip custom-server">Custom-Server</span> פונקציית-שרת (טיקט פיתוח) ·
  <span class="chip external">External</span> שירות חיצוני (Make/Zapier/ERP) ·
  <span class="chip gap">Gap</span> אין מענה מקובל היום<br>
  <b>עדיפות:</b> <span class="chip must">חובה</span> <span class="chip should">רצוי</span> <span class="chip nice">אפשרי</span>
  &nbsp;|&nbsp; <b>מאמץ:</b> <span class="chip s">S</span> ≤שעה · <span class="chip m">M</span> חצי-יום · <span class="chip l">L</span> 1–2 ימים · <span class="chip xl">XL</span> 3+ ימים (מפתח)
  &nbsp;|&nbsp; <b>ייעוץ-מפתח</b> = דורש התייעצות/אישור מפתח<br>
  <b>החלטה:</b> In scope (שלב א') · Phase 2 (שלב ב') · Workaround · Out (מחוץ לתכולה)
  &nbsp;|&nbsp; <b>דיספוזיציה:</b> Process-change · Defer · Descope · Workaround
</div>
<div class="fg-filter" id="fgFilter">
  <b>סינון:</b>
  <label>עדיפות <select data-f="priority"><option value="">הכל</option><!-- חובה/רצוי/אפשרי --></select></label>
  <label>סיווג <select data-f="class"><option value="">הכל</option><!-- Native…Gap --></select></label>
  <label>מאמץ <select data-f="effort"><option value="">הכל</option><!-- S/M/L/XL --></select></label>
  <label>החלטה <select data-f="decision"><option value="">הכל</option><!-- In scope… --></select></label>
  <label>דומיין <select data-f="domain"><option value="">הכל</option><!-- domains --></select></label>
  <input type="search" data-f="text" placeholder="חיפוש חופשי…">
  <button id="fgReset" type="button">ניקוי</button><span id="fgCount"></span>
</div>
<!-- …classification table (domain-blocks with data-* rows)… -->
<script>
(function(){
  var bar=document.getElementById('fgFilter'); if(!bar) return;
  var rows=[].slice.call(document.querySelectorAll('tr[data-class]'));
  var blocks=[].slice.call(document.querySelectorAll('.domain-block'));
  var sels=[].slice.call(bar.querySelectorAll('[data-f]'));
  var keys=['priority','class','effort','decision','domain'];
  function apply(){
    var f={}; sels.forEach(function(s){ f[s.getAttribute('data-f')]=(s.value||'').trim().toLowerCase(); });
    var vis=0;
    rows.forEach(function(tr){
      var ok=true;
      keys.forEach(function(k){ if(f[k] && (tr.getAttribute('data-'+k)||'').toLowerCase()!==f[k]) ok=false; });
      if(f.text && (tr.textContent||'').toLowerCase().indexOf(f.text)===-1) ok=false;
      tr.style.display=ok?'':'none'; if(ok)vis++;
    });
    blocks.forEach(function(b){
      var n=[].slice.call(b.querySelectorAll('tr[data-class]')).filter(function(r){return r.style.display!=='none';}).length;
      b.style.display=n?'':'none';
    });
    var c=document.getElementById('fgCount'); if(c) c.textContent='מציג '+vis+' מתוך '+rows.length+' דרישות';
  }
  sels.forEach(function(s){ s.addEventListener('input',apply); s.addEventListener('change',apply); });
  var rb=document.getElementById('fgReset'); if(rb) rb.addEventListener('click',function(){ sels.forEach(function(s){s.value='';}); apply(); });
  apply();
})();
</script>
```

Reference implementation pattern: a small `build-fitgap-html.js` that composes `filterAndLegend()` + `FILTER_JS` + `classTable()` with `data-*` attributes.
