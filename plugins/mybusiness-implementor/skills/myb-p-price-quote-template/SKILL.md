---
name: myb-p-price-quote-template
description: "יצירה ועריכה של תבניות הצעות מחיר (PDF Templates) במערכת MyBusiness CRM. השתמש בסקיל זה בכל פעם שלקוח רוצה: ליצור תבנית הצעת מחיר חדשה (branded quote template); לעצב מחדש תבנית קיימת עם לוגו, צבעי מותג ומבנה עמודות; לשכפל תבנית ולהתאים אותה לקהל/מוצר שונה (למשל מותג א' → מותג ב'); לפתור בעיות בתבנית קיימת (לוגו קטן, צבעים לא מוצגים ב-PDF, בלוק חתימה נראה); להוסיף לוגו, לחתוך אותו, להעלות אותו למערכת ולעדכן את התבנית; או להבין מה בתבנית הוא דינאמי (מהנתונים) ומה סטטי (תוכן קבוע). טריגרים: תבנית הצעת מחיר, עיצוב הצעת מחיר, לוגו בהצעת מחיר, שכפול תבנית הצעה, PDF template, quote template, price quote design, quote branding, PDFTemplate."
---

# יצירת תבניות הצעות מחיר — MyBusiness CRM

## סקירה כללית

תבניות הצעות מחיר ב-MyBusiness הן HTML מלא עם placeholder-ים דינאמיים שמוחלפים בנתוני המכירה בעת יצירת ה-PDF. התבנית רצה בתוך Webview בתוך עמוד ה-CRM, ולכן יש מגבלות ספציפיות שחשוב לדעת.

**פרטי אחסון:**
- טבלת תבניות: `PDFTemplate` (גישה דרך כלי ה-MCP בלבד — `Get-Data` / `Update-Data` / `Create-Update-Price-Quote-Template`)

---

## שלב 1: הבנת הצורך

לפני שמתחילים לכתוב HTML, אסוף את המידע הבא:

### מה לקרוא
- **קבצי Word (.docx)**: קרא עם `mammoth` — `cd /tmp && npm install mammoth && node -e "const mammoth = require('mammoth'); mammoth.extractRawText({path: 'PATH'}).then(r => console.log(r.value))"`
- **אימייל Outlook (.msg)**: קרא עם Python `extract_msg` — `pip install extract-msg && python -c "import extract_msg; msg = extract_msg.openMsg('PATH'); print(msg.htmlBody.decode())"`
- **תמונות בתיקייה**: בדוק קיום עם `ls` או `Glob`

### מה להבין לפני הכתיבה
1. **זהות המותג**: שם, צבעים, לוגו, שפה
2. **מבנה הצעת המחיר**: אילו שדות יש, מה הסדר
3. **מה דינאמי ומה סטטי** (ראה טבלה למטה)
4. **מה כבר קיים**: בדוק `Get-Price-Quote-Templates` לרשימת תבניות קיימות

### טבלת דינאמי vs סטטי

| דינאמי (מנתוני CRM) | סטטי (בתבנית) |
|---|---|
| שם לקוח, טלפון, מייל | טקסט שיווקי של המותג |
| מספר הצעה, תאריך | תנאים כלליים (כולל/לא כולל) |
| שמות מוצרים, תיאורים, כמויות | זמני אספקה |
| מחירים, סכומים, הנחות | פרטי חברה (כתובת, טלפון) |
| שם נציג חותם (למשל 'דנה') | מידות מוצרים סטנדרטיות |

### שדות שאסור לשים בהצעת מחיר ללקוח

הצעת מחיר היא מסמך **חיצוני שהלקוח רואה**. לכן:

**אסור להשתמש בשדות פנימיים:**
- `{{Sales.Probability}}` — הסתברות סגירה (שדה פנימי למנהל מכירות)
- `{{Sales.ReasonForLost}}` — סיבת כישלון
- `{{Sales.NextStepDate}}` — תאריך התקשרות הבא
- `{{Sales.IsWon}}` / `{{Sales.IsLost}}` — סטטוס פנימי
- כל שדה שמיועד לניהול פנימי ולא לעיני הלקוח

