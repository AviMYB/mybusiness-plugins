# Technical Requirements Specification (TRS) — מסמך דרישות טכניות

> **Purpose:** How to turn an approved fit-gap workbook into an executable technical spec — one that a human or AI implementer can build from without having attended any meeting.
> **Audience:** Implementers, developers, and AI agents running phase 4 of the [implementation lifecycle](01-implementation-lifecycle.md).
> **Last updated:** 2026-06-10 · **Status:** draft

---

## 1. The TRS principle: specs are written in the system's own grammar

A TRS item is **done being specified** when it names the exact mechanism and parameters the builder will use — table names, field names + types, trigger event/conditions/actions, role names — in the same shapes the MCP tools accept. "The system should notify the manager" is a requirement; this is a spec:

> **AUT-03** · Trigger on `Cases` (on update) · Conditions: `StatusId` changed to "הסתיימה" · Action: email to `OwnerId.manager` using template T-12 · Source: REQ-031 · AC: closing a case sends exactly one email within 1 min.

Every TRS item carries: **ID** (domain prefix + number), **source REQ**, **spec body**, **acceptance criteria (AC)**, **owner class** (Config/Custom-JS/Custom-Server/External). Use the [TRS template](templates/technical-spec-template.md).

## 2. Document structure and per-domain spec grammar

The TRS has eleven sections, ordered like the canonical build order so the plan can consume it directly. For each section below: what to write, and the spec-ready shape.

### §1 Terminology plan (TERM-xx) — תוכנית מונחים
Table: CRM term (HE) → customer term (HE) → scope (entity name, menus, page labels). Mechanism: `Replace-Terms` / terminology dictionary — see [../30-customization/09-terminology-localization.md](../30-customization/09-terminology-localization.md). Apply **early**: later artifacts (pages, reports, messages) should already speak the customer's language.

### §2 Data model (TBL-xx / FLD-xx) — מבנה נתונים
Per table: name (English, PascalCase), Hebrew label, standard-renamed vs custom, purpose.
Per field — one row each:

| Column | Notes |
|---|---|
| Field name | English; follows conventions in [../20-data-model/05-field-types-and-conventions.md](../20-data-model/05-field-types-and-conventions.md) (incl. `array_<purpose>_Pointer_<Table>` for multi-select) |
| Type | String/Number/Boolean/Date/Pointer/Array/File/Object |
| Hebrew label | shown in UI |
| Pointer target | for Pointer fields: target table; note parent-child (`Define Parent`) dependencies explicitly |
| Required/default | plus whether enforced by form rule or schema |
| Lookup values | for status/category pointers: the full value list, ordered |

Wire formats the builder will use: Pointer `{"__type":"Pointer","className":"TableName","objectId":"id"}`; Date `{"__type":"Date","iso":"YYYY-MM-DDTHH:MM:SS.MSSZ"}`.

### §3 Pages (PAGE-xx) — דפים
Per form page: path (`apps/<module>/<entity-singular>`), bound table (`data-simbla-class`), section list in order — for each section: title (HE), rows × columns layout, fields per column; related-records widgets (which child table, which columns, which filter); tabs if any. Per list page: path (plural), default view (columns/sort/filters), row-click target page. Mechanisms: `Create-Form-Page`, `Edit-Page`, `Add-Table-View-to-Form-Page`, `Create-Table-View-Page` — see [../30-customization/03-pages-and-layouts.md](../30-customization/03-pages-and-layouts.md).

### §4 Table views (VIEW-xx) — תצוגות
Per view: page, columns (ordered, with widths if mandated), default filters (spec conditions — see §5 shape), sort, paging size, edit mode (inline/modal/sidebar), export on/off, summary row, conditional formatting rules (condition → color). Mechanism: `Edit-Table-View` — see [../30-customization/04-table-views-and-lists.md](../30-customization/04-table-views-and-lists.md).

### §5 Automations (AUT-xx) — אוטומציות
Per trigger:

| Element | Spec shape |
|---|---|
| Table + event | `Sales` · on create / on update / scheduled |
| Conditions | the canonical condition array: `{"field": "...", "equesition": "equalTo|notEqualTo|greaterThan|lessThan|greaterThanOrEqualTo|lessThanOrEqualTo|containedIn|notContainedIn|exists|notExist|startsWith|endsWith|contains", "value": "...", "visibleVal": "..."}` — for Pointer fields `value` is the objectId (`"currentUser"` allowed for _User pointers); date values accept keywords like `"today"`, `"beginning of this month"`, `"30 days period"`, `YYYY-MM-DD`, or ±days |
| Actions | typed list: email / sms / whatsapp-message / create-object / update-object / http / server-side-code / notification — with full payload per action |
| Message templates | body with dynamic placeholders: `{{{Name}}}`, `{{{AccountId.Name}}}`, dates as `{{{SaleDate.format(date,he-IL,Asia/Jerusalem)}}}` |
| Scheduled triggers | `schedulerField` (which date field) + offset hours (± from the field) + action |
| Chain note | document any trigger that fires another trigger's condition — max 3 levels, and mark one-time-flag idempotency where needed |

