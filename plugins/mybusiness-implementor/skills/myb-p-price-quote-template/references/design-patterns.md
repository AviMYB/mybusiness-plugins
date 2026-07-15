# פטרנים עיצוביים לתבניות הצעות מחיר

## עקרונות בסיסיים

1. **RTL תמיד** — `direction: rtl`, ה-`<td>` הראשון בשורה = צד ימין
2. **טבלאות עדיפות** על Flexbox/Grid לתאימות PDF
3. **שני מנגנוני CSS** — class לPDF, inline לWeb
4. **פונט Hebrew** — `Noto Sans Hebrew` מ-Google Fonts עובד מצוין

---

## פטרן Header — גרסת שתי עמודות (נפוצה)

```
| [לוגו — 40% ימין] | [פרטי חברה — 60% שמאל] |
```

**מתי**: כאשר יש הרבה פרטי חברה (כתובת, טלפון, מייל, אתר)

```html
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
  <td class="hdr" style="background-color: #COLOR; padding: 15px 25px;
      text-align: right; vertical-align: middle; width: 40%;">
    <img src="LOGO_URL" style="width: 240px; height: auto; display: block;
         margin-right: 0; margin-left: auto;" />
  </td>
  <td class="hdr" style="background-color: #COLOR; padding: 15px 25px;
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

---

## פטרן Header — לוגו בלבד (פשוט)

```
|          [לוגו מרכזי — 100%]          |
```

**מתי**: לוגו חזק, פרטי חברה בפוטר

```html
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
  <td class="hdr" style="background-color: #COLOR; padding: 25px 30px; text-align: center;">
    <img src="LOGO_URL" style="max-width: 300px; height: auto;" />
  </td>
</tr>
</table>
```

---

## פטרן קופסת לקוח — עם גבול צד ימין (מודגש)

```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
  <td class="cust-bg" style="background-color: #F8F8F8; padding: 15px 20px;
      vertical-align: top; border-right: 4px solid #ACCENT_COLOR;">
    <div style="font-size: 11px; color: #ACCENT_COLOR; font-weight: 700;
         text-transform: uppercase; margin-bottom: 5px;">לכבוד</div>
    <div style="font-size: 17px; font-weight: 700; margin-top: 3px;">{{Sales.AccountId.Name}}</div>
    <div style="font-size: 13px; color: #555; margin-top: 3px;">
      {{Sales.AccountId.PhoneNumber}} &nbsp;|&nbsp; {{Sales.AccountId.Email}}
    </div>
  </td>
</tr>
</table>
```

---

## פטרן קופסת לקוח — בסיסי (ללא גבול)

```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
  <td class="cust-bg" style="background-color: #F0F0F0; padding: 12px 18px;">
    <strong>לכבוד:</strong> {{Sales.AccountId.Name}}<br/>
    {{Sales.AccountId.PhoneNumber}} | {{Sales.AccountId.Email}}
  </td>
</tr>
</table>
```

---

## פטרן טבלת מוצרים

### עם 5 עמודות (מוצר, תיאור, כמות, מחיר, סה"כ) — מלא

```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border-collapse: collapse;">
<tr>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 13px; text-align: center;">מוצר</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 13px; text-align: center;">תיאור</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 13px; text-align: center;">כמות</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 13px; text-align: center;">מחיר ליחידה</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px 12px; font-weight: 600; font-size: 13px; text-align: center;">סה"כ</td>
</tr>
<tr data-repeat="SaleRows">
  <td style="border-bottom: 1px solid #ddd; padding: 10px 12px; text-align: right; font-size: 13px;">{{SaleRows.ProductId.Name}}</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px 12px; text-align: right; font-size: 13px;">{{SaleRows.Description}}</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px 12px; text-align: center; font-size: 13px;">{{SaleRows.Quantity}}</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px 12px; text-align: center; font-size: 13px;">{{SaleRows.PricePerUnit}} &#8362;</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px 12px; text-align: center; font-size: 13px; font-weight: 600;">{{SaleRows.Total}} &#8362;</td>
