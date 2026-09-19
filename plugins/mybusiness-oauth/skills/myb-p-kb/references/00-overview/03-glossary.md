# Bilingual Glossary (Hebrew ↔ English)

> **Purpose:** Canonical Hebrew↔English term map for MyBusiness CRM — entities, platform terms, modules, roles, statuses — including which terms customers commonly rename per tenant.
> **Last updated:** 2026-06-10 · **Status:** draft

---

## How naming works in this product

Three naming layers exist simultaneously (MCP `Usage-Guide`):

1. **Schema names** — tables and fields are in **English** (`Accounts`, `SaleStatusId`). These never change, even when the customer renames everything in the UI.
2. **Field-level Hebrew labels** — each field carries an optional Hebrew translation shown on pages.
3. **Terminology Dictionary (מילון מונחים)** — a per-tenant Hebrew→Hebrew display map that renames whole entities across the UI. Read with `Get-Terminology-Dictionary`, replaced with `Set-Terminology-Dictionary`, applied to existing page text with `Replace-Terms`. Live example from the playground app (which renamed Sales to "Projects"):

```json
{"success": true, "dictionary": {
  "מכירה": "פרויקט", "מכירות": "פרויקטים",
  "פנייה": "פנייה",  "פניות": "פניות",
  "משימה": "משימה",  "לקוח": "לקוח", "ליד": "ליד", "...": "..."
}}
```

> **Implication for discovery (אפיון):** always run `Get-Terminology-Dictionary` first on a customer app. When the customer says "פרויקט", the table may still be `Sales`. Renames are display-level only; API/MCP calls keep using the English class names.

## Core entities (ישויות)

"Renamed often" = terms customers commonly replace via the terminology dictionary (evidence: live playground dictionary; myb-p-rename-terms skill examples: מכירה→פרויקט, לקוח→משתתף, פנייה→קריאה).

| Hebrew (default UI) | English | DB table / class | Key fields | Renamed often |
|---|---|---|---|---|
| לקוחות / חשבונות | Accounts / Customers | `Accounts` (`IsAccount=true`) | Name, Email, PhoneNumber, OwnerId | Yes (משתתפים, מבוטחים…) |
| לידים | Leads | `Accounts` (`IsAccount=false`) | LeadStatusId, LeadOwnerId, SourceLead | Sometimes |
| מכירות | Sales | `Sales` | Name, Total, AccountId, SaleStatusId | **Yes — most renamed** (פרויקטים, עסקאות, תיקים) |
| פניות | Cases / Tickets | `Cases` | Name, CaseNum, StatusId, PriorityId | Yes (קריאות, בקשות) |
| משימות | Tasks | `Tasks` | Name, DueDate, StatusId, OwnerId | Rare |
| פעילויות | Activities (calendar) | `Activities` | Name, StartTime, EndTime, Location | Rare |
| אנשי קשר | Contacts | `Contacts` | FirstName, LastName, AccountId | Rare |
| מוצרים | Products | `Products` | Name, Price, Active, Category | Sometimes (שירותים, קורסים) |
| הערות | Notes | `Notes` | Name, Comment, File | Rare |
| מוצרים במכירה / שורות | Sale line items | `SaleRows` | ProductId, SaleId, Quantity, Total | — |
| הצעות מחיר | Price Quotes | `PriceQuotes` | Number, AccountId, SaleId, Content, TemplateId | — |
| חשבוניות / מסמכים | Invoices / accounting docs | `AccountingHeaders` (+`AccountingInvoiceLines`) | DocumentDate, TotalSum, VatValue, DocTypeId | — |
| מנויים / הוראות קבע / ריטיינרים | Retainers / subscriptions | `Retainers` | NextChargeDate, ChargesLimit, TotalSum | — |
| שיחות | Conversations | `Conversations` (+`ConversationMessages`) | — | — |
| ערוצים | Channels (WhatsApp/email lines) | `Channels` | **Identity** (use for WhatsApp send, not objectId) | — |
| קמפיינים | Campaigns | `Campaigns` | — | — |
| דפי נחיתה | Landing Pages | `LandingPages` | — | — |
| משתמשים | Users | `_User` | username, email, isPortalUser | — |

(Sources: terminology.md, the schema reference, the support reference.)

## Financial document types (MyBooks)

| Hebrew | English | Stored in |
|---|---|---|
| חשבונית מס | Tax Invoice | `AccountingHeaders` |
| חשבונית מס קבלה | Tax Invoice-Receipt | `AccountingHeaders` |
| חשבונית עסקה | Transaction (proforma) Invoice | `AccountingHeaders` |
| חשבונית זיכוי | Credit Invoice | `AccountingHeaders` |
| קבלה | Receipt | `AccountingHeaders` |
| תעודת משלוח | Delivery Note | `AccountingHeaders` |
| הזמנת עבודה | Work Order | `AccountingHeaders` |

(Source: terminology.md. MyBooks details: [../10-modules/](../10-modules/).)

