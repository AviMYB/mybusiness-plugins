# קטלוג אתר התמיכה הרשמי (Official Support Site Catalog)

> **Purpose:** Complete catalog of every guide/article on the official MyBusiness CRM support site (`https://www.mybusiness.co.il/support/`), cross-checked against the local KB export and the unpublished drafts folder, so implementers (human/AI) know exactly what public documentation exists, where it lives, and what is missing.
> **Last updated:** 2026-06-10 · **Status:** draft

---

## 1. How the support site is organized

- **Hub page:** `https://www.mybusiness.co.il/support/` — presents 5 top-level themes (התחלת עבודה, תהליכי עבודה ניהול ובקרה, התאמה אישית והגדרות מתקדמות, כלים למפתחים, אפליקציות נוספות), each linking to category archive pages, plus a marketing-level Q&A page.
- **Content type:** Guides are a WordPress custom post type `support`; categories are the taxonomy `support-cata` (27 terms defined, 23 with archive pages in the sitemap).
- **Category archives:** `https://www.mybusiness.co.il/support-cata/<slug>/` (e.g. `/support-cata/mcp/`, `/support-cata/mybooks/`).
- **Article URLs:** `https://www.mybusiness.co.il/support/<slug>/` — older articles use Hebrew slugs (percent-encoded); the March 2026 wave uses English slugs.
- **Q&A page:** `https://www.mybusiness.co.il/supportnewsearch/שאלות-ותשובות/` — 10 marketing-level FAQ items (tasks, Excel import, quotes, accounting docs, automations, leads, Google Calendar sync, landing pages/Facebook via Zapier, SMS, reports).
- **Sitemaps:** Yoast SEO sitemap index at `/sitemap.xml` with `support-sitemap.xml` (articles) and `support-cata-sitemap.xml` (categories). `/wp-sitemap.xml` is superseded by Yoast; `/sitemap_index.xml` redirects to the same index.

**Inventory summary (2026-06-10):**

| Source | Count |
|---|---|
| Live site — published support articles (sitemap, minus the `/support` hub URL itself) | **152** |
| Local export `guides_only` (generated 2026-02-06) | 120 (116 published + 4 WP drafts) |
| Published after the local export (2026-03-14 → 2026-06-08 wave) | 36 (34 sourced from `Guides_Draft`, 2 brand-new) |
| `Guides_Draft` folder | 47 files = 43 guide drafts + 1 authoring playbook + 3 internal/temp files |
| Draft guides still NOT published | 8 |

URL convention in the tables below: Hebrew-slug URLs are shown IRI-decoded (e.g. `…/support/יצירת-טריגרים/`) — browsers re-encode them automatically; the percent-encoded form is equivalent.

---

## 2. Published articles by category (live site, 152)

### 2.1 צעדים ראשונים (First steps) — 11 published

| Hebrew title | URL | English summary |
|---|---|---|
| רישום והתחברות | https://www.mybusiness.co.il/support/רישום-והתחברות/ | Signup and login to the system |
| בחירת מסלול וביצוע תשלום | https://www.mybusiness.co.il/support/בחירת-מסלול-וביצוע-תשלום/ | Choosing a plan and paying for the subscription |
| ניווט ותפריטים | https://www.mybusiness.co.il/support/ניווט-ותפריטים/ | Navigating the UI and menus |
| ממשק התראות | https://www.mybusiness.co.il/support/ממשק-התראות-2/ | The in-app notifications interface |
| כרטיס ופעולות | https://www.mybusiness.co.il/support/כרטיס-ופעולות/ | Record card anatomy and card actions |
| שירותים נוספים | https://www.mybusiness.co.il/support/שירותים-נוספים/ | Add-on services offered with the system |
| תחילת עבודה עם MyBusiness CRM | https://www.mybusiness.co.il/support/getting-started-2/ | Getting-started overview (published 2026-03-14) |
| סיור מודרך — הכרת ממשק המערכת | https://www.mybusiness.co.il/support/system-tour/ | Guided tour of the system interface (2026-03-14) |
| הגדרות ראשוניות — פרופיל, לוגו ופרטי עסק | https://www.mybusiness.co.il/support/initial-setup/ | Initial setup: profile, logo, business details (2026-03-14) |
| יצירת הרשומות הראשונות — לקוח, ליד ומכירה | https://www.mybusiness.co.il/support/first-records/ | Creating your first account, lead and sale (2026-03-14) |
| מילון מונחים — מושגים בסיסיים במערכת | https://www.mybusiness.co.il/support/glossary/ | Glossary of basic system terms (2026-03-14) |

### 2.2 הגדרות מערכת בסיסיות (Basic system settings) — 7 published