</tr>
</table>
```

### עם 3 עמודות (פשוט — דגם/תיאור/מחיר)

```html
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
<tr>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px; font-size: 13px; font-weight: 600;">דגם</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px; font-size: 13px; font-weight: 600;">תיאור</td>
  <td class="th" style="background-color: #COLOR; color: #fff; padding: 10px; font-size: 13px; font-weight: 600; text-align: center;">מחיר</td>
</tr>
<tr data-repeat="SaleRows">
  <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 13px; font-weight: 600;">{{SaleRows.ProductId.Name}}</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 13px;">{{SaleRows.Description}}</td>
  <td style="border-bottom: 1px solid #ddd; padding: 10px; font-size: 13px; text-align: center;">{{SaleRows.Total}} &#8362;</td>
</tr>
</table>
```

---

## פטרן סיכום סכומים (תמיד ימינה)

```html
<table width="45%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px auto; border-collapse: collapse;">
<tr>
  <td style="padding: 6px 10px; font-size: 13px; border-bottom: 1px solid #ddd;">סכום לפני הנחה</td>
  <td style="padding: 6px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #ddd;">{{Sales.TotalBeforeDiscount}} &#8362;</td>
</tr>
<tr>
  <td style="padding: 6px 10px; font-size: 13px; border-bottom: 1px solid #ddd;">הנחה</td>
  <td style="padding: 6px 10px; text-align: left; font-size: 13px; border-bottom: 1px solid #ddd;">{{Sales.DiscountValue}}- &#8362;</td>
</tr>
<tr>
  <td style="padding: 6px 10px; font-size: 13px; border-top: 2px solid #COLOR;">סכום לאחר הנחה</td>
  <td style="padding: 6px 10px; text-align: left; font-size: 13px; font-weight: 700; border-top: 2px solid #COLOR;">{{Sales.Total}} &#8362;</td>
</tr>
<tr>
  <td class="total-bg" style="padding: 10px; font-size: 14px; font-weight: 700; background-color: #COLOR; color: #fff;">סה"כ כולל מע"מ</td>
  <td class="total-bg" style="padding: 10px; text-align: left; font-size: 14px; font-weight: 700; background-color: #COLOR; color: #fff;">{{totalIncludingVat}} &#8362;</td>
</tr>
</table>
```

---

## פטרן תנאים כלליים — שתי עמודות (כולל / לא כולל)

```html
<div class="terms-bg" style="background-color: #F8F8F8; padding: 16px 20px; font-size: 13px; margin-bottom: 15px;">
  <div style="font-weight: 700; color: #PRIMARY; margin-bottom: 10px; font-size: 14px;">תנאים כלליים</div>
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="width: 48%; vertical-align: top; padding-left: 15px;">
      <div style="font-weight: 700; color: #ACCENT; margin-bottom: 6px;">המחיר כולל:</div>
      <div style="line-height: 2;">
        &#8226; מע"מ כחוק<br/>
        &#8226; אחריות ל-__ שנים
      </div>
    </td>
    <td style="width: 4%;"></td>
    <td style="width: 48%; vertical-align: top; border-right: 1px solid #ddd; padding-right: 15px;">
      <div style="font-weight: 700; color: #PRIMARY; margin-bottom: 6px;">המחיר אינו כולל:</div>
      <div style="line-height: 2;">
        &#8226; הובלה והתקנה<br/>
        &#8226; הכנות חשמל וניקוז<br/>
        &#8226; עבודת עץ<br/>
        &#8226; הובלת מנוף
      </div>
    </td>
  </tr>
  </table>
