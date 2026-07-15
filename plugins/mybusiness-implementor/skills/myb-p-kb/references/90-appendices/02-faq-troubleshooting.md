# שאלות נפוצות ופתרון תקלות (FAQ & Troubleshooting)

> **Purpose:** ~45 synthesized Q&A pairs covering the questions implementers and support agents actually face — data & fields, pages, automations, permissions, billing, messaging, limits, and the canonical debugging method. Answers are condensed from the official guides and the internal L2 support knowledge.
> **Last updated:** 2026-06-10 · **Status:** draft

Conventions: questions in Hebrew (as customers ask them), answers in English. "Guide:" points to the official article; "Ref:" points to internal references or other product-docs files.

---

## 1. נתונים ושדות (Data & fields)

**ש: איך מוסיפים שדה חדש לכרטיס (למשל בכרטיס לקוח)?**
Add the field to the table (type: String, Number, Boolean, Date, Pointer, File…), then place it on the card's form page via the page editor. Via MCP: `Add-Field-to-Table`, then `Edit-Page` to position it. New fields are not visible until added to a page layout.
Guide: https://www.mybusiness.co.il/support/custom-fields/ · https://www.mybusiness.co.il/support/עריכת-שדות-בכרטיסי-המערכת/

**ש: מה ההבדל בין ליד ללקוח במסד הנתונים?**
They are the same table — `Accounts`. The boolean `IsAccount` distinguishes them (`false` = lead, `true` = customer). Lead conversion sets `IsAccount=true` and typically records `ConversionDate` via a trigger. Queries/reports on "customers only" must filter on `IsAccount`.
Ref: the support reference, the schema reference · Guide: https://www.mybusiness.co.il/support/לידים/

**ש: איך יוצרים שדה בחירה (רשימה נפתחת) ואיך מנהלים את הערכים שלו?**
Dropdowns in MyBusiness are usually Pointer fields to a small lookup table (e.g. `AccountStatuses`); the dropdown options are that table's rows. Add/rename/disable options by editing the lookup table's records, not the field itself.
Guide: https://www.mybusiness.co.il/support/dropdown-values/ · https://www.mybusiness.co.il/support/pointer-fields/

**ש: מהו שדה Pointer ומה הפורמט שלו ב-API?**
A Pointer links a record to a record in another table (like a foreign key). In REST/MCP payloads it must be written as `{"__type":"Pointer","className":"TableName","objectId":"xxx"}` — passing a bare string id will fail or save garbage. Dates similarly require `{"__type":"Date","iso":"YYYY-MM-DDTHH:MM:SS.MSSZ"}`.
Ref: the API reference, the MCP tool reference · Guide: https://www.mybusiness.co.il/support/pointer/

**ש: איך מייבאים לקוחות ונתונים מקובץ אקסל?**
Use the table import (CSV/Excel) from the admin/table interface: map file columns to table fields, then run the import. Any table can be imported into, not just Accounts.
Guide: https://www.mybusiness.co.il/support/import-csv/ · https://www.mybusiness.co.il/support/ייבוא-וייצוא-טבלאות/

**ש: למה ייבוא נתונים נכשל או שדות נשארים ריקים?**
Common causes: (1) Pointer columns must contain target `objectId` values, not display names; (2) date columns not in the expected format; (3) value type mismatch (String vs Number); (4) required-field rules. Fix the source file and re-import.
Ref: the support reference §7

**ש: איך מעדכנים שדה בהרבה רשומות בבת אחת (עדכון גורף)?**
Build a query (שאילתה) that filters the target records, then use the bulk-update action on the query results to set field values across all of them. Via API: batch requests (max 50 operations per batch).
Guide: https://www.mybusiness.co.il/support/עדכון-גורף-דרך-שאילתות/