**זהירות עם שדות שעלולים להיות ריקים:**
- `{{SaleRows.Discount}}` — לא תמיד יש הנחה ברמת שורה. אם הערך ריק, ה-placeholder מוצג כטקסט גולמי ("{​{SaleRows.Discount}}") ב-PDF. **אל תוסיף עמודת הנחה בטבלת מוצרים** אלא אם בטוח שיש ערך. ההנחה הכוללת מוצגת בסיכום (`Sales.DiscountValue`).
- `{{SaleRows.Description}}` — יכול להיות ריק. אם משתמשים בו, יש לוודא שלפחות חלק מהמוצרים מכילים תיאור, אחרת עדיף להשמיט עמודה זו.
- ככלל: **אם placeholder עלול להיות ריק, עדיף לא לכלול אותו** או לשים אותו בעמודה שאפשר לוותר עליה.

### placeholder-ים בטוחים (תמיד מלאים):
- `{{number}}`, `{{date}}`, `{{totalIncludingVat}}`, `{{Vat}}`
- `{{Sales.AccountId.Name}}`, `{{Sales.Total}}`, `{{Sales.TotalBeforeDiscount}}`
- `{{SaleRows.ProductId.Name}}`, `{{SaleRows.Quantity}}`, `{{SaleRows.PricePerUnit}}`, `{{SaleRows.Total}}`

---

## שלב 2: מבנה HTML — כללים קריטיים

### אלמנטים חובה

```html
<div id="windowDiv" class="rtl" style="height: auto; padding: 0;
     -webkit-print-color-adjust: exact; font-family: ...; direction: rtl;">

  <!-- כל התוכן כאן -->

  <!-- בלוק חתימה — חובה בדיוק כך -->
  <div id="sigDiv" style="...">
    <div id="Signature">חתימה</div>
    <div id="SignatureName">שם חתום</div>
    <div id="SignatureDate">תאריך חתימה</div>
  </div>
</div>
```

### ⚠️ כלל קריטי: אין `<script>` tags
תגיות `<script>` **שוברות את החיבור ל-Parse API** ומייצרות:
`"XMLHttpRequest failed: Unable to connect to the Parse API"`

**אסור לחלוטין**: JavaScript, `window.addEventListener`, `document.querySelector`, formatters, כלום.
כל לוגיקה חייבת להיות CSS בלבד.

### ⚠️ כלל קריטי: `id="sigDiv"` מנוהל על ידי המערכת
- המערכת מסתירה את `sigDiv` אוטומטית לפני חתימה, ומציגה אותו לאחריה
- **אל תנסה להסתיר עם CSS** (`display:none`) — זה לא יעבוד
- **אל תשתמש ב-id אחר** (כמו `sigWrapper`) — המערכת לא תזהה
- IDs `Signature`, `SignatureName`, `SignatureDate` חייבים להיות בדיוק בתוך `sigDiv`

### ⚠️ כלל קריטי: צבעים ב-PDF
צבעי רקע **לא מוצגים בברירת מחדל ב-PDF**. חייבים `@media print` עם `!important`:

```html
<style>
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .my-class { background-color: #7c6750 !important; color: #fff !important; }
}
</style>
```

גם `style` inline וגם class יחד — הclass לPDF, ה-inline לתצוגה רגילה:
```html
<td class="ec-brown" style="background-color: #7c6750; color: #fff; ...">
```

---

## שלב 3: Placeholder-ים דינאמיים

```
{{number}}                     — מספר הצעת מחיר
{{date}}                       — תאריך יצירה
{{totalIncludingVat}}          — סה"כ כולל מע"מ
{{Vat}}                        — אחוז המע"מ

{{Sales.AccountId.Name}}       — שם הלקוח
{{Sales.AccountId.PhoneNumber}}— טלפון
{{Sales.AccountId.Email}}      — מייל
{{Sales.AccountId.Address}}    — כתובת
{{Sales.TotalBeforeDiscount}}  — לפני הנחה
{{Sales.DiscountValue}}        — סכום ההנחה
{{Sales.Total}}                — לאחר הנחה, לפני מע"מ
```

### שורות מוצרים (חוזרות)
```html
<tr data-repeat="SaleRows">
  <td>{{SaleRows.ProductId.Name}}</td>
  <td>{{SaleRows.Description}}</td>
  <td>{{SaleRows.Quantity}}</td>
  <td>{{SaleRows.PricePerUnit}} &#8362;</td>
  <td>{{SaleRows.Total}} &#8362;</td>
</tr>
```

`data-repeat="SaleRows"` על ה-`<tr>` — לא על `<table>` ולא על `<td>`.

