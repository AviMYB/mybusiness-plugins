# שגיאות נפוצות בתבניות הצעות מחיר

## שגיאה 1: "XMLHttpRequest failed: Unable to connect to the Parse API"

**תסמין**: לאחר שמירת התבנית, פתיחת הצעת מחיר מציגה שגיאה אדומה
**סיבה**: יש `<script>` tag בתבנית
**חומרה**: קריטית — משבית את כל התבנית

**פתרון**: הסר **את כל** תגיות `<script>` וכל תוכנן.

```html
<!-- ❌ אסור — גורם לשגיאה -->
<script>
  document.querySelectorAll('.price').forEach(el => {
    el.textContent = Number(el.textContent).toLocaleString('he-IL');
  });
</script>

<!-- ✓ מותר — CSS בלבד -->
<style>
  .price { font-weight: bold; }
</style>
```

**דברים שאסור לממש עם JS** (כי אין JS בתבנית):
- פירמוט מספרים עם פסיקים
- הסתרת/הצגת אלמנטים לפי תנאי
- חישובים
- Event listeners

---

## שגיאה 2: בלוק החתימה גלוי ללקוח

**תסמין**: אזור החתימה (שם, תאריך) מוצג בהצעת המחיר לפני שהלקוח חתם
**סיבה**: שימוש ב-ID שגוי לבלוק החתימה
**חומרה**: גבוהה — חוויית משתמש גרועה

**פתרון**: השתמש בדיוק ב-`id="sigDiv"` והכלל בתוכו את שלושת ה-IDs:

```html
<!-- ❌ שגוי -->
<div id="signatureWrapper" style="display:none;">
  <div id="sig">חתימה</div>
</div>

<!-- ❌ שגוי -->
<div id="sigDiv">
  <div id="sig">חתימה</div>  <!-- שם שגוי -->
</div>

<!-- ✓ נכון -->
<div id="sigDiv" style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #ccc;">
  <div id="Signature">חתימה</div>
  <p>שם החותם:</p>
  <div id="SignatureName">שם חותם</div>
  <p>תאריך חתימה:</p>
  <div id="SignatureDate">תאריך חתימה</div>
</div>
```

**הסבר**: המערכת מזהה `id="sigDiv"` אוטומטית ומנהלת את הנראות שלו.
אל תנסה לשלוט בזה בעצמך — תמיד יכשל.

---

## שגיאה 3: צבעי רקע לא מוצגים ב-PDF

**תסמין**: ב-Preview/CRM הצבעים נראים, אבל ב-PDF שנשלח ללקוח הכל לבן
**סיבה**: דפדפן מכבה צבעי רקע ב-Print/PDF בברירת מחדל
**חומרה**: גבוהה — התבנית לא נראית כמעוצבת

**פתרון**: הוסף `@media print` עם `!important` לכל צבע רקע:

```html
<style>
/* ✓ נכון — עובד גם ב-PDF */
@media print {
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .header-bg { background-color: #1a2b3c !important; color: #fff !important; }
  .light-bg  { background-color: #f5f5f5 !important; }
  .table-th  { background-color: #1a2b3c !important; color: #fff !important; }
}

/* גם inline style לתצוגת Web */
</style>

<!-- ✓ נכון — שני מנגנונים יחד -->
<td class="header-bg" style="background-color: #1a2b3c; color: #fff;">
```

---

## שגיאה 4: לוגו קטן מדי

**תסמין**: הלוגו נראה זעיר בתוך אזור כהה גדול
**סיבה**: קובץ PNG מכיל שטח שקוף גדול סביב הלוגו האמיתי
**חומרה**: בינונית — עיצובי

**פתרון**:
1. חתוך את הלוגו (ראה `logo-handling.md`)
2. השתמש ב-`width: Xpx; height: auto;` (לא `max-width`)

```html
<!-- ❌ בעייתי אם הקובץ לא חתוך -->
<img src="..." style="max-width: 300px; height: auto;" />

<!-- ✓ נכון לאחר חיתוך -->
<img src="..." style="width: 280px; height: auto; display: block;" />
```