**ש: איך מייצאים נתונים או מגבים טבלאות?**
Every table view supports Excel export; full tables can be exported from the table admin (ייצוא טבלאות). MyBooks additionally has a uniform-format export (מבנה אחיד) for the Israeli Tax Authority. Since March 2026, Excel export can be restricted by role.
Guide: https://www.mybusiness.co.il/support/export-backup/ · https://www.mybusiness.co.il/support/ייצוא-קבצים-במבנה-אחיד/

**ש: איך יוצרים ישות (טבלה) חדשה במערכת?**
Create the table in the dev environment (or `Create-Table` via MCP), add fields, then build its pages: a table-view (list) page and a form (card) page, and add a menu item. ⚠️ A table created via MCP starts with EMPTY class-level permissions — no role can read/write it until you call `Set-Table-Permissions`; in the UI flow permissions also need review.
Guide: https://www.mybusiness.co.il/support/create-new-table/ · https://www.mybusiness.co.il/support/יצירת-ישויות-חדשות-במערכת/ · Ref: the MCP tool reference

---

## 2. דפים ותצוגות (Pages & views)

**ש: איך משנים את סדר השדות ואת המבנה של כרטיס?**
Open the card's form page in the page editor and drag fields between rows/columns; group related fields into sections with headers. Via MCP: `Edit-Page` (add/remove/move fields and rows).
Guide: https://www.mybusiness.co.il/support/edit-form-layout/ · https://www.mybusiness.co.il/support/form-page/

**ש: איך מוסיפים טבלת רשומות מקושרות (טבלת משנה) לכרטיס?**
Add a sub-table element to the form page bound to the child table, filtered by the Pointer that links it to the current record (e.g. all Cases where `AccountId` = this account). Via MCP: `Add-Table-View-to-Form-Page`.
Guide: https://www.mybusiness.co.il/support/sub-tables/

**ש: איך בונים דף רשימה (תצוגת טבלה) חדש?**
Create a table-view page bound to the table: choose columns, default filters, sort and paging, and the edit mode (inline/modal). Via MCP: `Create-Table-View-Page`, then `Edit-Table-View` for columns/filters.
Guide: https://www.mybusiness.co.il/support/table-view-page/

**ש: איך בונים דשבורד עם מונים וגרפים?**
Build a page with counter elements (count/sum/avg/min/max over a table+filter) and chart elements (Bar/Line/Pie/Doughnut bound to a query or aggregation), plus embedded data tables. A manager-KPI variant is documented separately.
Guide: https://www.mybusiness.co.il/support/dashboard-building/ · https://www.mybusiness.co.il/support/charts-and-graphs/ · https://www.mybusiness.co.il/support/manager-dashboard/

**ש: שיניתי דף ונשבר משהו — איך חוזרים לגרסה קודמת?**
Pages keep version history. Via MCP: `Get-Page-Versions` to list saved versions and `Set-Page-Version` to roll back. Always note the current version before bulk page edits.
Ref: the MCP tool reference (Page & UI Management)

**ש: איך יוצרים דוח או שאילתה מותאמת?**
Queries (שאילתות) define filtered record sets; reports add grouping/aggregation (pivot), calculated fields, and scheduled email delivery. Built from the reports module or `Create-or-Update-Report` via MCP.
Guide: https://www.mybusiness.co.il/support/reports-and-queries/ · https://www.mybusiness.co.il/support/דוחות/ · https://www.mybusiness.co.il/support/שאילתות/

---

## 3. טריגרים ואוטומציות (Triggers & automations)

**ש: מה ההבדל בין כללים אוטומטיים (Form Rules) לטריגרים?**
Form Rules live on a specific page and run client-side the moment the condition is met while editing (before save); they can hide/require/lock fields, set values on the current card, and show messages. Triggers live on the table and run server-side only after save; they can update/create related records, send email/SMS/WhatsApp, fire webhooks and run server code. Rule of thumb: UI behavior → Form Rules; data/process automation → Triggers.
Guide: https://www.mybusiness.co.il/support/כללים-אוטומטיים-וטריגרים-מתי-נשתמש-בכ/

