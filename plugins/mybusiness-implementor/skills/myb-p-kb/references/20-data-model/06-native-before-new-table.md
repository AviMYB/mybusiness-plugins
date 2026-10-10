# Native before a new table — the data-model decision gate

> **Purpose:** The rule table every solution design passes before it adds an entity. It is the data-model sibling of the page-JS gate ([../30-customization/03-pages-and-layouts.md](../30-customization/03-pages-and-layouts.md) §10): stable rule IDs (`D-##`) that a solution model, a fit-gap row or a review can cite.
> **Audience:** Implementers and AI agents designing a customer solution (solution-model stage, fit-gap, functional spec), and reviewers of those designs.
> **Sources:** The vanilla ERD ([01-data-model-overview.md](01-data-model-overview.md)), core tables ([02-core-tables.md](02-core-tables.md)), field patterns ([../30-customization/11-field-patterns.md](../30-customization/11-field-patterns.md)), tables & fields ([../30-customization/02-tables-and-fields.md](../30-customization/02-tables-and-fields.md)); a 2026-09 implementation, where a first design with ~15 new entities was rebuilt as a renamed vanilla entity + one new table + lookups, and the result was simpler, stable and cheaper to maintain.
> **Last updated:** 2026-09-28 · **Status:** active

---

## 1. Why a gate

Every new table is a permanent cost that a field is not: its own page, list, permissions, menu entry, triggers to keep it in sync, report joins (aggregation resolves one pointer hop), migration mapping, and one more place a user has to look. Vanilla entities also carry behaviour a custom table does not get for free — pipeline, timeline, calendar, SLA, billing links, MyChat/e-mail linking. So the question is never "can this be a table?" (anything can) but "**which existing mechanism already carries this?**".

## 2. The order of preference

Walk the ladder top-down and stop at the first rung that genuinely works:

| # | Rung | Typical form |
|---|---|---|
| 1 | **Use / rename a vanilla entity** | Cases renamed "שירות"; Sales renamed "פרויקט"; Accounts = "משתתף" (terminology, [../30-customization/09-terminology-localization.md](../30-customization/09-terminology-localization.md)) |
| 2 | **A field on an existing entity** | date, number, checkbox, text; a status value; a pointer to an existing table |
| 3 | **A lookup table + pointer / multi-select** | a closed value list (types, reasons, sources, segments) — values editable by the customer, no deploy |
| 4 | **A new data table** | a genuinely different noun: its own identity, many rows per parent, its own owner/lifecycle, read or reported on its own |
| 5 | **Code** | only when rungs 1–4 cannot express it; see the page-JS gate (03-pages §10) and server functions (40/04) |

A new table (rung 4) needs a **written justification** (§4) and counts against the engagement's **table budget** (§5). Rungs 1–3 need neither.

## 3. The rule table

| ID | Don't | Do — the native shape |
|---|---|---|
| **D-01** | A custom entity for a noun a vanilla entity already models | Rename the vanilla entity (Cases → שירות, Sales → פרויקט); extend with fields |
| **D-02** | A table for a *state* the record passes through (freeze, retention attempt, suspension, "in onboarding") | A **status value** + the dates that matter (`FreezeStartDate`, `StopDate`) on the parent; history comes from `_Timeline` |
| **D-03** | A table for one *period* of a service/contract (term, renewal cycle) | Start date + term (months) + computed end on the parent; a renewal is a new record of the same entity, not a period table |
| **D-04** | A child table to hold a set of labels / flags / choices | A **multi-select** field (`array_<purpose>_Pointer_<Table>`) to a lookup ([../30-customization/11-field-patterns.md](../30-customization/11-field-patterns.md)) |
| **D-05** | A free-text or hard-coded list for a closed set of values | A **lookup table** + pointer — the customer adds a value without a developer |
| **D-06** | An own change-log / history table | `_Timeline` (server-side, per-table opt-in) — [04-system-tables-and-logs.md](04-system-tables-and-logs.md) §1 |
| **D-07** | A table of "template" rows in phase 1 (task templates, station templates) | Defer: templates exist only to feed automation, which is phase 2 (R2). In R1 the list of steps is a lookup (stations) and people open tasks by hand |
| **D-08** | Copying a record's data into a second table to show it elsewhere | Show it where it lives: a related-records table on the card, or a one-hop pointer display (`AccountId.Name`) |
| **D-09** | A per-department / per-product child table created by trigger ("a row per department on every sale") | One record per real unit of work (e.g. one service record per sold service line), typed by a department/type lookup |
| **D-10** | Separate fields per role/person for a repeating structure (Competitor1…N beyond 3, Contact1…N) | ≤3 fixed fields when the customer really thinks in "up to 3"; otherwise pointers to Contacts with a role lookup |
| **D-11** | A new status model per entity by default | Reuse the vanilla status tables; add or rename values; add a per-type status list only when types truly differ (parent-child statuses, 30/11) |
| **D-12** | Keeping a legacy field or table because it exists in the old system | Keep it only with **usage evidence** (fill-rate, who fills / who reads) — "a migration source is not a target schema" |

