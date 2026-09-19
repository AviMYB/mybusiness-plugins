[English version](README.en.md)

<div dir="rtl">

# MyBusiness CRM — מקימים ומרחיבים מערכת CRM עם AI

</div>

<div dir="ltr">

![AI agents](https://img.shields.io/badge/AI_agents-plugin-d97757) ![Agent Plugins](https://img.shields.io/badge/Agent_Plugins-1.0-24292e) ![version](https://img.shields.io/badge/version-1.2.1-007ec6) ![skills](https://img.shields.io/badge/skills-22-007ec6) ![ISO 27001](https://img.shields.io/badge/security-ISO_27001-2ea44f)

</div>

<div dir="rtl">

זהו התוסף הרשמי של [MyBusiness CRM](https://www.mybusiness.co.il) **לסוכני AI** — כגון Claude Code, Codex, Claude Cowork, ChatGPT Work, Cursor ו-GitHub Copilot. MyBusiness היא פלטפורמת ניהול עסק ישראלית: CRM (לידים, לקוחות, מכירות, פניות, משימות) לצד מודולי MyBooks (חיובים והצעות מחיר), MyCampaigns (קמפיינים), MyChat (וואטסאפ), MyCollege (קורסים) ו-TimeSheet (דיווח שעות).

התוסף `mybusiness-implementor` הופך את סוכן ה-AI שלכם ל**מטמיע מומחה של המערכת**: מתארים בשפה חופשית — בעברית או באנגלית — מה צריך, וה-AI מתכנן ומבצע בפועל: ישויות ושדות, דפי כרטיס, טבלאות ודשבורדים, דוחות, אוטומציות, הרשאות, יבוא נתונים וחיבור טפסים מהאתר.

## Codex Desktop — 1.2.1

התקינו את הפלאגין לקבלת הסקילים. לחיבור המערכת הוסיפו **Custom MCP** דרך ההגדרות המובנות של Codex: **Streamable HTTP**, כתובת `https://mcp.mbapps.co.il/`, ושתי שורות **Headers** בשם `X-Parse-Application-Id` ו-`X-Parse-API-Key`. את הפרטים האישיים מזינים בטופס של Codex בלבד. לאחר Save פתחו משימה חדשה.

The plugin supplies skills; configure the personal MCP separately in Codex Settings. No custom window, Python or external vault is required. [Exact setup / הוראות מלאות](plugins/mybusiness-implementor/SETUP-CODEX.md). Upgrade the marketplace and reinstall to migrate from 1.2.0; existing personal MCP connections remain independent of the plugin.

## למי זה מיועד

**לקוחות MyBusiness** — רוצים להוסיף ישות חדשה, לבנות דשבורד למנהלים, להגדיר אוטומציה או לחבר טופס מדף נחיתה? במקום פרויקט התאמה — שיחה. מתארים את הצורך, בודקים את התוכנית, ומאשרים. הכול על המערכת הקיימת שלכם, דרך ה-API הרשמי.

**מקימי מערכות — לעסק שלכם או ללקוחותיכם** — יזמים, מטמיעים וסוכנויות שרוצים להקים מערכת עסקית שלמה במהירות של AI, בלי להתפשר על אבטחת מידע, על סטנדרטים ועל ארכיטקטורה נכונה.

## כל היתרונות של vibe coding. בלי החסרונות.

היום כל אחד יכול "להרים מערכת" עם AI תוך כמה ימים. מי שעשה את זה מכיר גם את ההמשך: codebase שאף אחד לא באמת מכיר, אין מי שיתמוך בו בעוד שנה, ואבטחת המידע — עליכם.

כאן ה-AI **לא כותב מערכת מאפס — הוא מגדיר אותה על גבי פלטפורמה עסקית מוכחת**:

| | vibe coding מאפס | MyBusiness + סוכן AI |
|---|---|---|
| **מהירות הקמה** | ימים | ימים — בשפה חופשית, בעברית |
| **תחזוקת קוד** | codebase שנולד אתמול ואיש אינו מכיר | אין codebase לתחזק — הגדרות על פלטפורמה מנוהלת |
| **תמיכה לאורך זמן** | אין | מוצר חי: צוות, תמיכה, עדכונים שוטפים |
| **אבטחת מידע** | באחריותכם | תקן **ISO 27001**, מודל הרשאות ותפקידים מובנה |
| **ארכיטקטורה** | מה שיצא לפרומפט | מודל נתונים ותשתית מוצר מוכחים |

<p align="center"><a href="https://sub.mybusiness.co.il/landingreg/"><b>פתיחת מערכת חדשה — 14 יום חינם</b></a></p>

## מה בתוך התוסף

- **חיבור למערכת שלכם:** ב-Codex מוסיפים Custom MCP אישי דרך ההגדרות המובנות; הפלאגין מספק את הסקילים וההנחיות. ב-Claude נשמר מסלול החיבור הייעודי שלו.
- **לא נעולים על ספק אחד** — התוסף ארוז בשני פורמטים באותה תיקייה: גם כתוסף של Claude Code וגם כחבילת [Agent Plugins 1.0](https://agent-plugins.org/specification), התקן הפתוח שהוכרז ב-6.8.2026 על ידי OpenAI יחד עם AWS, Cursor, GitHub, VS Code ו-Vercel. אותם סקילים בדיוק עובדים ב-Codex, Cursor, GitHub Copilot, VS Code ו-Kiro.
- **בסיס ידע מוצרי** (`myb-p-kb`) — יכולות המוצר, מודל הנתונים, מגבלות ידועות ומתודולוגיית הטמעה. שואלים "האם המערכת יודעת X?" ומקבלים תשובה מהתיעוד — לא ניחוש.
- **21 סקילים ביצועיים** שמתכננים ומבצעים עבודה אמיתית על המערכת דרך שרת ה-MCP הרשמי:

| תחום | סקילים |
|---|---|
| חיבור והתחלה | `myb-p-getting-started` (פתיחת חשבון, התחברות ראשונה, Application Id ומפתח API, אימות, ולקוחות AI אחרים) |
| ידע וניתוח | `myb-p-kb` · `myb-p-fit-gap` (ניתוח התאמה לדרישות) |
| מודל נתונים | `myb-p-create-entity` (ישות חדשה מקצה לקצה) · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` (התאמת מונחים לעסק) |
| דפים וממשק | `myb-p-page-builder` (דפי כרטיס) · `myb-p-page-tables` (טבלאות) · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| אוטומציה | `myb-p-trigger-setup` (טריגרים) · `myb-p-form-rules` · `myb-p-sla-configuration` |
| נתונים ואינטגרציות | `myb-p-data-import` (יבוא נתונים) · `myb-p-web2lead-web2table` (טפסים מהאתר) |
| איכות שירות | `myb-p-csat-survey` (סקר שביעות רצון בסגירת פנייה) |
| חיובים והצעות מחיר | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| משתמשים והרשאות | `myb-p-users-roles-permissions` |

## איך מתחילים

**1. אין לכם עדיין מערכת?** פתחו [חשבון ניסיון — 14 יום חינם](https://sub.mybusiness.co.il/landingreg/).

**2. הפיקו את שני ערכי החיבור** — זה השלב היחיד שדורש כניסה למערכת, והוא לוקח דקה:

| הערך | מאיפה |
|---|---|
| **Application Id** | החץ ליד שם המשתמש ← *סביבת פיתוח* ← **Databases** ← בסיס הנתונים שלכם ← טאב **Settings** ← *Copy* |
| **מפתח API (טוקן)** | באותו מסך Settings ← **API Keys** ← *Add Key* ← **Save** ← מעתיקים את המפתח |

📘 **[מדריך מלא עם צילום מסך של כל לחיצה](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/03-connect-with-application-credentials.md)** — כולל איך מגיעים לסביבת הפיתוח, איך מפיקים את הטוקן ואיך מבטלים אותו.

המפתח נותן גישה מלאה לבסיס הנתונים ועוקף את כל ההרשאות — מתייחסים אליו כמו לסיסמה, ולוחצים **Revoke** בשורה שלו כשכבר לא צריך אותו.

**3. התקינו את התוסף בסוכן שאתם עובדים איתו.**

**ב-Claude Code:**

</div>

<div dir="ltr">

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
/plugin configure mybusiness-implementor@mybusiness      ←  מדביקים את שני הערכים
/reload-plugins
```

</div>

<div dir="rtl">

כאן המפתח נשמר בכספת של מערכת ההפעלה ולא בקובץ.

**ב-Codex ובסוכנים אחרים:** מתקינים את הסקילים ומגדירים חיבור אישי דרך הגדרות ה-MCP של המוצר. אין לערוך mcp.json בתוך הפלאגין. [הוראות Codex המדויקות](plugins/mybusiness-implementor/SETUP-CODEX.md).

מדריכים מפורטים עם צילומי מסך:
**4. פתחו שיחה חדשה** ובקשו, למשל: "תקים לי מודול ניהול ספקים עם דף רשימה ודשבורד". הסקילים נטענים ומופעלים אוטומטית, בעברית ובאנגלית. ואם משהו לא ברור — פשוט כתבו "תחבר אותי למערכת שלי", והסקיל `myb-p-getting-started` ילווה אתכם ויוכיח שהחיבור עובד.

**כל המדריכים, בתוך הריפו הזה:**
[פתיחת חשבון והתחברות ראשונה](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/01-account-and-first-login.md) ·
[**הפקת ה-Application Id והטוקן**](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/03-connect-with-application-credentials.md) ·
[אימות ופתרון תקלות](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/04-verify-and-troubleshoot.md) ·
[התקנה בסוכני AI אחרים](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/05-other-ai-clients.md) ·
[חיבור בהתחברות משתמש](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/02-connect-with-user-login.md)

> הסקילים מבצעים שינויים על מערכת חיה. את הניסויים הראשונים מומלץ לעשות על סביבת ניסיון, ולאשר את תוכנית העבודה שה-AI מציג לפני כתיבה למערכת בייצור.

## אבטחת מידע וסטנדרטים

- MyBusiness מחזיקה בתקן אבטחת המידע **ISO 27001**.
- כל פעולה עוברת דרך ה-API הרשמי של המוצר — עם מודל הרשאות, תפקידים ותיעוד פעולות מובנים. לא סקריפטים ולא גישה ישירה לבסיס הנתונים.
- בסיס הידע שבתוסף מוגבל לתיעוד הציבורי של המוצר.

## מה יש בריפו הזה

</div>

<div dir="ltr">

```
.claude-plugin/marketplace.json      the Claude Code marketplace manifest
plugins/mybusiness-implementor/
├── plugin.json                      Agent Plugins 1.0 manifest   ← other clients
├── mcp.json                         Agent Plugins MCP config     ← other clients
├── .claude-plugin/plugin.json       Claude Code manifest (+ its two configuration fields)
├── .mcp.json                        Claude Code MCP config
└── skills/                          22 skills, each a folder with SKILL.md + references/
```

</div>

<div dir="rtl">

**תיקייה אחת, שני פורמטים.** אותו תוסף הוא גם תוסף של Claude Code וגם חבילת [Agent Plugins 1.0](https://agent-plugins.org/specification) — הסטנדרט הפתוח שפורסם ב-6.8.2026 על ידי OpenAI יחד עם AWS, Cursor, GitHub, VS Code ו-Vercel — כך ש-ChatGPT/Codex, Cursor, GitHub Copilot, VS Code ו-Kiro מתקינים את אותה תיקייה בדיוק. הסקילים אינם מוכפלים; כל כלי קורא את המניפסט שהוא מכיר ומתעלם מהשני. שם שני ערכי החיבור מודבקים לתוך `mcp.json` עצמו — [ההסבר והערת האבטחה](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/05-other-ai-clients.md).

הריפו הזה הוא artifact של release — נשמח למשוב ול-issues, אבל שינויי תוכן נכנסים דרך מקור פנימי ומגיעים לכאן עם הגרסה הבאה.

## קישורים ותמיכה

[האתר שלנו](https://www.mybusiness.co.il) · [פתיחת מערכת חדשה — 14 יום חינם](https://sub.mybusiness.co.il/landingreg/) · [שרת ה-MCP של MyBusiness](https://www.mybusiness.co.il/mcp-server/) · תמיכה: [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com)

</div>