| Hebrew title | URL | English summary |
|---|---|---|
| הוספת משתמש חדש למערכת | https://www.mybusiness.co.il/support/הוספת-משתמש-חדש-למערכת/ | Adding a new user to the system |
| הגדרות SMTP לשליחת מייל מהמערכת | https://www.mybusiness.co.il/support/הגדרות-smtp-לשליחת-מייל-מהמערכת/ | SMTP setup for outbound email (Gmail app-password flow incl. 2FA, Office365) |
| ניהול משתמשים והרשאות במערכת | https://www.mybusiness.co.il/support/ניהול-משתמשים-והרשאות-במערכת/ | Managing users and their permissions |
| פרופילים | https://www.mybusiness.co.il/support/פרופילים/ | Permission profiles (roles) |
| הגדרות לכרטיסי המערכת | https://www.mybusiness.co.il/support/הגדרות-לכרטיסי-המערכת/ | Per-entity card settings |
| הגדרת MyInbox — חיבור תיבת מייל | https://www.mybusiness.co.il/support/myinbox-setup/ | Connecting a mailbox to MyInbox (2026-03-14) |
| ניהול מיילים נכנסים ושיוך ללקוחות | https://www.mybusiness.co.il/support/myinbox-usage/ | Handling inbound email and linking to accounts (2026-03-14) |

### 2.3 תהליכי עבודה וכרטיסים במערכת (Workflows & record cards) — 15 published

| Hebrew title | URL | English summary |
|---|---|---|
| ממשק התראות | https://www.mybusiness.co.il/support/ממשק-התראות/ | Notifications interface (older duplicate of 2.1 entry) |
| מכירות | https://www.mybusiness.co.il/support/מכירות/ | The Sales entity and sales workflow |
| לידים | https://www.mybusiness.co.il/support/לידים/ | Working with leads |
| לקוחות ואנשי קשר | https://www.mybusiness.co.il/support/לקוחות-ואנשי-קשר/ | Accounts and contacts |
| הצעות מחיר | https://www.mybusiness.co.il/support/הצעות-מחיר/ | Price quotes: creation, versions, sending, digital signature |
| פניות | https://www.mybusiness.co.il/support/פניות/ | Cases (support tickets) |
| יומן ופעילויות | https://www.mybusiness.co.il/support/יומן-ופעילויות/ | Calendar and activities (incl. Google/Office sync) |
| שליחת SMS מהמערכת | https://www.mybusiness.co.il/support/שליחת-sms-מהמערכת/ | Sending SMS from the system |
| שליחת הודעת וואטסאפ מתוך המערכת | https://www.mybusiness.co.il/support/שליחת-הודעת-וואטסאפ-מתוך-המערכת/ | Sending WhatsApp messages from a record |
| ניהול לקוחות ואנשי קשר | https://www.mybusiness.co.il/support/managing-customers/ | Managing customers and contact persons (2026-03-14) |
| ניהול מכירות — טבלה ופייפליין | https://www.mybusiness.co.il/support/managing-sales/ | Sales via table view and kanban pipeline + sales dashboard (2026-03-14; spot-fetched) |
| ניהול מכירות — טבלה ופייפליין | https://www.mybusiness.co.il/support/sales-pipeline-table/ | ⚠️ Duplicate publication of the same article under a second slug (spot-fetched; same H1) |
| ניהול משימות ומעקב ביצוע | https://www.mybusiness.co.il/support/task-management/ | Task management and follow-up (2026-03-14) |
| ניהול פניות שירות ותמיכה | https://www.mybusiness.co.il/support/cases-service/ | Service/support case handling (2026-03-14) |
| שימוש ביומן ותיעוד פעילויות | https://www.mybusiness.co.il/support/calendar-activities/ | Using the calendar and logging activities (2026-03-14) |

### 2.4 עריכת כרטיסים במערכת (Editing record cards) — 6 published

| Hebrew title | URL | English summary |
|---|---|---|
| עריכת שדות בכרטיסי המערכת | https://www.mybusiness.co.il/support/עריכת-שדות-בכרטיסי-המערכת/ | Editing fields on system cards |
| הוספת שדות מותאמים אישית לכרטיסים | https://www.mybusiness.co.il/support/custom-fields/ | Adding custom fields (2026-03-18) |
| ניהול ערכי רשימה נפתחת (Drop-Down) | https://www.mybusiness.co.il/support/dropdown-values/ | Managing dropdown/lookup values (2026-03-14) |
| עריכת טופס כרטיס — סידור שדות ומבנה | https://www.mybusiness.co.il/support/edit-form-layout/ | Re-arranging card form layout (2026-03-14) |
| שדות מסוג Pointer — קישור בין טבלאות | https://www.mybusiness.co.il/support/pointer-fields/ | Pointer fields: linking tables (2026-03-14) |
| הוספת טבלת משנה (Sub-Table) לכרטיס | https://www.mybusiness.co.il/support/sub-tables/ | Adding a related-records sub-table to a card (2026-03-14) |

### 2.5 הקמת דפים וישויות (Pages & entities) — 4 published