## 4. Justification checklist for a new table (rung 4)

Write one line per question into the solution model. Two "no" answers usually mean it should be a field, a status or a lookup:

1. Does the noun have its **own identity** the customer names and searches for?
2. Are there **many rows per parent** that live side by side (not one current value)?
3. Does it have **its own owner or lifecycle** different from the parent's?
4. Will someone **read or report on it on its own**, not only on the parent's card?
5. Is there **no vanilla table** (02-core-tables, 03-module-tables) that already models it?

Then the build checklist in [../30-customization/02-tables-and-fields.md](../30-customization/02-tables-and-fields.md) ("Spec checklist for a new table") covers *how*.

## 5. The table budget

Every solution model states a budget of new data tables and counts against it (lookup tables do not count). Defaults — the owner may raise the budget, in writing, in the model approval:

| Engagement size | Default budget of new data tables |
|---|---|
| S | 0–1 |
| M | ≤ 3 |
| L | ≤ 5 |

## 6. What a mockup may show — the native UI vocabulary

A customer-facing mockup shows only elements the platform renders natively. Anything else is marked "requires code" with its cost, or left out.

| Native element | Built with | Notes |
|---|---|---|
| Card with titled sections and rows (3/2/1 columns) | `Create-Form-Page`, `Edit-Page` rows/fields, `Add-Edit-Text-Element` | [../30-customization/03-pages-and-layouts.md](../30-customization/03-pages-and-layouts.md) §3–4 |
| Field controls: text, number, date, checkbox, dropdown (pointer), autocomplete, multi-select chips, long text | `Edit-Page add-new-field` (+ textarea via `set-html-content` for non-`Comment/Description/Notes` names) | multi-select = the `array_…_Pointer_…` name pattern |
| Tabs on a card | `Add-Edit-Tabs-Element` | never build tabs in JS (03-pages §10 H-07) |
| Related-records table on a card, with inline create/edit | `Add-Table-View-to-Form-Page`, `Edit-Table-View` | inline create needs the `db-form-add` button and an `action` column (known-limitations §21) |
| Conditional hide / required / read-only / fixed value / message | Form rules | client-side only ([../30-customization/07-form-rules.md](../30-customization/07-form-rules.md)) |
| Computed value | a trigger (server) or `formula-value` (numbers only) | date + N months needs a trigger (known-limitations §21) |
| List page with a search form, default filters, Excel export | `Create-Table-View-Page`, `Edit-Table-View` | default "my records" = `val="currentUser"` on the search field |
| Dashboard counters, charts, tables | dashboard tools ([../30-customization/05-dashboards-and-reports.md](../30-customization/05-dashboards-and-reports.md)) | |
| Record timeline | `_Timeline` + timeline settings | |
| Sales pipeline board | vanilla Sales pipeline | a kanban on a custom entity is **not** native |

Not native — show only as "requires code" with a cost: wizards / multi-step guided flows; action buttons that create records or call functions; drag-and-drop boards on custom entities; line-item editors outside price quotes; client-side computed dates; cross-record live rollups beyond one pointer hop. Before promising any card behaviour, check [../80-capability-matrix/02-known-limitations.md](../80-capability-matrix/02-known-limitations.md) §16 (items 74–81: child tables on unsaved records, child tables on cards, referential integrity, zero-height containers).

## Limitations & gotchas

- The budget is a forcing function, not a law: a real business noun beats the number — but the justification must be written and approved.
- A renamed vanilla entity keeps some vanilla wording in product JS (card titles, SLA screen); plan the terminology pass ([../30-customization/09-terminology-localization.md](../30-customization/09-terminology-localization.md)) and its known exceptions.
