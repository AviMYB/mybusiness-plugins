# טיפול בלוגואים — מדריך מפורט

## למה לוגואים יוצאים קטנים?

קבצי PNG של לוגואים מגיעים לרוב ממעצבים עם canvas גדולה ורוב שטחה שקוף.
לדוגמה: קובץ 3000×3000 פיקסל שהלוגו עצמו תופס אזור של 2100×500 פיקסל.

כשמציגים עם `max-width: 300px`:
- הדפדפן מציג 300px רוחב
- גובה = 300 * (3000/3000) = 300px
- הלוגו האמיתי נראה קטן מאוד כי הוא רק חלק מהתמונה

## זרימת עבודה מומלצת

```
קובץ מהלקוח → בדיקת מידות → חיתוך alpha → שמירה → העלאה → שימוש בתבנית
```

## קוד חיתוך — Node.js עם Jimp

```bash
# התקנה (פעם אחת)
cd /tmp && npm install jimp
```

```javascript
// /tmp/crop-logo.js
const { Jimp } = require('jimp');

const INPUT_PATH  = 'C:/Users/.../logo.png';  // שנה לנתיב האמיתי
const OUTPUT_PATH = 'C:/Users/.../logo-cropped.png';
const PADDING = 10; // פיקסלים שוליים סביב הלוגו

Jimp.read(INPUT_PATH).then(img => {
  const { width, height, data } = img.bitmap;
  console.log('גודל מקורי:', width, '×', height);

  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3]; // ערוץ alpha
      if (alpha > 10) { // מתעלם מפיקסלים כמעט שקופים
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === 0) {
    console.error('לא נמצא תוכן! אולי הלוגו לבן על רקע לבן?');
    return;
  }

  console.log(`גבולות תוכן: (${minX},${minY}) → (${maxX},${maxY})`);
  console.log(`גודל תוכן: ${maxX - minX} × ${maxY - minY}px`);

  const x = Math.max(0, minX - PADDING);
  const y = Math.max(0, minY - PADDING);
  const w = Math.min(width - x, maxX - minX + PADDING * 2);
  const h = Math.min(height - y, maxY - minY + PADDING * 2);

  img.crop({ x, y, w, h });
  console.log('גודל לאחר חיתוך:', img.bitmap.width, '×', img.bitmap.height);
  return img.write(OUTPUT_PATH);
}).then(() => console.log('✓ נשמר:', OUTPUT_PATH))
  .catch(e => console.error('שגיאה:', e.message));
```

```bash
node /tmp/crop-logo.js
```

## מה לעשות עם לוגו לבן על רקע שקוף?

זה בסדר! הלוגו יראה לבן על רקע כהה בתבנית.
חיתוך לפי alpha עובד מצוין — הקוד למעלה מחפש פיקסלים עם alpha > 10,
לא מתייחס לצבע (לבן, שחור, כל צבע יעבוד).

## מה לעשות עם לוגו כהה על רקע לבן (לא שקוף)?

אם הרקע לבן (RGB 255,255,255) ולא שקוף:

```javascript
// גרסה לרקע לבן — מחפש פיקסלים שאינם לבן
const r = data[idx], g = data[idx+1], b = data[idx+2];
if (r < 230 || g < 230 || b < 230) {  // לא לבן
  // update bounds...
}
```

## העלאה למערכת

### אפשרות 1: הלקוח מעלה
שמור את הקובץ החתוך במיקום נגיש ללקוח, בקש ממנו להעלות דרך ממשק CRM → מדיה.
לאחר שמשלח URL, עדכן את התבנית.

### אפשרות 2: העלאה ישירה עם MCP (כשכלי ה-MCP זמינים מול סביבת הלקוח)
```
MCP: Upload-Public-File
  file:
    name: "logo-cropped.png"
    mimeType: "image/png"
    data: BASE64_OF_FILE
```

לקידוד base64 ב-Node.js:
```javascript
const fs = require('fs');
const b64 = fs.readFileSync('/path/to/logo-cropped.png').toString('base64');
// העתק את הפלט ל-data parameter של Upload-Public-File
```

**שים לב**: קבצי base64 גדולים (>50KB) עלולים להיות ארוכים מדי להעברה ישירה.
אם זה קורה, בקש מהלקוח להעלות בעצמו.

## גדלי לוגו מומלצים בתבנית

| יחס מימדים (רוחב:גובה) | CSS מומלץ |
|---|---|
| רחב (4:1 ומעלה) | `width: 280px; height: auto;` |
| ריבועי (1:1 עד 2:1) | `max-width: 120px; height: auto;` |
| גבוה (1:2 ומטה) | `max-height: 80px; width: auto;` |

**כלל אצבע**: אחרי חיתוך נכון, `width: 240-280px; height: auto` מתאים לרוב הלוגואים הרחבים.

## Case Studies — לוגואים נפוצים

### לוגו לרוחב (Wide logo) — יחס 5:1
- **מקור**: PNG 4250×4250px, תוכן בפועל ~2500×500px
- **לאחר חיתוך**: ~2700×700px (עם padding)
- **בתבנית**: `max-width: 280px; height: auto` → ~280×73px בפועל ✓

### לוגו ריבועי עם whitespace — יחס 4:1 אחרי חיתוך
- **מקור**: PNG 3000×3000px, תוכן בפועל ~2100×500px
- **לאחר חיתוך**: ~2101×534px
- **בתבנית**: `width: 240px; height: auto` → ~240×61px בפועל ✓

**המסקנה**: לוגו שנראה ריבועי בקובץ המקורי יכול להיות רחב מאוד אחרי חיתוך — לכן תמיד מדוד את התוצאה לפני שמגדיר את ה-CSS.

## בעיות נפוצות

### "הלוגו קטן מדי"
- בדוק: האם חתכת? `console.log` את גבולות התוכן
- בדוק: האם משתמש ב-`width` קבוע (לא `max-width`)
- אם עדיין קטן: הגדל את `width` ב-CSS

### "ה-Header גבוה מדי"
- הקובץ עדיין מכיל שטח שקוף — חתוך שוב עם `PADDING = 5`
- בדוק שה-crop באמת רץ: השווה גודל קובץ מקורי לחתוך

### "הלוגו לא נטען"
- בדוק שה-URL נגיש ציבורית
- בדוק שהמכשיר של הלקוח יכול לגשת לדומיין S3