</div>
```

---

## פטרן זמני אספקה + הצעה בתוקף

```html
<!-- עם גבול צד ימין בצבע מותג -->
<div style="margin: 12px 0; padding: 10px 15px; border-right: 3px solid #COLOR; font-size: 13px;">
  <strong>זמני אספקה:</strong> __ שבועות מיום ההזמנה
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <strong>הצעה בתוקף עד:</strong> XX/XX/20XX
</div>
```

---

## פטרן חתימת נציג + sigDiv

```html
<!-- חתימת הנציג (סטטית) -->
<div style="margin-top: 25px;">
  <div style="font-size: 14px; color: #000;">בברכה,</div>
  <div style="font-size: 15px; font-weight: 700; color: #PRIMARY;">שם הנציג</div>
  <div style="font-size: 13px; color: #555;">שם החברה</div>
  <div style="font-size: 13px; color: #555;">טלפון הנציג</div>
</div>

<!-- חתימה דיגיטלית — מנוהל על ידי המערכת (חובה!) -->
<div id="sigDiv" style="text-align: center; margin-top: 30px; padding: 20px; border-top: 2px solid #COLOR;">
  <div id="Signature">חתימה</div>
  <p style="font-size: 12px; margin: 8px 0 2px 0;">שם החותם:</p>
  <div id="SignatureName">שם חותם</div>
  <p style="font-size: 12px; margin: 8px 0 2px 0;">תאריך חתימה:</p>
  <div id="SignatureDate">תאריך חתימה</div>
</div>
```

---

## פטרן כרטיסיות מידע — שתי עמודות (מידות, אזורי טמפרטורה וכד')

```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin: 15px 0;">
<tr>
  <td class="card-bg" style="width: 49%; vertical-align: top; padding: 15px; background-color: #F5F5F5;">
    <div style="font-size: 13px; font-weight: 700; color: #COLOR; margin-bottom: 8px;">כותרת כרטיסייה 1</div>
    <div style="font-size: 13px;">פרט 1</div>
    <div style="font-size: 13px;">פרט 2</div>
  </td>
  <td style="width: 2%;"></td>
  <td class="card-bg" style="width: 49%; vertical-align: top; padding: 15px; background-color: #F5F5F5;">
    <div style="font-size: 13px; font-weight: 700; color: #COLOR; margin-bottom: 8px;">כותרת כרטיסייה 2</div>
    <div style="font-size: 13px;">פרט א</div>
    <div style="font-size: 13px;">פרט ב</div>
  </td>
</tr>
</table>
```

---

## CSS Template מלא — בסיס לכל מותג

```html
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;600;700&display=swap');

* {
  font-family: 'Noto Sans Hebrew', 'Assistant', sans-serif !important;
  box-sizing: border-box;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* החלף את הצבעים לפי המותג */
  .brand-primary  { background-color: #PRIMARY !important; color: #fff !important; }
  .brand-secondary{ background-color: #SECONDARY !important; color: #fff !important; }
  .brand-light    { background-color: #LIGHT !important; }
  .brand-thead    { background-color: #SECONDARY !important; color: #fff !important; }
  .brand-total    { background-color: #PRIMARY !important; color: #fff !important; }
  .brand-terms    { background-color: #LIGHT !important; }
}
</style>
```

---

## בחירת גובה/עומק עיצובי

| עומק עיצוב | מאפיינים | מתאים ל |
|---|---|---|
| **פשוט** | 2 צבעים, טבלת מוצרים, סיכום | B2B מהיר, פנים-ארגוני |
| **בינוני** | Header דו-עמודתי, קופסת לקוח, תנאים | רוב הלקוחות |
| **מפורט** | כרטיסיות מידע, מבנה מוצר, Footer | לקוחות עיצוביים |

---

## עצות ועיצוב

- **ריווח**: `padding: 15px 25px` לחלקים ראשיים, `padding: 10px 12px` לתאי טבלה
- **גופן ראשי**: 13px לרוב הטקסט, 17px לשם לקוח, 11px לפרטים קטנים
- **קו הפרדה בין עמודות**: `border-right: 1px solid rgba(255,255,255,0.2)` על רקע כהה
- **הצג נכון ב-RTL**: בדוק שכיוונים (text-align: right/left) הגיוניים ב-RTL
- **גדלי עמודות**: Header עם לוגו — 40% ימין / 60% שמאל; 50-50 לכרטיסיות מידע