| Hebrew title | URL | English summary |
|---|---|---|
| יצירת ישויות חדשות במערכת | https://www.mybusiness.co.il/support/יצירת-ישויות-חדשות-במערכת/ | Creating new entities (tables + pages) |
| יצירת טבלה חדשה (ישות) | https://www.mybusiness.co.il/support/create-new-table/ | Creating a new database table (2026-03-14) |
| בניית דף טופס לעריכת רשומה | https://www.mybusiness.co.il/support/form-page/ | Building a form page for editing records (2026-03-14) |
| בניית דף תצוגת טבלה | https://www.mybusiness.co.il/support/table-view-page/ | Building a table-view (list) page (2026-03-14) |

### 2.6 כללים ואוטומציות (Rules & automations) — 7 published

| Hebrew title | URL | English summary |
|---|---|---|
| יצירת טריגרים | https://www.mybusiness.co.il/support/יצירת-טריגרים/ | Core trigger guide: data-change vs scheduled triggers, AND-criteria, 8 action types (HTTP, email, notification, SMS, create-object, update-object, server-side code, WhatsApp) — spot-fetched |
| כללים אוטומטיים — Form Rules | https://www.mybusiness.co.il/support/כללים-אוטומטיים/ | Client-side form rules (legacy guide) |
| כללים אוטומטיים וטריגרים — מתי נשתמש בכל אחד | https://www.mybusiness.co.il/support/כללים-אוטומטיים-וטריגרים-מתי-נשתמש-בכ/ | Form Rules vs Triggers: where they run, when they fire, which actions each supports |
| כללי טפסים (Form Rules) — הסתרה, חובה וערכים דינמיים | https://www.mybusiness.co.il/support/form-rules/ | New Form Rules guide: 8 actions (readonly, required, hidden, fixed/dynamic/formula value, show-message, value-from-URL), AND default + OR (`condOr`) — updated 2026-06-08, spot-fetched |
| מדריך מתקדם לטריגרים — פעולות, תנאים ותזמון | https://www.mybusiness.co.il/support/triggers-advanced/ | Advanced triggers: onSetFields, oneachupdate, scheduling, dynamic content (2026-03-14) |
| אוטומציה מעשית — 10 דוגמאות שימושיות | https://www.mybusiness.co.il/support/automation-examples/ | 10 worked automation examples (2026-03-14) |
| זרימות עבודה ויזואליות (Visual Workflow) | https://www.mybusiness.co.il/support/visual-workflows/ | Visual workflow builder (2026-03-14) |

### 2.7 ניתוח נתונים ובקרה / עריכת דשבורדים (Analytics & dashboards) — 6 published

| Hebrew title | URL | English summary |
|---|---|---|
| שאילתות | https://www.mybusiness.co.il/support/שאילתות/ | Dynamic queries (filtered data sets) |
| דוחות | https://www.mybusiness.co.il/support/דוחות/ | Reports: flat and aggregated, scheduling |
| הוספת גרפים ותרשימים לדף | https://www.mybusiness.co.il/support/charts-and-graphs/ | Adding charts to pages (2026-03-14) |
| בניית דשבורד — מונים, גרפים וטבלאות | https://www.mybusiness.co.il/support/dashboard-building/ | Building dashboards: counters, charts, tables (2026-03-14) |
| דשבורד מנהל — KPIs ובקרת ביצועים | https://www.mybusiness.co.il/support/manager-dashboard/ | Manager KPI dashboard (2026-03-14) |
| יצירת דוחות ושאילתות מותאמים | https://www.mybusiness.co.il/support/reports-and-queries/ | Custom reports & queries — updated 2026-06-08 |

### 2.8 ייבוא ייצוא ועדכון נתונים (Import/export & bulk update) — 4 published

| Hebrew title | URL | English summary |
|---|---|---|
| עדכון גורף דרך שאילתות | https://www.mybusiness.co.il/support/עדכון-גורף-דרך-שאילתות/ | Bulk-updating records through queries |
| ייבוא וייצוא טבלאות | https://www.mybusiness.co.il/support/ייבוא-וייצוא-טבלאות/ | Importing/exporting tables (CSV/Excel) |
| ייבוא לקוחות ונתונים מ-CSV/Excel | https://www.mybusiness.co.il/support/import-csv/ | CSV/Excel import walkthrough (2026-03-14) |
| ייצוא נתונים וגיבוי טבלאות | https://www.mybusiness.co.il/support/export-backup/ | Exporting data and backing up tables (2026-03-14) |

### 2.9 הגדרות אבטחה (Security) — 5 published