**ש: אילו סוגי טריגרים ופעולות קיימים?**
Two trigger types: data-change (on create/update) and scheduled (relative to a date field). Eight action types: email, SMS, WhatsApp message, notification, HTTP (webhook), create-object, update-object, server-side code. Conditions are AND by default; OR conditions were added in Jan 2026.
Guide: https://www.mybusiness.co.il/support/יצירת-טריגרים/ · https://www.mybusiness.co.il/support/triggers-advanced/ · Ref: [../30-customization/06-triggers-and-automations.md](../30-customization/06-triggers-and-automations.md)

**ש: מה זה onSetFields ו-oneachupdate בטריגר?**
`onSetFields` limits the trigger to fire only when specific fields change (e.g. only on `Status` change). `oneachupdate` controls repetition: `true` = fire on every update where conditions match; `false` = fire only the first time. Misunderstanding these two is the most common reason a trigger "randomly" fires or doesn't.
Ref: triggers-automation.md · Guide: https://www.mybusiness.co.il/support/triggers-advanced/

**ש: הטריגר לא ירה — מה בודקים?**
Checklist: (1) trigger `active` (absence of the field = active); (2) `events` includes the actual event (create/update); (3) all `criterias` matched the record values at event time; (4) `onSetFields` — did those fields actually change?; (5) `oneachupdate` false + already fired once; (6) for email actions — SMTP account valid; (7) for WhatsApp — template approved. Then read `_syslogTriggers` and `_Timeline` for evidence (see §8).
Ref: the support reference §2, the investigation method שלב 4

**ש: איך יוצרים טריגר מתוזמן (למשל תזכורת יום לפני פגישה)?**
Create a scheduled trigger watching a date field (`schedulerField`) with an hour offset in `shcedulerHours` (the misspelling is the real param name): **positive = before the date-field moment, negative = after it; `0` is rejected** (verified — use `1`/`-1` for "around that time"). Example: `24` = notification 24h before `DueDate`. Combine with criteria so it only fires for relevant records.
Guide: https://www.mybusiness.co.il/support/יצירת-טריגרים/ · Ref: triggers-automation.md

**ש: האם טריגר יכול להפעיל טריגר נוסף? יש הגבלה?**
Yes — an update-object/create-object action can satisfy another trigger's conditions, forming a chain. Chains are capped at 3 levels deep; design loops carefully (a trigger updating its own table can self-retrigger if `onSetFields` isn't scoped).
Ref: the MCP tool reference Best Practices, CLAUDE.md technical rules