### שדות קלט (Input) — למילוי על ידי הלקוח ושמירה חזרה לדאטהבייס

**חשוב:** נושא ה-Input fields בתבניות הצעות מחיר עדיין בתהליך חקירה. הפיצ'ר עובד בסביבות לקוח מסוימות אבל ההתנהגות המדויקת תלויה בסביבת הלקוח. לפני יישום, בדוק תבנית קיימת שעובדת אצל הלקוח הספציפי כדי ללמוד את המבנה הנכון.

**מה ידוע:**
- שדות `<input>` עם `name` שמתחיל ב-`Accounts.` או `Sales.` אמורים לשמור ערכים חזרה לדאטהבייס
- אין לשים `value="{{...}}"` ב-input — זה מונע שמירה
- `{{Sales.AccountId.Name}}` הוא placeholder להצגה בלבד — לא שדה קלט

---

## שלב 4: מבנה עיצוב מומלץ (RTL)

### הבנת RTL בטבלאות HTML
בכיוון RTL, ה-`<td>` הראשון בשורה מוצג **בצד ימין**. לכן:
- רוצים לוגו בצד ימין? שים אותו ב-`<td>` ראשון
- רוצים פרטי חברה בצד שמאל? שים אותם ב-`<td>` שני

### מבנה Header מומלץ
```html
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
  <!-- צד ימין: לוגו (40%) -->
  <td class="header-bg" style="background-color: #COLOR; padding: 15px 25px;
      text-align: right; vertical-align: middle; width: 40%;">
    <img src="LOGO_URL" style="width: 240px; height: auto; display: block;
         margin-right: 0; margin-left: auto;" />
  </td>
  <!-- צד שמאל: פרטי חברה (60%) -->
  <td class="header-bg" style="background-color: #COLOR; padding: 15px 25px;
      text-align: left; vertical-align: middle; width: 60%;
      color: rgba(255,255,255,0.85); font-size: 11px; line-height: 1.9;
      border-right: 1px solid rgba(255,255,255,0.2);">
    <div>שם החברה</div>
    <div>כתובת</div>
    <div>טלפון | פקס</div>
    <div>אימייל</div>
  </td>
</tr>
</table>
```

### פס מידע (הצעת מחיר + מספר + תאריך)
```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr>
  <td class="bar-bg" style="background-color: #COLOR2; padding: 9px 30px; text-align: center;">
    <span style="color: #fff; font-size: 14px; font-weight: 600;">הצעת מחיר</span>
    <span style="color: rgba(255,255,255,0.4); margin: 0 12px;">|</span>
    <span style="color: rgba(255,255,255,0.85); font-size: 12px;">מס' {{number}}</span>
    <span style="color: rgba(255,255,255,0.4); margin: 0 12px;">|</span>
    <span style="color: rgba(255,255,255,0.85); font-size: 12px;">{{date}}</span>
  </td>
</tr>
</table>
```

### Footer
```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
<tr>
  <td class="header-bg" style="background-color: #COLOR; padding: 8px;
      text-align: center; font-size: 11px; color: rgba(255,255,255,0.8);">
    website.co.il &nbsp;|&nbsp; כתובת &nbsp;|&nbsp; טלפון
  </td>
</tr>
</table>
```

---

## שלב 5: טיפול בלוגו

> קרא גם את `references/logo-handling.md` לפרטים מלאים עם קוד.

### הבעיה הנפוצה: לוגו קטן מדי
לרוב, קבצי PNG של לוגואים מגיעים עם **שטח שקוף עצום** סביב הלוגו האמיתי. למשל: קובץ 3000×3000px שהלוגו בפועל תופס רק 2100×500px במרכזו. אם מציגים את התמונה עם `max-width: 300px`, הלוגו יראה זעיר (כי הוא רק 70% מגובה התמונה).

### הפתרון: חיתוך לפי ערוץ Alpha

```javascript
// /tmp/crop-logo.js — הרץ עם: node /tmp/crop-logo.js
const { Jimp } = require('jimp'); // npm install jimp ב-/tmp

const INPUT = 'PATH/TO/logo.png';
const OUTPUT = 'PATH/TO/logo-cropped.png';
const PADDING = 10; // פיקסלים סביב הלוגו

Jimp.read(INPUT).then(img => {
  const { width, height, data } = img.bitmap;
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`תוכן: ${minX},${minY} → ${maxX},${maxY} (${maxX-minX}×${maxY-minY}px)`);
  const x = Math.max(0, minX - PADDING);
  const y = Math.max(0, minY - PADDING);
  const w = Math.min(width - x, maxX - minX + PADDING * 2);
  const h = Math.min(height - y, maxY - minY + PADDING * 2);

  img.crop({ x, y, w, h });
  console.log(`לאחר חיתוך: ${img.bitmap.width}×${img.bitmap.height}px`);
  return img.write(OUTPUT);
}).then(() => console.log('נשמר!'));
```