| Hebrew title | URL | English summary |
|---|---|---|
| אימות דו שלבי | https://www.mybusiness.co.il/support/אימות-דו-שלבי/ | Two-factor authentication |
| הגבלת IP | https://www.mybusiness.co.il/support/הגבלת-ip/ | IP-based access restriction |
| הרשאות מתקדמות | https://www.mybusiness.co.il/support/הרשאות-מתקדמות/ | Advanced (row-level) permissions in the dev environment: per-table rules, e.g. "sales rep sees only own accounts (OwnerId = current user)", team/branch hierarchies |
| ניהול תפקידים והרשאות | https://www.mybusiness.co.il/support/roles-permissions/ | Roles & permissions management (2026-03-14) |
| הרשאות מתקדמות — סינון נתונים לפי משתמש | https://www.mybusiness.co.il/support/advanced-permissions/ | Advanced permissions: per-user data filtering (2026-03-14) |

### 2.10 MyBooks (invoicing/accounting) — 29 published

| Hebrew title | URL | English summary |
|---|---|---|
| רישום למערכת | https://www.mybusiness.co.il/support/רישום-למערכת/ | MyBooks signup |
| ניווט-ותפריטים | https://www.mybusiness.co.il/support/ניווט-ותפריטים-2/ | MyBooks navigation and menus |
| הגדרות פרטי עסק | https://www.mybusiness.co.il/support/הגדרות-פרטי-עסק/ | Business details settings |
| הגדרות מסמכים | https://www.mybusiness.co.il/support/הגדרות-מסמכים/ | Document settings (numbering etc.) |
| הגדרת מוצרים | https://www.mybusiness.co.il/support/הגדרת-מוצרים/ | Product catalog setup |
| הגדרות תבניות | https://www.mybusiness.co.il/support/הגדרות-תבניות/ | Document template settings |
| הגדרות סליקה | https://www.mybusiness.co.il/support/הגדרות-סליקה/ | Credit-card clearing (payment processing) setup |
| סוגי מסמכים | https://www.mybusiness.co.il/support/5787/ | Document types (tax invoice, invoice-receipt, proforma, credit, delivery note, receipt…) |
| לקוחות | https://www.mybusiness.co.il/support/לקוחות/ | MyBooks customer records |
| יצירת מסמך חדש | https://www.mybusiness.co.il/support/יצירת-מסמך-חדש/ | Creating a new accounting document |
| הפקת מסמך ראשון | https://www.mybusiness.co.il/support/הפקת-מסמך-ראשון/ | Issuing your first document |
| טיוטות | https://www.mybusiness.co.il/support/טיוטות/ | Document drafts |
| מסמכים שהופקו | https://www.mybusiness.co.il/support/מסמכים-שהופקו/ | Issued documents list |
| מסמכים מקושרים | https://www.mybusiness.co.il/support/מסמכים-מקושרים/ | Linked documents (doc chains) |
| שיוך מסמך לחשבונית מס | https://www.mybusiness.co.il/support/שיוך-מסמך-לחשבונית-מס/ | Attaching a document to a tax invoice |
| שיוך מסמך לחשבונית עסקה | https://www.mybusiness.co.il/support/שיוך-מסמך-לחשבונית-עסקה/ | Attaching a document to a proforma invoice |
| הפקת מסמך מתוך הזמנת עבודה | https://www.mybusiness.co.il/support/הפקת-מסמך-מתוך-הזמנת-עבודה/ | Issuing a document from a work order |
| גבייה | https://www.mybusiness.co.il/support/גבייה/ | Collections (payment follow-up) |
| שליחת מסמך במייל | https://www.mybusiness.co.il/support/שליחת-מסמך-במייל/ | Emailing documents |
| דף / כפתור תשלום | https://www.mybusiness.co.il/support/דף-כפתור-תשלום/ | Client-facing payment page/button |
| ניהול מלאי | https://www.mybusiness.co.il/support/ניהול-מלאי/ | Inventory management |
| ניהול מלאי מוצר | https://www.mybusiness.co.il/support/ניהול-מלאי-מוצר/ | Per-product inventory |
| הגדרות ניהול מלאי | https://www.mybusiness.co.il/support/הגדרות-ניהול-מלאי/ | Inventory settings |
| ייצוא קבצים במבנה אחיד | https://www.mybusiness.co.il/support/ייצוא-קבצים-במבנה-אחיד/ | Uniform-format export (Israeli tax authority / accounting software) |
| שאילתות | https://www.mybusiness.co.il/support/שאילתות-2/ | MyBooks queries |
| דוחות הכנסות | https://www.mybusiness.co.il/support/דוחות-הכנסות/ | Income reports |
| דוחות תקבולים | https://www.mybusiness.co.il/support/דוחות-תקבולים/ | Receipts reports |
| הגדרות ריטיינר | https://www.mybusiness.co.il/support/הגדרות-ריטיינר/ | Retainers: periodic auto-issuing of docs, recurring credit-card charging, monthly→yearly cycles, auto-email, charge/error report |
| חשבונית ישראל — קבלת מספרי הקצאה לחשבוניות | https://www.mybusiness.co.il/support/חשבונית-ישראל-קבלת-מספרי-הקצאה-לחשבונ/ | Israel Invoice: allocation numbers from the Tax Authority for invoices ≥ ₪20,000 pre-VAT (2025 rule), OAuth-style connect flow |