**ש: איך שולחים מייל אוטומטי כששדה סטטוס משתנה?**
Data-change trigger on the table, event=update, `onSetFields=[StatusId]`, criteria on the new status value, action type `email` with a template, an SMTP account, and a recipient (fixed or a field — dot-notation like `AccountId.Accounts.Email` reaches the linked account's email). Requires a configured SMTP account.
Guide: https://www.mybusiness.co.il/support/יצירת-טריגרים/ · https://www.mybusiness.co.il/support/הגדרות-smtp-לשליחת-מייל-מהמערכת/

**ש: איך קוראים ל-Webhook או מערכת חיצונית מטריגר?**
Use the `http` action with the target URL (POST). This is how Make.com/Zapier/custom services are wired in. The record's data is posted to the URL; the external service does the rest. For inbound integration (external → CRM) use web2lead/web2table or the REST API.
Ref: triggers-automation.md · Guide: https://www.mybusiness.co.il/support/web2lead/ · ⚠️ Dedicated Webhooks guide exists only as an unpublished draft (guide_webhooks.md).

**ש: איך מכניסים תוכן דינמי (שם לקוח, סכום) להודעות אוטומטיות?**
Templates and message bodies accept `{{{FieldName}}}` placeholders, including dot-notation across pointers (e.g. `{{{AccountId.Accounts.Name}}}`). Works in email subject/body, SMS content, and notifications.
Ref: triggers-automation.md (action payloads)

---

## 4. הרשאות ומשתמשים (Permissions & users)

**ש: איך מוסיפים משתמש חדש למערכת?**
Create the user (name, email, password), assign a permission profile/role and a license package (e.g. Business/Enterprise — seat-limited). Via MCP: `Create-or-Update-User`, `Add-Users-to-Role`, `Set-Package-for-User`.
Guide: https://www.mybusiness.co.il/support/הוספת-משתמש-חדש-למערכת/ · https://www.mybusiness.co.il/support/ניהול-משתמשים-והרשאות-במערכת/

**ש: מהן דרישות הסיסמה?**
Minimum 8 characters with at least one lowercase letter, one uppercase letter and one digit. Applies to user creation and password resets (including via API/MCP).
Ref: the MCP tool reference, CLAUDE.md technical rules

**ש: משתמש לא רואה נתונים שהוא אמור לראות — מה בודקים?**
In order: (1) is the user in the right role (`Get-Roles` → `Get-Role-Users`)? (2) does the role have Find/Get on the table (class-level permissions)? (3) record-level ACL on the specific records; (4) advanced permission rules that row-filter by field (e.g. OwnerId = current user); (5) license package includes the module.
Ref: the support reference §1 · Guide: https://www.mybusiness.co.il/support/roles-permissions/

**ש: איך מגבילים איש מכירות לראות רק את הלקוחות שלו?**
Advanced permissions (dev environment → Databases → table → permissions): add a rule scoped to the Sales profile with condition `OwnerId == current user` on find/get. Admin keeps full visibility. Team/branch trees are supported — define the org hierarchy under Databases → Settings, then rule by team so each branch manager sees only their branch.
Guide: https://www.mybusiness.co.il/support/הרשאות-מתקדמות/ · https://www.mybusiness.co.il/support/advanced-permissions/

**ש: מה ההבדל בין הרשאות ברמת טבלה, רשומה ושדה?**
Table level (CLP): per-role Find/Get/Create/Update/Delete. Row level: advanced-permission rules filtering by field values (ownership, team). Record level: per-record ACL. All three stack — the most restrictive wins. Field-level hiding on forms is done with Form Rules or page layout, not CLP.
Ref: the product knowledge base (Permissions), the support reference §8

**ש: איך מגבילים גישה למערכת לפי כתובת IP, ואיך מפעילים אימות דו-שלבי?**
Both are security settings: IP restriction whitelists allowed addresses/ranges; 2FA adds a one-time code at login. Documented in the security settings guides.
Guide: https://www.mybusiness.co.il/support/הגבלת-ip/ · https://www.mybusiness.co.il/support/אימות-דו-שלבי/

**ש: האם משתמש שמתחבר דרך AI (MCP) עוקף הרשאות?**
No. The MCP server inherits the connecting user's permissions — the AI can only do what that user can. Admins can additionally restrict which MCP operation types are allowed per user. The MCP session dies when the CRM session ends.
Guide: https://www.mybusiness.co.il/support/מתן-הרשאות-mcp-למשתמשים-במערכת/ · https://www.mybusiness.co.il/support/שרת-mcp-שאלות-ותשובות-נפוצות/

---

## 5. MyBooks וחיובים (MyBooks / billing)

**ש: אילו מסמכים חשבונאיים אפשר להפיק?**
Tax invoice (חשבונית מס), invoice-receipt (חשבונית מס קבלה), proforma (חשבונית עסקה), credit invoice, receipt, delivery note, work order and more — each with linked-document chains (e.g. attach a receipt to a tax invoice).
Guide: https://www.mybusiness.co.il/support/5787/ (סוגי מסמכים) · https://www.mybusiness.co.il/support/מסמכים-מקושרים/

**ש: הפקתי מסמך בטעות — אפשר לערוך אותו?**
Issued documents are final (legal documents); only drafts (טיוטות) are editable. Correct an issued document with a counter-document — e.g. a credit invoice (חשבונית זיכוי) against a wrong tax invoice — and reissue.
Guide: https://www.mybusiness.co.il/support/טיוטות/ · https://www.mybusiness.co.il/support/מסמכים-שהופקו/

**ש: איך מגדירים ריטיינר (חיוב חוזר אוטומטי)?**
The retainer module auto-issues documents on a period basis (monthly, bi-monthly, quarterly, semi-annual, annual), optionally auto-charging a stored credit card (standing order) and auto-emailing the document. Supports fixed or variable billing plans and a charges/errors report.
Guide: https://www.mybusiness.co.il/support/הגדרות-ריטיינר/

**ש: מה זה מספרי הקצאה (חשבונית ישראל) והאם המערכת תומכת?**
Israeli Tax Authority requirement: invoices ≥ ₪20,000 before VAT (as of 01/01/2025) need an allocation number. MyBooks supports it natively — connect once to the Tax Authority from MyBooks settings (ID + user code), and qualifying invoices auto-request the number at issue time; it prints at the bottom of the document. Invoices without VAT cannot receive allocation numbers.
Guide: https://www.mybusiness.co.il/support/חשבונית-ישראל-קבלת-מספרי-הקצאה-לחשבונ/

**ש: איך גובים תשלום בכרטיס אשראי מלקוח?**
Configure clearing (סליקה — Pelecard integration), then either charge from a document, send a payment page/button to the customer, or set a retainer for recurring charges.
Guide: https://www.mybusiness.co.il/support/הגדרות-סליקה/ · https://www.mybusiness.co.il/support/דף-כפתור-תשלום/

**ש: איך מעבירים נתונים לרואה החשבון / חשבשבת?**
Use the uniform-format export (ייצוא במבנה אחיד) required by the Tax Authority, which Israeli accounting packages (Hashavshevet etc.) import. Income and receipts reports cover the rest.
Guide: https://www.mybusiness.co.il/support/ייצוא-קבצים-במבנה-אחיד/ · https://www.mybusiness.co.il/support/דוחות-הכנסות/

**ש: איך מפיקים הצעת מחיר ומחתימים לקוח דיגיטלית?**
Quotes are generated from a Sale (line items from SaleRows) using an HTML/PDF template with dynamic variables; send by email/SMS; the customer can approve with a digital signature. Statuses: טיוטה → נשלחה-בהמתנה לאישור → אושרה / בוטלה. Template must include the Signature/SignatureDate/SignatureName blocks for signing to work.
Guide: https://www.mybusiness.co.il/support/הצעות-מחיר/ · Ref: the support reference §4

---

## 6. הודעות ו-WhatsApp (Messaging & WhatsApp)

**ש: איך מגדירים שליחת מייל מהמערכת (SMTP)?**
Connect a mailbox under SMTP settings. Gmail: enable 2-Step Verification on the Google account, generate an App Password, and use it (not the account password) in the SMTP account. Office365 has its own flow. Without a valid SMTP account, manual and trigger emails won't send.
Guide: https://www.mybusiness.co.il/support/הגדרות-smtp-לשליחת-מייל-מהמערכת/

**ש: מייל לא נשלח — מה בודקים?**
(1) SMTP account exists and authenticates (`Get-SMTP-Accounts`); (2) the email template exists; (3) the recipient field actually contains an address; (4) check `_syslogEvents` for delivery errors; (5) for Gmail — app password expired/revoked after a Google security change.
Ref: the support reference §6

**ש: איך מחברים WhatsApp למערכת?**
Connect a WhatsApp Business API account as a channel (MyCampaigns/MyChat settings). Outbound business-initiated messages require pre-approved templates; free-form replies are only possible inside the 24h customer-service window of an active conversation.
Guide: https://www.mybusiness.co.il/support/הגדרת-חשבון-whatsapp/ · https://www.mybusiness.co.il/support/הגדרות-והקמה/

**ש: הודעת וואטסאפ לא נשלחת — מה בודקים?**
(1) Use the `Identity` value from the Channels table as the sender — NOT the channel's `objectId` (the most common integration bug); (2) template status must be APPROVED; (3) recipient number in international format; (4) channel connected and active in MyChat settings; (5) check `_syslogEvents` for the send error.
Ref: the support reference §5, CLAUDE.md technical rules

**ש: איך שולחים SMS, ומה צריך בשביל זה?**
SMS sends manually from a record or automatically via trigger action, with dynamic `{{{field}}}` content and a sender number. SMS/WhatsApp sending is credit-based (purchased per message).
Guide: https://www.mybusiness.co.il/support/שליחת-sms-מהמערכת/ · Ref: the product knowledge base (MyCampaigns)

**ש: איך בונים צ'אטבוט ומחברים אותו ל-AI?**
Build a bot in the visual flow editor (nodes: send message, action types, routing); schedule by business hours; optionally add an AI agent node backed by a knowledge base for free-text answers. Bot conversations surface in MyChat and on the linked account card.
Guide: https://www.mybusiness.co.il/support/יצירת-צאטבוט/ · https://www.mybusiness.co.il/support/שימוש-בסוכן-ai-בצאטבוט/ · https://www.mybusiness.co.il/support/ניתוב-שיחה/

**ש: שיחת וואטסאפ נכנסת לא מקושרת ללקוח — למה?**
Conversations auto-link by matching the sender's phone number to Accounts/Contacts. Mismatched formats (e.g. local 05X vs +9725X) or numbers stored in non-phone fields break matching; link manually from the conversation, or normalize phone data.
Guide: https://www.mybusiness.co.il/support/קישור-שיחה-ללקוח-איש-קשר-מכירה-ופנייה/ · ⚠️ matching internals UNVERIFIED beyond the guide's manual-link flow.

---

## 7. ביצועים ומגבלות (Performance & limits)

**ש: כמה רשומות מחזירה שאילתת API/MCP?**
MCP `Get-Data`: default 5 records, max 2000 per call (paginate with `skip`/`order`). REST API: default 100, also paginated. Counting is cheaper with `Count-Data` than fetching.
Ref: the MCP tool reference, the API reference

**ש: מה המגבלות החשובות בעבודה עם טריגרים ואוטומציות?**
Trigger chains: max 3 levels. Batch API: max 50 operations per call. Aggregations: the `groupby` field must be a String, not an Object/Pointer. Scheduled triggers fire relative to a date field, not cron expressions.
Ref: the MCP tool reference, CLAUDE.md technical rules

**ש: למה דוח/אגרגציה נכשלים על שדה קיבוץ?**
Group-by must run on a String-type field. To group by a Pointer (e.g. status), group on a denormalized string copy (e.g. a StatusName field maintained by trigger) or use the report builder's display name handling.
Ref: the MCP tool reference (Aggregate-Data)

**ש: המערכת איטית בדף מסוים — מאיפה מתחילים?**
Check the page's data elements: table views with no default filter loading huge tables, multiple counters/charts each running queries, or custom JS. Narrow default filters and column counts first. For systemic slowness contact support.
⚠️ UNVERIFIED — no official performance-tuning guide exists; this reflects internal practice only.

**ש: כמה טבלאות ושדות יש במערכת, ומה הטבלה המרכזית?**
A stock system ships ~196 tables / ~2,592 fields / 766 pointer relationships. `Accounts` is the hub (referenced by 46+ tables); `Sales` is the most complex (133 fields, 57 pointers). Custom tables add to this.
Ref: [../20-data-model/01-data-model-overview.md](../20-data-model/01-data-model-overview.md), CLAUDE.md

---

## 8. שיטת תחקור — איך חוקרים תקלה (Debugging method)

**ש: "האוטומציה לא עבדה" — איך חוקרים טענה כזו צעד-אחר-צעד?**
(0) Pin down the claim: exact record (number/objectId), exact time, expected behavior. (1) Fetch the record (`Get-Data`) and verify `createdAt`/current values match the story. (2) Read `_Timeline` for the record — the ground truth of every change. (3) Read `_syslogTriggers` for trigger runs/errors. (4) Inspect the trigger config (`Get-Triggers`): active, events, criterias, onSetFields. (5) If the action is server-side code — read the function for early-exits and hardcoded lists. (6) Verify related records. Never conclude from current data alone — values may have changed since the event.
Ref: the investigation method (full method + report format)

**ש: מה זה _Timeline ואיך קוראים אותו?**
`_Timeline` logs every create/update per record: query by `objectIdValue` (the record's id) + `objectClass` (table name), ordered by `createdAt`. Each row: `event` (create/update), `data` (changed fields + new values), `user` (`Master` = automatic trigger/cloud/API; a userId = manual change), and sometimes `data.updatedByTrigger` = the exact trigger id. Times are UTC — Israel is UTC+2 (winter) / UTC+3 (summer).
Ref: the investigation method שלב 2

**ש: איך מוכיחים שטריגר רץ (או לא רץ)?**
Look for the trigger's fingerprints: `_syslogTriggers` rows for the record (`objectIdValue`), `_Timeline` updates by `Master` with `updatedByTrigger`. ⚠️ Not every environment persists `_syslogTriggers` — an empty result is NOT proof the trigger didn't run; the Timeline is authoritative. Absence of evidence ≠ evidence of absence.
Ref: the investigation method שלב 3

**ש: "לא קיבלתי הודעה (מייל/SMS)" — איפה בודקים?**
Order of logs: `_syslogTriggers` (did the trigger fire and with what error) → `_syslogSMS` (SMS sends) → `_syslogEvents` (email/WhatsApp delivery errors). Then check the channel config (SMTP account, WhatsApp template status, sender number) and that the recipient field was populated at send time (per `_Timeline`).
Ref: the support reference, the investigation method (מקורות מידע לפי סוג בעיה)

**ש: טריגר עם פעולת server-side-code — איך בודקים מה הקוד עושה?**
Get the `functionName` from the trigger action, then read the function source. Hunt for: early-exit guards (`if (X) throw`), hardcoded objectId lists (e.g. "open" status lists that miss a newer status), and branching paths. Verify the record's actual values against those conditions — stale hardcoded status lists are a classic root cause.

**ש: השעות בלוגים לא מסתדרות עם מה שהלקוח אומר — למה?**
All server timestamps (`createdAt`, `_Timeline`, logs) are UTC. Israel local time is UTC+2 in winter and UTC+3 in summer (DST). Always convert before comparing to a customer's reported time.
Ref: the investigation method

**ש: לאן פונים כשנדרשת תמיכה אנושית?**
Official channels: support@mybusiness-crm.com or WhatsApp 972-77-670-7270. Include the record number/objectId, exact timestamps, and what you already verified (Timeline/log findings) to shorten the loop.
Ref: the project reference (company context)

---

## Limitations & gotchas

- Answers are condensed; the linked guide is always the authoritative procedure (UI steps and screenshots live there). Some screenshots predate the May 2026 UI redesign.
- Two answers are marked ⚠️ UNVERIFIED (performance tuning; WhatsApp auto-link matching internals) — no official documentation found; verify against a live environment before quoting to customers.
- Numeric limits (Get-Data 5/2000, batch 50, trigger depth 3, REST default 100) come from internal references (the MCP tool reference / the API reference), not from public guides — they may change without a public changelog entry.
- The debugging-method answers (§8) describe the internal L2 methodology and reference internal file paths not available to customers; customer-facing replies should translate them into UI-visible steps where possible.
- Hebrew IRIs in links are shown decoded; percent-encode if a tool rejects them.
- The official Q&A page (10 presales questions) is much shallower than this FAQ; do not assume site parity for these answers.