---

## שגיאה 5: Header גבוה מדי

**תסמין**: הפס העליון (Header) גבוה כמה פעמים ממה שצריך, הלוגו נראה קטן יחסית
**סיבה**: הלוגו מכיל שטח שקוף שדוחף את גובה ה-`<td>` להיות גדול
**חומרה**: בינונית — עיצובי

**פתרון A**: חתוך את הלוגו (הפתרון הנכון — ראה `logo-handling.md`)

**פתרון B (זמני)**: הגבל גובה עם height קבועה + object-fit:
```html
<!-- עובד אם החיתוך לא מושלם — אבל עלול לגרום ללוגו קטן שוב -->
<img src="..." style="width: 280px; height: 70px; object-fit: contain;
     object-position: right center;" />
```

**ממליץ תמיד על פתרון A** — חיתוך נכון מונע את כל הבעיות האלה.

---

## שגיאה 6: `Get-Data` לא מחזיר שדה HTML

**תסמין**: קריאה ל-`Get-Data` עם PDFTemplate מחזירה רק metadata, ללא שדה HTML
**סיבה**: שדה HTML גדול מדי, או ציינת `keys` שלא כולל HTML

**פתרון**: קרא ללא parameter של `keys`:
```
Get-Data
  table: "PDFTemplate"
  objectId: "xxxxxxxxxx"
  # אל תציין keys — תקבל את כל השדות כולל HTML
```

---

## שגיאה 7: `data-repeat` לא עובד

**תסמין**: רואים רק שורה אחת בטבלת המוצרים (הטקסט הסטטי), ללא שורות מוצר
**סיבה**: `data-repeat="SaleRows"` במקום הלא נכון

**פתרון**: `data-repeat` חייב להיות על ה-`<tr>`, לא על `<table>` או `<td>`:

```html
<!-- ❌ שגוי -->
<table data-repeat="SaleRows">
  <tr><td>{{SaleRows.ProductId.Name}}</td></tr>
</table>

<!-- ❌ שגוי -->
<tr><td data-repeat="SaleRows">{{SaleRows.ProductId.Name}}</td></tr>

<!-- ✓ נכון -->
<table>
  <tr data-repeat="SaleRows">
    <td>{{SaleRows.ProductId.Name}}</td>
  </tr>
</table>
```

---

## שגיאה 8: placeholder לא מוחלף

**תסמין**: הצעת המחיר מציגה את הטקסט `{{Sales.AccountId.Name}}` במקום שם הלקוח
**סיבות אפשריות**:
1. שגיאת כתיב ב-placeholder (רגיש לאותיות ולנקודות)
2. השדה לא קיים ב-Account של הלקוח
3. סוגריים שגויים (כפולות ולא בודדות)

**פתרון**:
- השתמש בדיוק ב-`{{Sales.AccountId.Name}}` (עם נקודות, לא קו תחתון)
- בדוק ב-CRM שהשדה באמת מלא
- ראה רשימת placeholder-ים מאושרים ב-SKILL.md

---

## שגיאה 9: צבעים שאינם מוצגים כלל (גם לא ב-Web)

**תסמין**: גם ב-Preview הצבעים לא נראים
**סיבה**: CSS class מוגדר ב-`@media print` בלבד — חסר inline style

**פתרון**: חייבים **שני מנגנונים**:
```html
<!-- שניהם יחד — class לPDF, inline לWeb -->
<td class="brand-header" style="background-color: #1a2b3c; color: #fff;">
```

---

## Cheat Sheet מהיר

| תסמין | בדוק ראשון |
|---|---|
| שגיאת Parse API | חפש `<script` בקוד |
| חתימה גלויה | בדוק `id="sigDiv"` ו-3 ה-IDs |
| PDF חסר צבעים | בדוק `@media print !important` |
| לוגו קטן מדי | חתוך עם Jimp לפי alpha |
| Header גבוה | חתוך את הלוגו |
| שורות מוצר לא מוצגות | בדוק `data-repeat` על `<tr>` |
| placeholder גלוי | בדוק כתיב מדויק |