### 2.11 MyCampaigns — 6 published

| Hebrew title | URL | English summary |
|---|---|---|
| MyCampains | https://www.mybusiness.co.il/support/mycampains/ | MyCampaigns module overview (note: typo in original slug/title) |
| שליחת דיוור | https://www.mybusiness.co.il/support/שליחת-דיוור/ | Sending an email/SMS campaign |
| קבוצות דיוור | https://www.mybusiness.co.il/support/קבוצות-דיוור/ | Campaign (mailing) groups / audience segmentation |
| עריכת תבנית מייל | https://www.mybusiness.co.il/support/עריכת-תבנית-מייל/ | Email template editor |
| דפי נחיתה | https://www.mybusiness.co.il/support/דפי-נחיתה/ | Landing pages for lead capture |
| הגדרת חשבון WhatsApp | https://www.mybusiness.co.il/support/הגדרת-חשבון-whatsapp/ | Connecting a WhatsApp Business account |

### 2.12 MyChat — 8 published

| Hebrew title | URL | English summary |
|---|---|---|
| הגדרות והקמה | https://www.mybusiness.co.il/support/הגדרות-והקמה/ | MyChat setup & configuration |
| הרשאות ערוצים למשתמשים ופרופילים | https://www.mybusiness.co.il/support/הרשאות-ערוצים-ומשתמשים/ | Channel permissions per user/profile |
| תפריט מערכת MyChat ומבנה דפי השיחות | https://www.mybusiness.co.il/support/תפריט-מערכת-mychat/ | MyChat menu and conversation-page structure |
| ניהול שיחה ופתיחת שיחה יזומה | https://www.mybusiness.co.il/support/ניהול-שיחה/ | Managing conversations; initiating outbound conversations |
| קישור שיחה ללקוח, איש קשר, מכירה ופנייה | https://www.mybusiness.co.il/support/קישור-שיחה-ללקוח-איש-קשר-מכירה-ופנייה/ | Linking a conversation to Account/Contact/Sale/Case |
| פתיחת שיחה מתוך כרטיס הלקוח ב-CRM | https://www.mybusiness.co.il/support/פתיחת-שיחה-מתוך-כרטיס-הלקוח-בcrm/ | Starting a chat from the account card |
| הצגת שיחות מהצ'אטבוט ב-MyChat ובכרטיס הלקוח | https://www.mybusiness.co.il/support/הצגת-שיחות-מהצאטבוט-ב-mychat-ובכרטיס-הלקוח/ | Surfacing chatbot conversations in MyChat and on the account card |
| צ'אטבוטים | https://www.mybusiness.co.il/support/צאטבוטים/ | Chatbots intro (links to the chatbot category) |

### 2.13 צ'אטבוטים (Chatbots) — 9 published

| Hebrew title | URL | English summary |
|---|---|---|
| יצירת צ'אטבוט | https://www.mybusiness.co.il/support/יצירת-צאטבוט/ | Creating a chatbot |
| הגדרות בסיסיות וכפתורי שימוש בצ'אטבוט | https://www.mybusiness.co.il/support/הגדרות-בסיסיות-וכפתורי-שימוש-בצאטבוט/ | Chatbot basic settings and buttons |
| שליחת הודעה | https://www.mybusiness.co.il/support/שליחת-הודעה/ | Bot "send message" node |
| סוגי פעולות בצ'אטבוט | https://www.mybusiness.co.il/support/סוגי-פעולות-בצאטבוט/ | Chatbot action node types |
| ניתוב שיחה | https://www.mybusiness.co.il/support/ניתוב-שיחה/ | Conversation routing (to agents/teams) |
| שימוש חכם בנתונים | https://www.mybusiness.co.il/support/שימוש-חכם-בנתונים/ | Using CRM data inside bot flows |
| שליחת הודעה מחוץ לבוט | https://www.mybusiness.co.il/support/שליחת-הודעה-מחוץ-לבוט/ | Sending messages outside the bot flow (e.g. via trigger/template) |
| שימוש בסוכן AI בצ'אטבוט | https://www.mybusiness.co.il/support/שימוש-בסוכן-ai-בצאטבוט/ | Embedding an AI agent in a chatbot |
| הגדרת לוחות זמנים לפי שעות פעילות | https://www.mybusiness.co.il/support/הגדרת-לוחות-זמנים-לפי-שעות-פעילות/ | Business-hours schedules for bot behavior |

### 2.14 שרת MCP (MCP server / AI tools) — 5 published

