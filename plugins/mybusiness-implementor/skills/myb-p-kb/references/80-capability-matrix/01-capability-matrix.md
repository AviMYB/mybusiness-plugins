# Capability Matrix — מטריצת יכולות

> **Purpose:** The single lookup table for fit-gap classification: what the product does natively, what is configurable, what requires custom work, and what it cannot do today. Every row is evidence-backed by this package's section docs.
> **Audience:** Implementers/AI agents in fit-gap (phase 3) and spec authoring (phase 4); sales for qualification.
> **Last updated:** 2026-08-02 (MyBooks line-level period & discount; MyBooks document templates) · **Status:** draft — **living document: update on every fit-gap that discovers something new.**

**Levels:** `Native` works out of the box · `Config` no-code via UI/MCP · `Custom-JS` page JS/CSS · `Custom-Server` server function (Jira) · `External` outside service (Make/Zapier/GCP) · `Gap` not acceptably solvable today. Mixed values mean "base level + caveat in Notes". ⚠️ = verify before promising (see source doc).

---

## 1. Platform & tenancy

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Per-customer isolated app (own appId, master key, numeric subdomain) | Native | one isolated app per customer | [00/02](../00-overview/02-architecture.md) |
| Hebrew UI over English schema; per-field Hebrew labels | Native | `_Dictionary` mechanism | [20/05](../20-data-model/05-field-types-and-conventions.md) |
| Entity renaming per tenant (מכירה→פרויקט etc.) | Config | dictionary + Replace-Terms + labels + menus | [30/09](../30-customization/09-terminology-localization.md) |
| Master-page layout inheritance | Native | `_dynamicContentArea` merge | [00/02](../00-overview/02-architecture.md) |
| Full-system clone between accounts | Custom-Server | vendor-side tenant-clone op; **overwrites destination** | [00/04](../00-overview/04-environments-and-access.md) |
| Staging env / partial config promotion | **Gap** | clone-only; no diff/merge; field hack: date-criterion to disable triggers | [00/04](../00-overview/04-environments-and-access.md) |
| Mobile pages | Native ⚠️ | separate page copies, mostly unused by customers | [10/01](../10-modules/01-crm-core.md) |