### העלאת הלוגו למערכת
```
שמור את הקובץ החתוך בנתיב שהלקוח יכול לגשת אליו,
בקש מהלקוח להעלות אותו דרך ממשק ה-CRM (מדיה/קבצים).
לאחר שהלקוח שולח את ה-URL, עדכן את התבנית.
```

לחלופין, כשכלי ה-MCP זמינים מול סביבת הלקוח, אפשר להעלות ישירות עם:
```
MCP: Upload-Public-File עם base64 של הקובץ
```

### גודל לוגו בתבנית
```html
<!-- לאחר חיתוך נכון: width קבוע, height: auto -->
<img src="URL" style="width: 240px; height: auto; display: block;
     margin-right: 0; margin-left: auto;" />
```

**אל תשתמש ב-`max-height`** — זה יגרום ללוגו להיראות קטן. עם קובץ חתוך נכון, `width` לבד מספיק.

---

## שלב 6: MCP Tools

### יצירת תבנית חדשה
```
Create-Update-Price-Quote-Template
  templateName: "שם התבנית"
  templateContent: "HTML מלא"
```
מחזיר `objectId` — שמור אותו לעדכונים עתידיים.

### עדכון תבנית קיימת
```
Create-Update-Price-Quote-Template
  templateName: "שם התבנית"
  objectId: "xxxxxxxxxx"
  templateContent: "HTML מעודכן"
```

### קריאת תבנית קיימת
```
Get-Data
  table: "PDFTemplate"
  objectId: "xxxxxxxxxx"
```
מחזיר שדה `HTML` עם כל התוכן.

### רשימת כל התבניות
```
Get-Price-Quote-Templates
```

### עדכון שדה בלבד (לדוגמה URL של לוגו)
```
Update-Data
  table: "PDFTemplate"
  objectId: "xxxxxxxxxx"
  data: { "HTML": "HTML מלא מעודכן" }
```

---

## שלב 7: CSS לצבעי מותג

### תבנית CSS מלאה לכל מותג
```html
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap');
* { font-family: 'Noto Sans Hebrew', 'Assistant', sans-serif !important; box-sizing: border-box; }

@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* שנה את השמות לפי המותג */
  .brand-dark { background-color: #PRIMARY !important; color: #fff !important; }
  .brand-mid  { background-color: #SECONDARY !important; color: #fff !important; }
  .brand-accent { background-color: #ACCENT !important; }
  .brand-light { background-color: #LIGHT !important; }
  .brand-thead { background-color: #TABLE_HEADER !important; color: #fff !important; }
}
</style>
```

### דוגמאות צבעים ממוחשים (פלטות גנריות להמחשה)

| מותג | Primary | Secondary | Accent | Light |
|---|---|---|---|---|
| מותג א' (חם/יוקרתי) | `#7c6750` | `#7c6750` | — | `#f5f0eb` |
| מותג ב' (כהה/מודרני) | `#1F2732` | `#2D3A49` | `#C83F33` | `#F8F8F8` |

---

## שלב 8: יצירת גרסאות מרובות

כאשר לקוח רוצה "כמה אפשרויות", ולפני שמציגים:

1. **זהה נקודות שחשובות** לעיצוב: מבנה Header, צבע קופסת הלקוח, מרווחים
2. **בנה 3-5 גרסאות** עם הבדלים ברורים ומשמעותיים (לא רק צבעים)
3. **תן שמות ברורים**: "גרסה A", "גרסה B" וכד'
4. **אל תיגע בתבנית המקורית** — תמיד צור תבניות חדשות

### כיצד לשכפל תבנית
1. קרא את ה-HTML של המקורית עם `Get-Data`
2. הכנס אותה ל-`Create-Update-Price-Quote-Template` עם שם חדש (ללא `objectId`)
3. עדכן את הגרסה החדשה לפי הצורך

---

## שלב 9: טיפול בבקשות שינוי

כאשר לקוח שולח פידבק (בדרך כלל באימייל):