| Hebrew title | URL | English summary |
|---|---|---|
| שרת MCP — שאלות ותשובות נפוצות | https://www.mybusiness.co.il/support/שרת-mcp-שאלות-ותשובות-נפוצות/ | MCP FAQ: what MCP is, security (session-bound auth), permission inheritance, no technical skill needed |
| מתן הרשאות MCP למשתמשים במערכת | https://www.mybusiness.co.il/support/מתן-הרשאות-mcp-למשתמשים-במערכת/ | Granting/limiting MCP operation types per user (admin) |
| הסבר על הכלים השונים בשרת ה-MCP של MyBusiness | https://www.mybusiness.co.il/support/הסבר-על-הכלים-השונים-בשרת-ה-mcp-של-mybusiness/ | Tour of the MCP tool set |
| חיבור MCP ל- Claude.ai | https://www.mybusiness.co.il/support/חיבור-ל-claude-ai/ | Connecting the MCP server to Claude.ai |
| חיבור MCP עם ChatGPT | https://www.mybusiness.co.il/support/חיבור-mcp-עם-chatgpt/ | Connecting the MCP server to ChatGPT |

### 2.15 API / כלים למפתחים (Developer tools) — 5 published

| Hebrew title | URL | English summary |
|---|---|---|
| API | https://www.mybusiness.co.il/support/api/ | API overview (keys, auth) |
| Rest API | https://www.mybusiness.co.il/support/rest-api/ | Parse-style REST API usage |
| זאפייר | https://www.mybusiness.co.il/support/זאפייר/ | Zapier integration (incl. Facebook lead capture) |
| Web2Lead — קליטת לידים מדפי נחיתה וטפסים חיצוניים | https://www.mybusiness.co.il/support/web2lead/ | Capturing leads from external forms/landing pages (2026-03-14) |
| REST API — מדריך מהיר לשימוש ב-API | https://www.mybusiness.co.il/support/rest-api-quickstart/ | REST API quickstart (2026-03-14) |

### 2.16 כלים נוספים (Simbla platform docs, English) — 22 published

Legacy English documentation of the underlying Simbla no-code platform (site builder + online database), published under the same support taxonomy.

| Title | URL | English summary |
|---|---|---|
| Create a website | https://www.mybusiness.co.il/support/create-a-website/ | Site builder basics |
| Getting started | https://www.mybusiness.co.il/support/getting-started/ | Platform getting started |
| Create Database | https://www.mybusiness.co.il/support/Create-your-first-online-database/ | Creating your first online database |
| Users | https://www.mybusiness.co.il/support/users/ | Platform user management |
| Roles & Advanced Permissions | https://www.mybusiness.co.il/support/roles-advanced-permissions/ | Roles, CLP and advanced permission rules |
| Tables | https://www.mybusiness.co.il/support/tables/ | Database tables |
| Triggers & Notifications | https://www.mybusiness.co.il/support/triggers-notifications/ | Platform triggers & notifications |
| Import / Export table | https://www.mybusiness.co.il/support/import-export-table/ | Table import/export |
| Web Widgets | https://www.mybusiness.co.il/support/web-widgets/ | Database-connected web widgets overview |
| widget-Registration | https://www.mybusiness.co.il/support/widget-registration/ | Registration widget |
| widget-Login/Logout | https://www.mybusiness.co.il/support/widget-login-logout/ | Login/logout widget |
| Form to database | https://www.mybusiness.co.il/support/form-to-database/ | Form-to-database widget |
| Date table/grid | https://www.mybusiness.co.il/support/date-table-grid/ | Data table/grid widget |
| Search form tool | https://www.mybusiness.co.il/support/search-form-tool/ | Search form widget |
| Database gallery | https://www.mybusiness.co.il/support/database-gallery/ | Database gallery widget |
| Charts & Counters | https://www.mybusiness.co.il/support/charts-counters/ | Chart and counter widgets |
| Charts Dynamic data grid | https://www.mybusiness.co.il/support/charts-dynamic-data-grid/ | Dynamic data grid widget |
| Dynamic Page Widget | https://www.mybusiness.co.il/support/dynamic-page-widget/ | Dynamic (record-bound) page widget |
| Pointer | https://www.mybusiness.co.il/support/pointer/ | Pointer field concept |
| Javascript | https://www.mybusiness.co.il/support/javascript/ | Custom JavaScript on pages (sdk basics) |
| Objects CRUD | https://www.mybusiness.co.il/support/objects-crud/ | JS object CRUD (Parse-style API) |
| Queries | https://www.mybusiness.co.il/support/queries/ | JS query API |

### 2.17 General / uncategorized — 3 published