## 2. Data model & fields

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Custom tables + fields (10 types), Hebrew labels | Config | Create-Table / Add-Field-to-Table | [30/02](../30-customization/02-tables-and-fields.md) |
| Lookup table + pointer + seed values in one call | Config | `newTableName`/`newTableValues` | [30/02](../30-customization/02-tables-and-fields.md) |
| Lead+Customer in one table, flip conversion | Native | `IsAccount`; conversion **irreversible** | [10/01](../10-modules/01-crm-core.md) |
| Multi-select (multi-pick) field | Config | **Supported native mechanism**: `array_<x>_Pointer_<T>` naming convention — runtime renders a true Select2 multi-pick, no custom JS; schema + lookup fully via MCP (myb-p-multi-select-field skill); one manual step: form-page binding via the page editor (Edit-Page can't bind it yet); query with `containedIn` | [30/11](../30-customization/11-field-patterns.md) |
| Cascading (parent→child) dropdowns | Config | Define Parent / `subclassDepend`; full MCP support since 2026-05 | [30/11](../30-customization/11-field-patterns.md) |
| Status lists filtered by record type | Config | `array_types_Pointer_*` on status tables | [10/01](../10-modules/01-crm-core.md) |
| Auto-numbering | Native | AutoIncrement + `_AutoIncrementValues` | [20/04](../20-data-model/04-system-tables-and-logs.md) |
| Account↔Account relations | Native | `AccountRelation` | [20/02](../20-data-model/02-core-tables.md) |
| Field rename / type change / delete via tooling | **Gap** | type lock-in; REST/UI workarounds only; typos persist forever | [20/05](../20-data-model/05-field-types-and-conventions.md) |
| Referential integrity / cascade delete | **Gap** | dangling pointers possible — design triggers/processes around it | [20/01](../20-data-model/01-data-model-overview.md) |
| Native dedupe engine (phone/ת"ז) | **Gap** | per-tenant Custom-Server (e.g., tov-duplicate-check) | verified in production implementations |
| Rollup/computed sums across records | Custom-Server | GCP `update_sum_count_obj` pattern; fails silently | verified in production implementations |
| Field-change timestamp audit | Config | field + trigger pattern (blueprint) | [30/11](../30-customization/11-field-patterns.md) |

## 3. Pages & cards

| Capability | Level | Notes | Ref |
|---|---|---|---|
| 360° record card (fields + timeline + related) | Native | filter, pin, create-linked | [10/01](../10-modules/01-crm-core.md) |
| Card layout: sections, rows/columns, field placement | Config | Edit-Page (9 actions); ordering rules apply | [30/03](../30-customization/03-pages-and-layouts.md) |
| Tabs & containers on pages | Config | MCP tools added 2026 | [30/03](../30-customization/03-pages-and-layouts.md) |
| Related-records (child) tables on cards | Native | auto-filtered via classPointers; placement rule KI-9 | [30/04](../30-customization/04-table-views-and-lists.md) |
| New form page creation | Config ⚠️ | Create-Form-Page forces NewMaster master (irreversible); standalone-URL cards = Gap | [30/03](../30-customization/03-pages-and-layouts.md) |
| Page delete / element delete via MCP | **Gap** | rename/CSS-hide workarounds | [30/03](../30-customization/03-pages-and-layouts.md) |
| Page versions backup/restore | Config | Get/Set-Page-Version | [30/03](../30-customization/03-pages-and-layouts.md) |
| Per-page custom JS/CSS; site-wide design system | Custom-JS | unified-master.css (2026-05), page-slug scoping, stable codeFile deploy | [30/03](../30-customization/03-pages-and-layouts.md) |
| Drag-drop page builder (containers, data tables, charts, form-to-DB widgets) | Native | Simbla editor at /WebsiteDesign (observed) | [50/02](../50-ui-walkthrough/02-admin-builder-tour.md) |
| Dynamic pages (page-per-record by table + URL field), page access by role/login | Config | page settings Database tab (observed) | [50/02](../50-ui-walkthrough/02-admin-builder-tour.md) |

## 4. Lists & table views

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Columns, filters, sort, paging per view | Config | Edit-Table-View — **whole-state writer** (read-modify-write) | [30/04](../30-customization/04-table-views-and-lists.md) |
| Inline / modal / sidebar editing (7 modes) | Config | | [30/04](../30-customization/04-table-views-and-lists.md) |
| Excel export, multi-row edit, summary row | Config | export row caps unverified | [30/04](../30-customization/04-table-views-and-lists.md) |
| Conditional formatting (row/cell colors) | Config / Custom-JS | basic via view config; rich coloring via JS (common request) | [30/04](../30-customization/04-table-views-and-lists.md) |
| Owner/hierarchy-scoped lists (רואה רק את שלו) | Config | operators incl. underMyHierarchy/AuthorizedOn | [30/04](../30-customization/04-table-views-and-lists.md) |
| Search-form (dbFormQuery) editing via MCP | **Gap** | page JS only | [30/04](../30-customization/04-table-views-and-lists.md) |
| Bulk update via queries (UI) | Native | עדכון גורף guide | [90/01](../90-appendices/01-support-site-catalog.md) |

## 5. Dashboards & reports

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Role dashboards (manager/rep × sales/cases/leads) | Native | 8 standard Dashboard* pages | [10/01](../10-modules/01-crm-core.md) |
| Custom dashboard: clone + repoint | Config | proven workflow; genericform overwritten on clone | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Dashboard from scratch (counters/charts/tabs) | Config ⚠️ | newly feasible via MCP (2026); some tooling gaps open | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Reports: flat / aggregated / pivot / calculated | Config | groupBy field **must be String** | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Scheduled report email delivery | Config | live examples exist | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Compound reports (subqueries) | Custom-Server | REST-only; MCP ignores SubqueriesInfo | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Report deletion via MCP | **Gap** | REST only | [30/05](../30-customization/05-dashboards-and-reports.md) |
| Report designer UI | **Gap** | runtime only *runs* saved reports (param forms); authoring via MCP/REST | [50/01](../50-ui-walkthrough/01-runtime-app-tour.md) |

## 6. Automations (triggers)

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Data-change triggers (create/update; AND+OR; onSetFields) | Config | OR support since 01/2026 | [30/06](../30-customization/06-triggers-and-automations.md) |
| Scheduled triggers (offset from any date field) | Config | `shcedulerHours` (sic); value 0 rejected via MCP ⚠️ | [30/06](../30-customization/06-triggers-and-automations.md) |
| Actions: email/SMS/WhatsApp/notification/create/update/http/server-code | Config | 8 types verified | [30/06](../30-customization/06-triggers-and-automations.md) |
| Dynamic placeholders in messages (`{{{Field}}}`, pointer paths, date format) | Native | | [30/06](../30-customization/06-triggers-and-automations.md) |
| Trigger fire on API / master-key writes | Native | **Live-verified 2026-06-10**: `Create-Data`, `Update-Data`, `Create-Many` all fire create/update triggers; opt-out only via `Create-Many(skipTriggers, skipTimeline)` (master-key); REST `/batch` and single-record tools have no skip flag | [30/06](../30-customization/06-triggers-and-automations.md) |
| **Round-robin auto-assignment of incoming records** (הגדרות הקצאות משתמשים) | Native (installed per tenant ⚠️) | Productised engine: rule row in `UsersAssignments` + companion trigger; per-record rotation, optional per-user cap with its own criteria, cursor reset. **Setup trap:** the "הקצאה כאשר" checkboxes ARE the trigger's `events` — untick both and it silently never fires | [30/06 §13](../30-customization/06-triggers-and-automations.md) |
| Even distribution under concurrent load | Native | `useQueue: true` on the engine's http action serialises the calls — measured perfect even split across three 10-way bursts; without it the split skews badly | [30/06 §13](../30-customization/06-triggers-and-automations.md) |
| Retroactive assignment of records created while a rule was misconfigured | **Gap** | No back-fill sweep — such records stay unassigned and need manual handling | [30/06 §13](../30-customization/06-triggers-and-automations.md) |
| Trigger chains | Config (limit) | max 3 levels; use one-time flags for idempotency | [30/06](../30-customization/06-triggers-and-automations.md) |
| Trigger delete via MCP | **Gap** | deactivate only; delete in UI | [30/06](../30-customization/06-triggers-and-automations.md) |
| Business-day/SLA-aware computations | Custom-Server | productized `SLA-*-v2` functions + blueprint; native SLA engine known-buggy | [30/12](../30-customization/12-solution-blueprints.md) |
| Outbound webhooks (http action) | Config | Make/Zapier/GCP targets — External class for the far side | [30/06](../30-customization/06-triggers-and-automations.md) |

## 7. Form rules (client-side logic)

| Capability | Level | Notes | Ref |
|---|---|---|---|
| readonly/required/hidden/fixed-value/dynamic-value/formula-value/show-message/value-from-url | Config | per form page; conditions support AND+OR | [30/07](../30-customization/07-form-rules.md) |
| Incremental rule editing | Config | **Edit-Form-Rules only; Set-Form-Rules replaces ALL rules** | [30/07](../30-customization/07-form-rules.md) |
| Form-rules editing UI in admin | **Gap** | no UI found in the entire admin tour — MCP/API only | [50/02](../50-ui-walkthrough/02-admin-builder-tour.md) |
| Filter pointer dropdown options by condition | **Gap** | use cascading dropdowns (subclassDepend) instead | [30/07](../30-customization/07-form-rules.md) |
| Cross-field validation beyond rules | Custom-JS | page JS | [30/03](../30-customization/03-pages-and-layouts.md) |

## 8. Users, roles & permissions

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Users + packages/seats (Business/Enterprise mix) | Native | portal users don't consume seats | [30/08](../30-customization/08-users-roles-permissions.md) |
| Roles + CLP per table (6 actions) | Config | **new users/roles/tables start with ZERO permissions** (top ticket cause); Set-Table-Permissions is full-replace | [30/08](../30-customization/08-users-roles-permissions.md) |
| Row-level permissions (owner/team/branch) | Config ⚠️ | UI-only ("advanced permissions"), no MCP; heavy use → role explosion (78 roles seen) | [30/08](../30-customization/08-users-roles-permissions.md) |
| Per-record ACL | Native | Parse ACL | [00/02](../00-overview/02-architecture.md) |
| 2FA/MFA (WhatsApp OTP) | Native + Custom-Server | toggle + send-2FA-whatsapp fn | verified in production implementations |
| IP/country login restriction, enforced 2FA, security event log | Config | admin Security screen (observed) | [50/02](../50-ui-walkthrough/02-admin-builder-tour.md) |
| User deletion; listing >100 users via MCP | **Gap** | deactivate (`active:false`); REST for big lists | [30/08](../30-customization/08-users-roles-permissions.md) |
| Hard seat enforcement | **Gap** | fleet shows over-assignment tolerated | [00/04](../00-overview/04-environments-and-access.md) |

## 9. Documents & price quotes

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Branded PDF quote templates ({{placeholders}}, signature block) | Config | 12 live templates on playground | [30/10](../30-customization/10-price-quotes-documents.md) |
| Quote → email/SMS send, remote e-signature, auto status | Native | PriceQuoteSign flow | [10/01](../10-modules/01-crm-core.md) |
| JS logic inside templates | **Gap** | `<script>` breaks rendering | [30/10](../30-customization/10-price-quotes-documents.md) |
| Fillable inputs in MCP-created templates | **Gap** ⚠️ | UI-created templates only (escalated bug) | [30/10](../30-customization/10-price-quotes-documents.md) |
| MyBooks document PDF templates (invoice / receipt / invoice-receipt, HE+EN) | Config | **separate engine** from quotes — `{{{triple}}}` braces + `relatedData` block repeats; edits serve live, no publish | [30/10](../30-customization/10-price-quotes-documents.md) §8 |
| Hebrew Word/PDF document generation beyond quotes | Custom-Server | hebdoc* function family | [40/04](../40-integrations-api/04-cloud-functions.md) |

## 10. Billing — MyBooks

| Capability | Level | Notes | Ref |
|---|---|---|---|
| 7 doc types, independent sequences, draft→produce, immutable finals | Native | numbering upward-only — **migration-critical** | [10/02](../10-modules/02-mybooks.md) |
| Linked docs, invoice balance, collection (גבייה) | Native | | [10/02](../10-modules/02-mybooks.md) |
| Credit clearing (Upay free / Pelecard) incl. tokens, multi-terminal | Native | gateway specifics vary | [10/02](../10-modules/02-mybooks.md) |
| Hosted payment pages + embeddable button | Native | | [10/02](../10-modules/02-mybooks.md) |
| Retainers (recurring billing, auto-charge, 3-strike retry) | Native | inert until "פעיל"; auto-deactivates after 3rd failure | [10/02](../10-modules/02-mybooks.md) |
| Inventory (doc-driven movements, min-stock alert) | Native | alert fires once; no backdating | [10/02](../10-modules/02-mybooks.md) |
| מבנה אחיד export; Hashavshevet export | Native ⚠️ | | [10/02](../10-modules/02-mybooks.md) |
| חשבונית ישראל allocation numbers | Native | requires VAT registration; refusal fallbacks exist | [10/02](../10-modules/02-mybooks.md) |
| Per-line subscription period (מתאריך / עד תאריך) on a document line | Config ⚠️ | fields + page JS ship with every tenant; the line-table columns **and** the PDF templates are a per-tenant enablement — without both the feature is unreachable | [10/02](../10-modules/02-mybooks.md) §4.1 |
| Per-line discount (% or amount) on a document line | Config ⚠️ | same enablement; deducted once per line and before the currency-rate multiplication | [10/02](../10-modules/02-mybooks.md) §4.1 |
| Validation of the per-line discount | **Gap** | >100%, amounts exceeding the line, and negatives are all accepted onto an immutable tax document | [02](02-known-limitations.md) §14 |
| Line discounts shown in the document totals block | **Gap** | `TotalBeforeDiscount` is already net of them; the summary `הנחה` row shows only the document-level discount | [10/02](../10-modules/02-mybooks.md) §4.1 |
| Retainer line period expressed as start/end dates | **Gap** ⚠️ | `RetainerRows` models it as `SubscriptionMonthCount`; whether the charge job converts it on the produced invoice is UNVERIFIED | [20/03](../20-data-model/03-module-tables.md) |
| Installments / US gateways / refunds / complex billing | Custom-Server | customer-forked charge-function families | verified in production implementations |
| NGO donation receipts (allocation, cancellation) | **Gap** | MBBOOK tickets open | verified in production implementations |
| External accounting sync (חשבשבת/Comax/tax files) | Custom-Server | comax-*, tax-export-file | [40/04](../40-integrations-api/04-cloud-functions.md) |

## 11. Marketing — MyCampaigns

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Email/SMS/WhatsApp campaigns, include–exclude audiences | Native | per-user SMTP prerequisite for email | [10/03](../10-modules/03-mycampaigns.md) |
| Dynamic distribution groups (filters on Accounts/Contacts) | Native | | [10/03](../10-modules/03-mycampaigns.md) |
| Groups from Excel / by Sales criteria | **Gap** | recurring JIRA request | [10/03](../10-modules/03-mycampaigns.md) |
| Per-recipient analytics (open/click/unsubscribe) | Native | CampaignSentLog | [10/03](../10-modules/03-mycampaigns.md) |
| Landing pages → auto-lead | Native/Config | fixed field-name contract ⚠️ doc bug on last-name key | [10/03](../10-modules/03-mycampaigns.md) |

## 12. Conversations — MyChat & WhatsApp

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Multi-channel queues (WhatsApp/email), statuses, assignment | Native | | [10/04](../10-modules/04-mychat.md) |
| Per-channel agent permissions | Config | none/own/own+unassigned/all | [10/04](../10-modules/04-mychat.md) |
| Chatbots: visual flow, record find/create/update, webhooks, hour routing | Native/Config | | [10/04](../10-modules/04-mychat.md) |
| AI agent on knowledge sources (URL/PDF) | Native | 50-msg cap | [10/04](../10-modules/04-mychat.md) |
| Business-initiated WhatsApp | Config | Meta-approved templates only; 24h window; **channel identity = `Identity` field, NOT objectId** | [40/05](../40-integrations-api/05-messaging-channels.md) |
| Interactive WhatsApp messages (buttons≤3, CTA, lists) | Native | via Send-WhatsApp-Message | [40/05](../40-integrations-api/05-messaging-channels.md) |
| Quick replies, round-robin assignment, agent signatures | Gap→QA | MYCH tickets in QA 2026 — re-verify at use time | [10/04](../10-modules/04-mychat.md) |

## 13. Education — MyCollege · 14. Time — TimeSheet · 15. Email — MyInbox

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Courses, enrollment, lessons, exams, attendance, student portal | Native | **2026-06 rework**: dedicated `Lessons`/`LessonAttendance` tables; students are Accounts | [10/05](../10-modules/05-mycollege.md) |
| Enrollment-counter maintenance · capacity limit · duplicate-enrollment block · single-lesson scheduling-conflict | Native/Config | added in the 2026-06 rework (counter trigger native; capacity & dup-block client-side; conflict via cloud fn) | [10/05](../10-modules/05-mycollege.md) |
| Reminders to students · certificates · waiting-list auto-promotion · enrollment automations · reports/dashboard | **Gap** | still per-customer Custom-Server | [10/05](../10-modules/05-mycollege.md) |
| Multi-state attendance (late/excused) · flexible/holiday-aware lesson series | **Gap** | `Presence` still Boolean; series still fixed-interval | [10/05](../10-modules/05-mycollege.md) |
| Project/sub-project time tracking + rollups | Native ⚠️ | model verified; UI unverified (not on demo) | [10/06](../10-modules/06-timesheet.md) |
| Israeli salary buckets (125–200%, absences) | Native/Custom-Server ⚠️ | calc location unverified | [10/06](../10-modules/06-timesheet.md) |
| Time per Case | **Gap** | JIRA request | [10/06](../10-modules/06-timesheet.md) |
| Email layer linked to all core entities; Gmail OAuth/IMAP sync | Native/Config ⚠️ | minimal docs; immature | [10/07](../10-modules/07-myinbox-and-misc.md) |
| mail2case + attachments | Native + Custom-Server | fragile edge cases (bug family) | verified in production implementations |

## 16. Intake: forms & portals

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Website form → lead (web2lead) with phone-format dedup statuses | Native | always inserts; duplicates flagged, **no merge** | [40/03](../40-integrations-api/03-web2lead-web2table.md) |
| Form → any table + linked Account (web2table) | Native | `account_`/`table_` buckets; **does not update existing Accounts**; deployed code requires phone ⚠️ | [40/03](../40-integrations-api/03-web2lead-web2table.md) |
| Enable-flags (AcceptWebLeads / AcceptWebToTable) | Config | Config table is MCP-restricted — UI/REST/dev | [40/03](../40-integrations-api/03-web2lead-web2table.md) |
| Portal scaffolding pages (PortalLogin / PortalMaster / PortalOrders) | Native | ship in the vanilla app, gated `loginOnly` + `allowedRoles` (live-verified on playground) | [30/13](../30-customization/13-customer-portals.md) |
| Portal users — unlimited external logins, no seat consumption | Native | `relatedPackages: []`; thousands of portal users can run on a handful of seats (field-verified) | [30/13](../30-customization/13-customer-portals.md) |
| Page access gating (`loginOnly` + `allowedRoles` by role name) | Config | live Get-Page-Settings on shipped portal pages | [30/13](../30-customization/13-customer-portals.md) |
| Portal password auth (Account field → `_User` copy trigger) | Config | copy-to-`_User` trigger pattern — tens of school logins with zero server code (field-verified) | [30/13](../30-customization/13-customer-portals.md) |
| Portal OTP-SMS auth (`/otp/register`, `/otp/login`) | Custom-Server | platform endpoints + a per-tenant caller function | [30/13](../30-customization/13-customer-portals.md) |
| Portal data scoping (row-level to the logged-in user) | Custom-JS | criteria-added-to-query pattern (race-safe version) | [30/13](../30-customization/13-customer-portals.md) |
| Portal self-signup with Account linking; in-portal payments | Custom-Server | self-signup + charge functions (PaySimple/Pelecard) | [30/13](../30-customization/13-customer-portals.md) |
| Built-in OTP login element (`loginOTPForm` on `PortalLoginOTP`) | Config | zero-code OTP UX (`data-next-page`, auto-toggled validate elements, hookable events); NOT in the vanilla install — arrives with tenant `enableOTP` provisioning | [30/13](../30-customization/13-customer-portals.md) |
| Server-side row-level scoping for portals (advanced permissions) | Config | admin-UI only, not readable/writable via API tools; per-tenant optional — the REST isolation test is the go-live gate | [30/13](../30-customization/13-customer-portals.md) |
| Per-user document download (PrivateFile + session token) | Config | file URL authorized against read access to the owning record; fetch with `X-Parse-Session-Token` | [30/13](../30-customization/13-customer-portals.md) |
| Staff portal impersonation ("login as account") | Custom-JS | `?loginAsAccount` + `criteria-added-to-query` narrowing; on-screen banner + post-login-sync guard | [30/13](../30-customization/13-customer-portals.md) |
| Turnkey portal product | **Gap** | every portal is assembled per customer; only MyCollege's student portal is productized (ships with audit defects) | [30/13](../30-customization/13-customer-portals.md) |
| File upload from external forms | Config + Custom-Server | seen at multiple customers | verified in production implementations |

## 17. Integrations, API & server-side

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Parse REST API: CRUD, queries, batch(50), aggregate, users, files | Native | session-token (CLP-scoped) or master key | [40/01](../40-integrations-api/01-parse-rest-api.md) |
| MCP server: 63 tools for AI agents | Native | master-key context — no user attribution in audit | [40/02](../40-integrations-api/02-mcp-tools-catalog.md) |
| Bulk insert w/ trigger & timeline suppression | Native | Create-Many skipTriggers/skipTimeline | [40/02](../40-integrations-api/02-mcp-tools-catalog.md) |
| Deletion via MCP (records/tables/pages/triggers/reports/files) | **Gap** | REST or UI | [40/02](../40-integrations-api/02-mcp-tools-catalog.md) |
| Per-app server functions (Node, master key injected) | Custom-Server | `/functions/<appId>/<name>` | [40/04](../40-integrations-api/04-cloud-functions.md) |
| Telephony: CDR ingestion, click2call, pop-screen (10+ PBX providers) | Custom-Server | pattern library exists — estimate as M not XL | [40/04](../40-integrations-api/04-cloud-functions.md) |
| Calendar 2-way sync (Google/O365) | Native + Custom-Server | native UI sync + office365sync fn for advanced | [10/01](../10-modules/01-crm-core.md) |
| Zapier/Make scenarios (in & out) | External | http trigger out; Zapier app in | [40/02](../40-integrations-api/02-mcp-tools-catalog.md) |
| AI services: transcription→CRM, lead scoring/enrichment, web scraping | External (in-house) | Firebase in-house AI services | [40/04](../40-integrations-api/04-cloud-functions.md) |
| Shabbat/holiday-aware messaging windows | Custom-Server | sms-by-rules (@hebcal) | [40/04](../40-integrations-api/04-cloud-functions.md) |

## 18. Files, audit & ops

| Capability | Level | Notes | Ref |
|---|---|---|---|
| Public file upload; stable code-file deploys; private files via record URI | Native | file-storage:/// resources | [40/06](../40-integrations-api/06-files-and-storage.md) |
| File deletion / storage quota self-service | **Gap** | outOfStorage flag via reseller API only | [40/06](../40-integrations-api/06-files-and-storage.md) |
| Record-change audit (_Timeline), trigger log (_syslogTriggers), events (_syslogEvents) | Native | objectClass+objectIdValue query pattern; internal-only knowledge | [20/04](../20-data-model/04-system-tables-and-logs.md) |
| App provisioning, package/seat/validity management | Native (internal) | SiteAdmin reseller API | [00/04](../00-overview/04-environments-and-access.md) |
| Customer self-served app installs | Native | app-market installers: MyBooks/MyCampaigns/MyCommerce/MyInbox only | [10/07](../10-modules/07-myinbox-and-misc.md) |

---

## How to use this matrix in fit-gap

1. Find the requirement's domain table; if a row matches — copy its Level and Notes into the workbook (cite the Ref).
2. If no row matches, check the relevant section doc, then [solution blueprints](../30-customization/12-solution-blueprints.md), then [known limitations](02-known-limitations.md).
3. Still unmatched → treat as ⚠️ unknown: verify on the playground before classifying (never promise from intuition).
4. **Update this file** with what you learned — add a row with evidence. Rows without a Ref/evidence get deleted on review.

## Limitations & gotchas

- Levels describe **today** (2026-06-10). Items marked Gap→QA or "NEW 2026" change fast — re-verify before quoting a customer.
- The playground informed most "live" evidence; tenant schemas diverge — per-customer verification is part of fit-gap, not optional.