1. **קרא את האימייל/קובץ** לפני שמתחיל
2. **הבן כל נקודה** — מה בדיוק מבקשים
3. **בדוק אם יש קבצים מצורפים** (לוגו חדש, מסמך הסבר)
4. **שכפל את התבנית הנבחרת** ועבוד על השכפול — **לעולם אל תשנה את המקור**
5. **החל את השינויים** אחד אחד

### שינויים נפוצים ואיך לטפל בהם

| בקשה | פתרון |
|---|---|
| "שנה לוגו" | החלף URL ב-`<img src>` |
| "כל הפסים באותו צבע" | וודא שכל ה-`<td>` עם רקע צבעוני משתמשים באותו קוד צבע |
| "רקע של קופסת לקוח" | שנה `background-color` ב-`<td>` של "לכבוד" |
| "חתימה בשחור" | הוסף `color: #000` לכל טקסטי החתימה |
| "הלוגו גדול מדי/קטן" | שנה `width` ב-`<img>` (לא max-width) |

---

## שלב 10: שגיאות נפוצות ופתרונות

> ראה גם `references/common-errors.md` לרשימה מפורטת

### שגיאה: "XMLHttpRequest failed: Unable to connect to the Parse API"
**סיבה**: יש `<script>` tag בתבנית
**פתרון**: הסר **את כל** תגיות `<script>` — כולל formatters, event listeners, כל JS

### שגיאה: בלוק החתימה נראה ללקוח
**סיבה**: לא משתמשים ב-`id="sigDiv"` הרשמי
**פתרון**: וודא שהמבנה הוא בדיוק:
```html
<div id="sigDiv" style="...">
  <div id="Signature">...</div>
  <div id="SignatureName">...</div>
  <div id="SignatureDate">...</div>
</div>
```

### שגיאה: צבעי רקע לא מוצגים ב-PDF
**סיבה**: חסר `@media print` עם `!important`
**פתרון**: הוסף `@media print` block עם כל הצבעים + `!important`

### שגיאה: לוגו קטן מדי
**סיבה 1**: PNG עם שטח שקוף גדול — חתוך עם Jimp
**סיבה 2**: שיטת גדלים שגויה — השתמש ב-`width: Xpx` (לא `max-width`)
**פתרון**: חתוך את הלוגו לפי alpha channel, ואז `width: 240px; height: auto`

### שגיאה: Header גבוה מדי
**סיבה**: הלוגו עדיין מכיל שטח שקוף למרות חיתוך
**פתרון**: חתוך שוב עם tolerance נמוך יותר (`alpha > 10`), וודא שה-bounds נכונים

### שגיאה: Get-Data לא מחזיר שדה HTML
**סיבה**: שדה HTML גדול מדי לתוצאות ברירת מחדל
**פתרון**: קרא ללא `keys` parameter — `Get-Data(table: "PDFTemplate", objectId: "...")`

---

## Template מלא — בויילרפלייט