## Statuses & pipeline vocabulary

Default sales pipeline stages (שלבי מכירה) — lookup table `SaleStatuses`; objectIds below are from the **demo** app and are NOT portable across tenants (the schema reference):

| Hebrew | English | Demo objectId | Probability |
|---|---|---|---|
| חדש | New | E9cYlAlooc | 10% |
| שיחת היכרות | Introductory call | piKPNxodMJ | 20% |
| פגישת מצגת | Presentation meeting | i8N34cQBWR | 40% |
| הצעת מחיר | Price quote | v9Jm2Ed7Ev | 60% |
| משא ומתן | Negotiation | V0sVNyS45K | 80% |
| הושלמה | Completed / Won | zrP1MSVBoq | 100% |
| נכשלה | Failed / Lost | xgQM6SyubN | 0% |

Account statuses (`AccountStatuses`): פעיל (Active), לא פעיל (Inactive), ליד (Lead). Price-quote statuses: טיוטה (Draft), נשלחה - בהמתנה לאישור (Sent – awaiting approval), בוטלה/מושהית (Canceled/On hold), אושרה (Approved) (the MCP tool reference). Pipeline stages are routinely customized per customer — treat the list above as the factory default.

## Platform & builder terms

| Term (EN) | Hebrew | Definition (1 line) | Where documented |
|---|---|---|---|
| Pointer | שדה מצביע / פוינטר | Field referencing a row in another table; JSON `{"__type":"Pointer","className":"T","objectId":"id"}`; dot-notation read `Status.Name` | Simbla pointer.md; the API reference |
| Trigger | טריגר | Server-side automation on data change (create/update) or schedule; actions: email/SMS/WhatsApp/HTTP/server-side-code/create-object/update-object/notification | triggers-automation.md; [../30-customization/](../30-customization/) |
| Form Rule | חוק טופס | Declarative client-side field behavior on a form page (hidden/required/readonly/fixed-value/…) | Usage-Guide |
| CLP (Class-Level Permissions) | הרשאות טבלה | Per-table × per-role grants: Find/Get/Create/Update/Delete (+addField) | Simbla rolesandpermissions.md |
| Advanced Permissions | הרשאות מתקדמות | Row-level access rules conditioned on field values (e.g. owner-only) | Simbla how-to-create-advanced-permissions.md |
| ACL | — | Per-record Parse access JSON (`"*"` = public) | ParseDocs 17-usersecurity.md |
| Role | תפקיד / רול | Named group of users (and roles) carrying permissions; referenced as `role:Name` | ParseDocs 07-roles |
| Package | חבילה | License purchase per app (Enterprise/Business/…) with seat count & validity; users are assigned to packages | Live Get-Packages; [04-environments-and-access.md](04-environments-and-access.md) |
| masterPage | דף אב / מאסטר | Layout shell page with `_dynamicContentArea` placeholder; child pages (with `masterPageId`) merge into it at runtime | Usage-Guide |
| Table View / list page | תצוגת טבלה / דף רשימה | Page showing all records of an entity (plural URL, e.g. `accounts`) | Usage-Guide |
| Form Page | דף טופס / דף כרטיס | Page editing a single record (singular URL, e.g. `account`); binds via `data-simbla-class` | Usage-Guide |
| Card page | דף כרטיס | Colloquial name for a record's form page (e.g. כרטיס לקוח = Account card) | myb-p-page-builder skill |
| rDivider / sDivider | שורה / עמודה | Grid row / column divs inside form pages; one field per column | Usage-Guide |
| Terminology Dictionary | מילון מונחים | Per-tenant entity-rename map (Hebrew→Hebrew display) | Live Get-Terminology-Dictionary |
| Dashboard | דאשבורד / לוח מחוונים | Analytics page of counters + charts (simbla-counter / simbla-chart elements) | myb-p-dashboards skill |
| Report / Dynamic Query | דוח / שאילתה | Stored flat or pivot report (`_DynamicQueries`), schedulable by email | the support reference; the product knowledge base |
| Timeline | ציר זמן | `_Timeline` audit table of all changes (query by `objectIdValue`+`objectClass`) | Usage-Guide |
| Notification | התראה | In-app notification (`_Notification`); also a trigger action type | the schema reference |
| Workflow | תהליך עבודה | Visual workflow designer executions (`_Workflow`/`_WorkflowLogs`) | Simbla the-visual-workflow-designer.md; the schema reference |
| Pipeline view | פייפליין | Kanban drag-drop board of Sales by stage | terminology.md |
| Master Key | מפתח מאסטר | Per-app secret that bypasses all permissions (`X-Parse-Master-Key`) | ParseDocs 17-usersecurity.md |
| Session Token | טוקן התחברות | Per-login credential from `POST /parse/login` (`X-Parse-Session-Token`) | Simbla the auth reference |
| Portal user | משתמש פורטל | External customer login (`isPortalUser` on `_User`), no license seat | the support reference; Get-Packages (portal user with empty `relatedPackages`) |
| Page slug | — | Stable `body.page-slug-<name>` class used for portable CSS scoping (vs non-portable page-id hashes) | the design-system reference |
| SLA | זמן תקן לטיפול / SLA | Case-handling deadline mechanism (`SLASettings`, `BusinessHours`, `CaseStates`, `CasesSlaProcess`) | myb-p-sla-configuration skill; the support reference |
| Web2Lead / Web2Table | קליטת לידים מטופס | Cloud functions that create CRM records from external HTML forms | myb-p-web2lead-web2table skill |
| Multi-select field | שדה בחירה מרובה | Array-of-pointers field via name pattern `array_<purpose>_Pointer_<TargetTable>` | myb-p-multi-select-field skill |
| Define Parent | הגדרת אב / שדה תלוי | Native cascading parent→child dropdown filtering (`subclassDepend`) | myb-p-parent-child-fields skill |