| Hebrew title | URL | English summary |
|---|---|---|
| איך זה עובד? | https://www.mybusiness.co.il/support/איך-זה-עובד/ | "How it works" intro stub |
| היכרות עם סביבת הפיתוח | https://www.mybusiness.co.il/support/היכרות-עם-סביבת-הפיתוח/ | Tour of the development environment (database, pages, settings) |
| לוג שינויים — עדכוני מוצר MyBusiness | https://www.mybusiness.co.il/support/product-changelog/ | Product changelog 2024 → 2026: AI agents, OR conditions in triggers/form rules (Jan 2026), trigger copy, role-filtered Excel export, OAuth interface (Mar 2026) — spot-fetched |

---

## 3. Spot-fetched articles (live-content verification, 2026-06-10)

| Article | Verified |
|---|---|
| `/support/` hub | Structure: 5 theme links + Q&A link |
| `/support/sales-pipeline-table/` | H1 identical to `/support/managing-sales/` → duplicate slug publication |
| `/support/managing-sales/` | H1 ניהול מכירות – טבלה ופייפליין; pipeline + table + dashboard |
| `/support/product-changelog/` | Changelog 2024–2026/03; 10 recent entries captured |
| `/supportnewsearch/שאלות-ותשובות/` | 10 marketing FAQ items captured |
| `/support/יצירת-טריגרים/` | 2 trigger types, AND criteria, 8 action types — matches local export |
| `/support/form-rules/` | 8 rule actions + OR (`condOr`) support — newer than the local draft |

---

## 4. Cross-check: live site vs local KB export

A WP REST API export of www.mybusiness.co.il generated **2026-02-06** captured the published content set: 229 posts (blog), 50 pages, 120 support guides, 12 plans, 31 Elementor templates, 7 team — a filtered support-guides subset (120 guides with id/title/slug/dates/status/link per item) is the basis for this catalog's cross-check.