```html
<div id="windowDiv" class="rtl" style="height: auto; padding: 0;
     -webkit-print-color-adjust: exact;
     font-family: 'Noto Sans Hebrew', 'Assistant', sans-serif;
     direction: rtl; color: #32373c; line-height: 1.6;">
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap');
* { font-family: 'Noto Sans Hebrew', 'Assistant', sans-serif !important; box-sizing: border-box; }
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .brand-header { background-color: #PRIMARY !important; color: #fff !important; }
  .brand-bar    { background-color: #SECONDARY !important; color: #fff !important; }
  .brand-light  { background-color: #LIGHT !important; }
  .brand-thead  { background-color: #SECONDARY !important; color: #fff !important; }
}
</style>

<!-- HEADER -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
  <td class="brand-header" style="background-color: #PRIMARY; padding: 15px 25px; text-align: right; vertical-align: middle; width: 40%;">
    <img src="LOGO_URL" style="width: 240px; height: auto; display: block; margin-right: 0; margin-left: auto;" />
  </td>
  <td class="brand-header" style="background-color: #PRIMARY; padding: 15px 25px; text-align: left; vertical-align: middle; width: 60%; color: rgba(255,255,255,0.85); font-size: 11px; line-height: 1.9; border-right: 1px solid rgba(255,255,255,0.2);">
    <div>שם החברה</div>
    <div>כתובת</div>
    <div>טלפון</div>
    <div>מייל</div>
  </td>
</tr>
</table>

<!-- QUOTE INFO BAR -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
<tr>
  <td class="brand-bar" style="background-color: #SECONDARY; padding: 9px 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
    <span style="color: #fff; font-size: 14px; font-weight: 600; letter-spacing: 1px;">הצעת מחיר</span>
    <span style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 12px;">|</span>
    <span style="color: rgba(255,255,255,0.85); font-size: 12px;">מס' {{number}}</span>
    <span style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0 12px;">|</span>
    <span style="color: rgba(255,255,255,0.85); font-size: 12px;">{{date}}</span>
  </td>
</tr>
</table>

<div style="padding: 5px 35px 25px 35px;">

<!-- CUSTOMER BOX -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
  <td class="brand-light" style="background-color: #LIGHT; padding: 15px 20px; vertical-align: top; border-right: 4px solid #ACCENT;">
    <div style="font-size: 11px; color: #ACCENT; font-weight: 700; margin-bottom: 5px;">לכבוד</div>
    <div style="font-size: 17px; font-weight: 700; margin-top: 3px;">{{Sales.AccountId.Name}}</div>
    <div style="font-size: 13px; color: #555; margin-top: 3px;">{{Sales.AccountId.PhoneNumber}} &nbsp;|&nbsp; {{Sales.AccountId.Email}}</div>
  </td>
</tr>
</table>

<!-- BRAND TITLE + DESCRIPTION -->
<div style="text-align: center; margin: 20px 0 15px 0;">
  <div style="font-size: 30px; font-weight: 300; color: #PRIMARY; letter-spacing: 4px;">שם המותג</div>
  <div style="font-size: 14px; color: #999; margin-top: 5px;">תגית המותג</div>
</div>

<div class="brand-light" style="background-color: #LIGHT; padding: 16px 25px; font-size: 13px; color: #555; text-align: center; line-height: 1.9; margin-bottom: 25px; border-top: 2px solid #DCDCDC;">
  טקסט שיווקי של המותג...
</div>

<!-- PRODUCT TABLE -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse;">
<tr>
  <td class="brand-thead" style="background-color: #SECONDARY; color: #fff; padding: 10px 12px; font-weight: 600; text-align: center; font-size: 13px;">מוצר</td>
  <td class="brand-thead" style="background-color: #SECONDARY; color: #fff; padding: 10px 12px; font-weight: 600; text-align: center; font-size: 13px;">תיאור</td>
  <td class="brand-thead" style="background-color: #SECONDARY; color: #fff; padding: 10px 12px; font-weight: 600; text-align: center; font-size: 13px;">כמות</td>
  <td class="brand-thead" style="background-color: #SECONDARY; color: #fff; padding: 10px 12px; font-weight: 600; text-align: center; font-size: 13px;">מחיר ליחידה</td>
  <td class="brand-thead" style="background-color: #SECONDARY; color: #fff; padding: 10px 12px; font-weight: 600; text-align: center; font-size: 13px;">סה"כ</td>
</tr>
<tr data-repeat="SaleRows">
  <td style="border-bottom: 1px solid #e0d5ca; padding: 10px 12px; text-align: right; font-size: 13px;">{{SaleRows.ProductId.Name}}</td>
  <td style="border-bottom: 1px solid #e0d5ca; padding: 10px 12px; text-align: right; font-size: 13px;">{{SaleRows.Description}}</td>
  <td style="border-bottom: 1px solid #e0d5ca; padding: 10px 12px; text-align: center; font-size: 13px;">{{SaleRows.Quantity}}</td>
  <td style="border-bottom: 1px solid #e0d5ca; padding: 10px 12px; text-align: center; font-size: 13px;">{{SaleRows.PricePerUnit}} &#8362;</td>
  <td style="border-bottom: 1px solid #e0d5ca; padding: 10px 12px; text-align: center; font-size: 13px;">{{SaleRows.Total}} &#8362;</td>
</tr>
</table>

<!-- TOTALS -->
<table width="45%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px auto; border-collapse: collapse;">
<tr><td style="padding: 6px 10px; font-size: 13px; border-bottom: 1px solid #e0d5ca;">סכום לפני הנחה</td><td style="padding: 6px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #e0d5ca;">{{Sales.TotalBeforeDiscount}} &#8362;</td></tr>
<tr><td style="padding: 6px 10px; font-size: 13px; border-bottom: 1px solid #e0d5ca;">הנחה</td><td style="padding: 6px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #e0d5ca;">{{Sales.DiscountValue}}- &#8362;</td></tr>
<tr><td style="padding: 6px 10px; font-size: 13px; border-top: 2px solid #PRIMARY;">סכום לאחר הנחה</td><td style="padding: 6px 10px; text-align: left; font-size: 13px; font-weight: 700; border-top: 2px solid #PRIMARY;">{{Sales.Total}} &#8362;</td></tr>
<tr>
  <td class="brand-light" style="padding: 10px; font-size: 14px; font-weight: 700; background-color: #PRIMARY; color: #fff;">סה"כ כולל מע"מ</td>
  <td class="brand-light" style="padding: 10px; text-align: left; font-size: 14px; font-weight: 700; background-color: #PRIMARY; color: #fff;">{{totalIncludingVat}} &#8362;</td>
</tr>
</table>

<!-- TERMS -->
<div class="brand-light" style="background-color: #LIGHT; padding: 16px 20px; font-size: 13px; margin-bottom: 15px;">
  <div style="font-weight: 700; color: #PRIMARY; margin-bottom: 8px;">תנאים כלליים</div>
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="width: 48%; vertical-align: top; padding-left: 15px;">
      <div style="font-weight: 700; color: #ACCENT; margin-bottom: 5px;">המחיר כולל:</div>
      <div>&#8226; מע"מ כחוק<br/>&#8226; אחריות ל-__ שנים</div>
    </td>
    <td style="width: 4%;"></td>
    <td style="width: 48%; vertical-align: top; border-right: 1px solid #DCDCDC; padding-right: 15px;">
      <div style="font-weight: 700; color: #PRIMARY; margin-bottom: 5px;">המחיר אינו כולל:</div>
      <div>&#8226; הובלה והתקנה<br/>&#8226; הכנות חשמל וניקוז<br/>&#8226; עבודת עץ<br/>&#8226; הובלת מנוף</div>
    </td>
  </tr>
  </table>
</div>

<!-- DELIVERY + SIGNATURE BLOCK -->
<div style="margin: 12px 0 20px 0; padding: 10px 15px; border-right: 3px solid #PRIMARY; font-size: 13px;">
  <strong>זמני אספקה:</strong> שלושה שבועות מיום ההזמנה
</div>

<div style="margin-top: 25px;">
  <div style="font-size: 14px; color: #000;">בברכה,</div>
  <div style="font-size: 15px; font-weight: 700; color: #PRIMARY;">שם הנציג</div>
  <div style="font-size: 13px; color: #555;">שם החברה</div>
  <div style="font-size: 13px; color: #555;">טלפון</div>
</div>

<!-- DIGITAL SIGNATURE — SYSTEM MANAGED -->
<div id="sigDiv" style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #PRIMARY;">
  <div id="Signature">חתימה</div>
  <p style="font-size: 12px; margin: 8px 0 2px 0;">שם החותם:</p>
  <div id="SignatureName">שם חותם</div>
  <p style="font-size: 12px; margin: 8px 0 2px 0;">תאריך חתימה:</p>
  <div id="SignatureDate">תאריך חתימה</div>
</div>

<!-- FOOTER -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
<tr>
  <td class="brand-header" style="background-color: #PRIMARY; padding: 8px; text-align: center; font-size: 11px; color: rgba(255,255,255,0.8);">
    website.co.il &nbsp;|&nbsp; כתובת &nbsp;|&nbsp; טלפון
  </td>
</tr>
</table>

</div>
</div>
```

---

## Reference Files

- `references/logo-handling.md` — קוד Jimp מפורט, case studies, עצות
- `references/common-errors.md` — כל השגיאות הידועות עם פתרונות
- `references/design-patterns.md` — פטרנים CSS נפוצים וגרסאות עיצוב

---

## Checklist לפני שמירה

- [ ] יש `id="windowDiv"` על האלמנט הראשי
- [ ] אין שום `<script>` tag
- [ ] יש `@media print` עם `!important` לכל צבע רקע
- [ ] `id="sigDiv"` קיים עם `id="Signature"`, `id="SignatureName"`, `id="SignatureDate"` בפנים
- [ ] `data-repeat="SaleRows"` על ה-`<tr>` (לא על `<table>`)
- [ ] הלוגו חתוך (אם PNG עם שקיפות)
- [ ] כל ה-placeholder-ים בפורמט `{{...}}`