## Module names

| Hebrew | English / brand | URL path |
|---|---|---|
| ניהול לקוחות | CRM Core | `apps/mybusiness/` |
| הנהלת חשבונות | MyBooks | `apps/mybooks/` |
| קמפיינים | MyCampaigns | `apps/mycampaigns/` |
| צ'אט | MyChat | `apps/mychat/` |
| מכללה | MyCollege | `apps/mycollege/` |
| שעון נוכחות | TimeSheet | `apps/timesheet/` |
| דואר נכנס | MyInbox | `apps/myinbox/` |

(Source: terminology.md.)

## Standard role names

Observed live on the playground app (`Get-Roles`, 2026-06-10) — the first ~10 are the factory set seen across apps (demo set in the schema reference matches); the last rows are customer-defined examples:

| Role (EN name as stored) | Hebrew gloss | Scope |
|---|---|---|
| Admin | מנהל מערכת | Database administrator |
| Sales | מכירות | Sales records access |
| CRM | — | Core CRM access |
| Support | תמיכה | Cases/support |
| Report Admin | מנהל דוחות | Reports |
| Lead Admin | מנהל לידים | Lead administration |
| MyBooks Admin | מנהל הנה"ח | Accounting module |
| Campaign Manager | מנהל קמפיינים | MyCampaigns |
| MyChatUser / MyChatAdmin | משתמש/מנהל צ'אט | MyChat |
| College Admin / Lecturer / Student Portal | מנהל מכללה / מרצה / פורטל סטודנטים | MyCollege |
| TimeSheet User / TimeSheet Admin | משתמש/מנהל שעון | TimeSheet (demo app set) |
| E-commerce Admin | — | E-commerce |
| *Managers* (custom) | מנהלי צוותים — גישה רחבה | Example tenant-defined role |
| *Field Agents* (custom) | נציגי שדה — מכירות ותמיכה | Example tenant-defined role |
| *Finance* (custom) | צוות פיננסים — MyBooks בלבד | Example tenant-defined role |

Role names are stored in English even in Hebrew tenants; descriptions are often Hebrew. Role objectIds differ per app.

## Common UI actions

| Hebrew | English |
|---|---|
| חפש | Search |
| הפעל | Activate / Run (dashboard filter) |
| ערוך | Edit |
| מחק | Delete |
| לקוח חדש / מכירה חדשה / פנייה חדשה | New customer / sale / case |
| ייצוא / ייבוא | Export / Import |
| סינון | Filter |
| טבלה | Table view |
| הרשאות | Permissions |
| הגדרות | Settings |
| תבניות | Templates (email/PDF/SMS) |

(Source: terminology.md.)

## System tables quick reference

`_User` (users), `_Role` (roles), `_Session` (sessions), `_Timeline` (audit / ציר זמן), `_Notification` (התראות), `_Workflow` + `_WorkflowLogs`, `_DynamicQueries` (reports), `_syslogTriggers` / `_syslogEvents` / `_syslogSMS` (execution & delivery logs). See [02-architecture.md](02-architecture.md) §8 and [../20-data-model/](../20-data-model/).

## Limitations & gotchas

- **The dictionary is Hebrew→Hebrew** (display renames), not a translation table; the English↔Hebrew mapping in this file comes from the reference glossary + live observation, not from a single in-product source.
- **objectIds shown for statuses are demo-app values** — never reuse them on another tenant; always `Get-Data` the lookup tables (`SaleStatuses`, `AccountStatuses`, …) per app.
- **Renamed tenants create vocabulary traps**: a customer's "פרויקטים" is the `Sales` class; a request mentioning "קריאות" may mean `Cases`. Check `Get-Terminology-Dictionary` before any אפיון conversation, and remember `Replace-Terms` only rewrites existing page texts — new pages must use the renamed terms manually. ⚠️ UNVERIFIED whether the dictionary auto-applies to *all* UI surfaces (menus, notifications, reports) or only page content.
- **Lookup-value Hebrew strings are data, not config** — e.g. trigger criteria comparing `ShippingStatus` to "פתוח" (triggers-automation.md) break if someone edits the lookup row text.