**Verdict: the local export covers 116 of 152 live articles (76%). It is a faithful snapshot of the site as of 2026-02-06; everything published since (36 articles) is missing locally — but 34 of those 36 exist locally as markdown drafts in `Guides_Draft\`.**

### 4.1 Site articles missing from the local export (36)

All published 2026-03-14 unless noted. Mapping to local draft source where it exists:

| Live slug | Local draft source (`Guides_Draft\`) |
|---|---|
| getting-started-2 | guide_getting_started.md |
| system-tour | guide_system_tour.md |
| initial-setup | guide_initial_setup.md |
| first-records | guide_first_records.md |
| glossary | guide_glossary.md |
| managing-customers | guide_managing_customers.md |
| managing-sales | guide_managing_sales.md |
| sales-pipeline-table | guide_managing_sales.md (⚠️ duplicate slug) |
| task-management | guide_task_management.md |
| cases-service | guide_cases_service.md |
| calendar-activities | guide_calendar_activities.md |
| custom-fields (2026-03-18) | guide_custom_fields.md |
| dropdown-values | guide_dropdown_values.md |
| edit-form-layout | guide_edit_form.md |
| pointer-fields | guide_pointer_fields.md |
| sub-tables | guide_sub_tables.md |
| create-new-table | guide_create_table.md |
| form-page | guide_form_page.md |
| table-view-page | guide_table_view_page.md |
| form-rules (upd. 2026-06-08) | guide_form_rules.md |
| triggers-advanced | guide_triggers_advanced.md |
| automation-examples | guide_automation_examples.md |
| visual-workflows | guide_visual_workflows.md |
| charts-and-graphs | guide_charts_graphs.md |
| dashboard-building | guide_dashboard_building.md |
| manager-dashboard | guide_manager_dashboard.md |
| reports-and-queries (upd. 2026-06-08) | guide_reports_queries.md |
| import-csv | guide_import_csv.md |
| export-backup | guide_export_backup.md |
| roles-permissions | guide_roles_permissions.md |
| advanced-permissions | guide_advanced_permissions.md |
| myinbox-setup | guide_myinbox_setup.md |
| myinbox-usage | guide_myinbox_usage.md |
| web2lead | guide_web2lead.md |
| rest-api-quickstart | guide_rest_api_quickstart.md |
| product-changelog (2026-03-16) | — none (brand-new page) |

### 4.2 Local-export items NOT on the live site (4)

All four are WordPress drafts (`status: "draft"` in frontmatter, `?post_type=support&p=N` permalinks) — captured by the export but never published:

| WP id | Hebrew title | Category |
|---|---|---|
| 5917 | שירותים נוספים | — |
| 6031 | הגדרות לקוחות ולידים | — |
| 5233 | קבוצת דיוור | MyCampaigns (superseded by published קבוצות דיוור, id 5820) |
| 4700 | הגדרות תפקיד מתקדמות | צעדים ראשונים |

---

## 5. Drafts catalog — `Guides_Draft\` (NOT published as of folder creation; 34 since published)

47 files: 43 product guide drafts (frontmatter `status: "draft"`, `type: "support"`, planned `support-cata` category) + 1 authoring playbook + 1 evaluation doc + 1 upgrade plan + 2 temp artifacts. Status column reflects the live site as of **2026-06-10**.

### 5.1 Guide drafts — since PUBLISHED (34, see §4.1 for slugs)

guide_advanced_permissions, guide_automation_examples, guide_calendar_activities, guide_cases_service, guide_charts_graphs, guide_create_table, guide_custom_fields, guide_dashboard_building, guide_dropdown_values, guide_edit_form, guide_export_backup, guide_first_records, guide_form_page, guide_form_rules, guide_getting_started, guide_glossary, guide_import_csv, guide_initial_setup, guide_manager_dashboard, guide_managing_customers, guide_managing_sales, guide_myinbox_setup, guide_myinbox_usage, guide_pointer_fields, guide_reports_queries, guide_rest_api_quickstart, guide_roles_permissions, guide_sub_tables, guide_system_tour, guide_table_view_page, guide_task_management, guide_triggers_advanced, guide_visual_workflows, guide_web2lead.

⚠️ For form-rules and reports-and-queries the live versions were updated 2026-06-08 and are newer than the local drafts.

### 5.2 Guide drafts — still UNPUBLISHED (8)

| Draft file | Hebrew title | Planned category | English summary |
|---|---|---|---|
| guide_javascript_api.md | JavaScript API — שאילתות ואגרגציות | API | Client-side JS API: queries and aggregations |
| guide_webhooks.md | Webhooks וטריגרי HTTP | API | Outbound webhooks / HTTP trigger actions |
| guide_web2table.md | Web2Table — יצירת רשומות מטפסים חיצוניים | API | Creating records in any table from external forms |
| guide_web2update.md | Web2Update — עדכון רשומות ושליחת קבצים מטפסים חיצוניים | כלים למפתחים | Updating records / uploading files from external forms |
| guide_zapier_integration.md | חיבור MyBusiness ל-Zapier | כלים למפתחים | Zapier integration (a 2024-era זאפייר guide is already live) |
| guide_pbx_integration.md | חיבור מרכזייה טלפונית למערכת | הגדרות מערכת בסיסיות | PBX/telephony integration |
| guide_mycollege_setup.md | הקמת מערכת הדרכות עם MyCollege | הגדרות מערכת בסיסיות | Setting up MyCollege (courses/training) |
| guide_mycollege_management.md | ניהול קורסים, תלמידים ומבחנים | הגדרות מערכת בסיסיות | Managing courses, students and exams |

### 5.3 Internal / non-guide files in the drafts folder (NOT for publication)

| File | What it is |
|---|---|
| guide_authoring_playbook.md | Internal playbook for writing the WordPress guides (style, structure, image placeholders) |
| simbla_relevance_evaluation.md | Internal evaluation of which Simbla docs remain relevant |
| wordpress_upgrade_plan.md | Internal plan for the guides-site refresh |
| tmpclaude-a251-cwd, tmpclaude-cc83-cwd | Temp artifacts (ignore) |

---

## 6. Other public content on the domain (out of catalog scope)

- **229 blog posts** (`post-sitemap.xml`, local `post_*.md`) — marketing/SEO articles, not product guides.
- **50 pages + 12 plans + price plans** — marketing site, pricing.
- **Q&A page** (`/supportnewsearch/שאלות-ותשובות/`) — 10 presales-level Q&As (cataloged in §1; synthesized into `02-faq-troubleshooting.md`).

---

## Limitations & gotchas

- **Local export is stale (2026-02-06).** 36 live articles are missing from `guides_only\`; for 34 of them the nearest local source is the *draft* markdown, which may differ from the published HTML (confirmed differences: form-rules and reports-and-queries were updated on-site 2026-06-08). Refresh the export before relying on local content for these.
- **English titles/summaries for the 30 unfetched March-2026 articles are taken from their draft sources**, not the live pages. Spot-checks (4 articles) showed H1s match the drafts, but minor editorial changes on-site are possible. ⚠️ UNVERIFIED at the individual-article level.
- **Duplicate publication:** `/support/managing-sales/` and `/support/sales-pipeline-table/` serve the same article under two slugs — likely a publishing error; may be consolidated later (links could break).
- **Category counts in `guides_manifest.json` taxonomy block are pre-March-2026** and do not include the new wave; the per-article `support-cata` frontmatter is the reliable category source.
- **Mixed languages and eras:** the 22 "כלים נוספים" articles are legacy English Simbla-platform docs; some screenshots/UI references predate the May 2026 redesign of the CRM UI.
- **Hebrew IRIs:** URLs are shown decoded; some tools require the percent-encoded form (see `guides_manifest.json` for exact encoded links and WP post IDs).
- **`/support/5787/`** (סוגי מסמכים) has a numeric slug — title-based linking will not work for it.
- The site's WP REST API (`/wp-json/wp/v2/support`) was the export source and remains the most reliable way to re-enumerate articles programmatically; the Yoast sitemap omits WP drafts by design.