See [../30-customization/06-triggers-and-automations.md](../30-customization/06-triggers-and-automations.md) for the full grammar and worked examples.

### §6 Form rules (RULE-xx) — חוקי טופס
Per rule: page, field, action (`readonly` / `required` / `hidden` / `fixed-value` / `dynamic-value` / `formula-value` / `show-message` / `value-from-url`), value (per action semantics), conditions (same condition grammar). **Spec note for builders:** apply with `Edit-Form-Rules` (incremental); `Set-Form-Rules` replaces the entire rule set of the page. See [../30-customization/07-form-rules.md](../30-customization/07-form-rules.md).

### §7 Users, roles & permissions (ROLE-xx / USR-xx) — משתמשים והרשאות
Role list with purpose; per-table CLP matrix (role × find/get/create/update/delete); user list (name, email, role(s), package seat); portal users if any. Password policy: min 8, ≥1 lower, ≥1 upper, ≥1 digit. Mechanisms: `Create-Role`, `Add-Users-to-Role`, `Set-Table-Permissions`, `Create-or-Update-User` — see [../30-customization/08-users-roles-permissions.md](../30-customization/08-users-roles-permissions.md).

### §8 Reports & dashboards (RPT-xx / DASH-xx) — דוחות ודשבורדים
Per report: name, base table, filters (condition grammar), grouping (**groupBy field must be String type**), aggregates, audience, schedule (if delivered). Per dashboard: page, elements (counter/chart/table) each with: source table, filter conditions, chart type, position/slot. See [../30-customization/05-dashboards-and-reports.md](../30-customization/05-dashboards-and-reports.md).

### §9 Documents & messaging (DOC-xx / MSG-xx) — מסמכים ותקשורת
Quote/PDF templates: layout, branding assets (logo file collected), dynamic fields, per-audience variants — see [../30-customization/10-price-quotes-documents.md](../30-customization/10-price-quotes-documents.md). MyBooks document types in use and their numbering setup. Messaging: SMTP sender accounts to configure; WhatsApp channel + approved templates with params (remember: channel identity = `Identity` field on Channels, not objectId); SMS sender. Message template texts appear here once and are referenced by AUT items.

### §10 Integrations (INT-xx) — אינטגרציות
Per integration: direction (in/out), counterpart system, mechanism (web2lead/web2table for inbound forms; outbound webhook via trigger `http` action; custom server function; Make/Zapier scenario; external service), payload field mapping, auth, failure behavior, owner. Custom-Server items reference their Jira ticket and the planned function name in the `server-side-code` repo. See [../40-integrations-api/](../40-integrations-api/01-parse-rest-api.md).

### §11 Data migration (MIG-xx) — הסבת נתונים
Per source file: file → target table; column → field mapping table (with type conversions and pointer-resolution strategy: match-by-name/by-phone/by-external-id); dedup rules; ordering (parents before children: Accounts before Sales before child tables); expected row counts (the post-import `Count-Data` check uses these); rejected-rows policy. See the bulk-import blueprint in [../30-customization/12-solution-blueprints.md](../30-customization/12-solution-blueprints.md).

## 3. Acceptance criteria discipline

Every item gets 1–3 testable ACs phrased as observable behavior ("creating a Sale with status X creates 8 SaleDepartments rows", "a CRM-role user cannot see the Salary field"). ACs become the UAT checklist and the QA task list verbatim — write them so a tester who never saw the spec can execute them.

## 4. Review gates before the TRS is "approved"

1. **Trace check:** every in-scope fit-gap row maps to ≥1 TRS item; every TRS item cites a REQ.
2. **Buildability check:** for a sample of Config items, confirm the named mechanism exists in the [MCP tools catalog](../40-integrations-api/02-mcp-tools-catalog.md) with the parameters the spec assumes.
3. **Limitation check:** scan against [known limitations](../80-capability-matrix/02-known-limitations.md) (trigger depth, form-rules replace-all, aggregate groupby String, Get-Data limits, menu-item ID format...).
4. **Developer review** of all Custom-JS/Custom-Server/External items.
5. **Customer approval** (the גורם מאשר approves anything billable).

## Limitations & gotchas

- A TRS that says "as discussed in the meeting" anywhere has failed its purpose — the document must be self-contained.
- Specify lookup-table *contents* (status lists etc.), not just their existence; builders should never invent values.
- Keep message texts in §9 only and reference them — duplicated texts drift.
- For renamed entities, write specs using the **English table names** with the Hebrew display term in parentheses — builders work against table names; customers read display terms.
