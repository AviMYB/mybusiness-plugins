[English version](README.en.md)

<div dir="rtl">

# MyBusiness CRM — מקימים ומרחיבים מערכת CRM עם AI

</div>

<div dir="ltr">

![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-d97757) ![version](https://img.shields.io/badge/version-1.0.1-007ec6) ![skills](https://img.shields.io/badge/skills-20-007ec6) ![ISO 27001](https://img.shields.io/badge/security-ISO_27001-2ea44f)

</div>

<div dir="rtl">

זהו ה-plugin marketplace הרשמי של [MyBusiness CRM](https://www.mybusiness.co.il) עבור [Claude Code](https://claude.com/claude-code) — פלטפורמת ניהול עסק ישראלית: CRM (לידים, לקוחות, מכירות, פניות, משימות) לצד מודולי MyBooks (חיובים והצעות מחיר), MyCampaigns (קמפיינים), MyChat (וואטסאפ), MyCollege (קורסים) ו-TimeSheet (דיווח שעות).

התוסף `mybusiness-implementor` הופך את Claude Code ל**מטמיע מומחה של המערכת**: מתארים בשפה חופשית — בעברית או באנגלית — מה צריך, וה-AI מתכנן ומבצע בפועל: ישויות ושדות, דפי כרטיס, טבלאות ודשבורדים, דוחות, אוטומציות, הרשאות, יבוא נתונים וחיבור טפסים מהאתר.

## למי זה מיועד

**לקוחות MyBusiness** — רוצים להוסיף ישות חדשה, לבנות דשבורד למנהלים, להגדיר אוטומציה או לחבר טופס מדף נחיתה? במקום פרויקט התאמה — שיחה. מתארים את הצורך, בודקים את התוכנית, ומאשרים. הכול על המערכת הקיימת שלכם, דרך ה-API הרשמי.

**מקימי מערכות — לעסק שלכם או ללקוחותיכם** — יזמים, מטמיעים וסוכנויות שרוצים להקים מערכת עסקית שלמה במהירות של AI, בלי להתפשר על אבטחת מידע, על סטנדרטים ועל ארכיטקטורה נכונה.

## כל היתרונות של vibe coding. בלי החסרונות.

היום כל אחד יכול "להרים מערכת" עם AI תוך כמה ימים. מי שעשה את זה מכיר גם את ההמשך: codebase שאף אחד לא באמת מכיר, אין מי שיתמוך בו בעוד שנה, ואבטחת המידע — עליכם.

כאן ה-AI **לא כותב מערכת מאפס — הוא מגדיר אותה על גבי פלטפורמה עסקית מוכחת**:

| | vibe coding מאפס | MyBusiness + Claude Code |
|---|---|---|
| **מהירות הקמה** | ימים | ימים — בשפה חופשית, בעברית |
| **תחזוקת קוד** | codebase שנולד אתמול ואיש אינו מכיר | אין codebase לתחזק — הגדרות על פלטפורמה מנוהלת |
| **תמיכה לאורך זמן** | אין | מוצר חי: צוות, תמיכה, עדכונים שוטפים |
| **אבטחת מידע** | באחריותכם | תקן **ISO 27001**, מודל הרשאות ותפקידים מובנה |
| **ארכיטקטורה** | מה שיצא לפרומפט | מודל נתונים ותשתית מוצר מוכחים |

<p align="center"><a href="https://sub.mybusiness.co.il/landingreg/"><b>פתיחת מערכת חדשה — 14 יום חינם</b></a></p>

## מה בתוך התוסף

- **בסיס ידע מוצרי** (`myb-p-kb`) — יכולות המוצר, מודל הנתונים, מגבלות ידועות ומתודולוגיית הטמעה. שואלים "האם המערכת יודעת X?" ומקבלים תשובה מהתיעוד — לא ניחוש.
- **19 סקילים ביצועיים** שמתכננים ומבצעים עבודה אמיתית על המערכת דרך שרת ה-MCP הרשמי:

| תחום | סקילים |
|---|---|
| ידע וניתוח | `myb-p-kb` · `myb-p-fit-gap` (ניתוח התאמה לדרישות) |
| מודל נתונים | `myb-p-create-entity` (ישות חדשה מקצה לקצה) · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` (התאמת מונחים לעסק) |
| דפים וממשק | `myb-p-page-builder` (דפי כרטיס) · `myb-p-page-tables` (טבלאות) · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| אוטומציה | `myb-p-trigger-setup` (טריגרים) · `myb-p-form-rules` · `myb-p-sla-configuration` |
| נתונים ואינטגרציות | `myb-p-data-import` (יבוא נתונים) · `myb-p-web2lead-web2table` (טפסים מהאתר) |
| חיובים והצעות מחיר | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| משתמשים והרשאות | `myb-p-users-roles-permissions` |

## איך מתחילים

1. **אין לכם עדיין מערכת?** פתחו [חשבון ניסיון — 14 יום חינם](https://sub.mybusiness.co.il/landingreg/).
2. **חברו את Claude Code למערכת** דרך [שרת ה-MCP של MyBusiness](https://www.mybusiness.co.il/mcp-server/). חיבור אחד משרת מערכת אחת.
3. **התקינו את התוסף** בתוך Claude Code:

</div>

<div dir="ltr">

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
```

</div>

<div dir="rtl">

4. **פתחו שיחה חדשה** ובקשו, למשל: "תקים לי מודול ניהול ספקים עם דף רשימה ודשבורד". הסקילים נטענים ומופעלים אוטומטית, בעברית ובאנגלית.

> הסקילים מבצעים שינויים על מערכת חיה. את הניסויים הראשונים מומלץ לעשות על סביבת ניסיון, ולאשר את תוכנית העבודה שה-AI מציג לפני כתיבה למערכת בייצור.

## אבטחת מידע וסטנדרטים

- MyBusiness מחזיקה בתקן אבטחת המידע **ISO 27001**.
- כל פעולה עוברת דרך ה-API הרשמי של המוצר — עם מודל הרשאות, תפקידים ותיעוד פעולות מובנים. לא סקריפטים ולא גישה ישירה לבסיס הנתונים.
- בסיס הידע שבתוסף מוגבל לתיעוד הציבורי של המוצר.

## מה יש בריפו הזה

</div>

<div dir="ltr">

```
.claude-plugin/marketplace.json      the marketplace manifest
plugins/mybusiness-implementor/      the plugin: 20 skills, each a folder with
                                     SKILL.md + references/
```

</div>

<div dir="rtl">

הריפו הזה הוא artifact של release — נשמח למשוב ול-issues, אבל שינויי תוכן נכנסים דרך מקור פנימי ומגיעים לכאן עם הגרסה הבאה.

## קישורים ותמיכה

[האתר שלנו](https://www.mybusiness.co.il) · [פתיחת מערכת חדשה — 14 יום חינם](https://sub.mybusiness.co.il/landingreg/) · [שרת ה-MCP של MyBusiness](https://www.mybusiness.co.il/mcp-server/) · תמיכה: [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com)

</div>
