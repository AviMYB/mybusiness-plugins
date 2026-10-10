# Standing Design Rules — corrections that become the default

> **Purpose:** The owner's recurring design corrections, turned into rules every pipeline stage reads before it starts, so the next engagement does not repeat the last one's mistakes.
> **Audience:** Every pipeline skill (discovery, fit-gap, solution model, spec, mockups, plan summary, process plan, build) and the people reviewing their output.
> **Sources:** Owner corrections during a 2026-09 implementation (the first engagement to feed this file); [06-native-before-new-table](../20-data-model/06-native-before-new-table.md); [03-pages-and-layouts §10](../30-customization/03-pages-and-layouts.md).
> **Last updated:** 2026-09-28 · **Status:** active — living document

---

## 1. How the rules work

- **Two files.** This global file (rules for every customer) and a per-customer file `<client>/docs/design-rules.md` (that customer's decisions, same format, IDs `CR-##`).
- **Read first.** Every pipeline stage reads both files in its first step and cites the rule IDs it applied (fit-gap `Evidence`, native-map `Rules`, the plan summary's decision register).
- **A rule beats a habit, not a customer decision.** When a customer explicitly wants the opposite, record the exception in the client file with the reason.

## 2. The global rules

| ID | Rule | Why | Origin |
|---|---|---|---|
| **SR-01** | Approve a one-page data model before any screen or mockup. | Screens built on an unapproved model get rebuilt. | 2026-09 implementation |
| **SR-02** | Every element maps to a named native mechanism; no mapping → custom with cost, or dropped. | Designs that assume non-native UI cannot be built or maintained. | 2026-09 implementation |
| **SR-03** | Extend or rename a vanilla entity before creating one; new data tables stay within the budget, each justified. | Every new table is permanent cost; vanilla entities carry behaviour for free. | 2026-09 implementation (Cases renamed "שירות") |
| **SR-04** | A state with dates is a status + date fields on the parent, not a table (freeze, retention, cancellation). | History is already in `_Timeline`. | 2026-09 implementation |
| **SR-05** | Cut fields with evidence: keep a legacy field only with usage evidence and a named reader. | Legacy forms carry fields nobody fills. | 2026-09 implementation (brief: most fields dropped) |
| **SR-06** | Release 1 = cards, fields, relations, statuses, form rules; automations, templates and integrations are release 2 unless a go-live blocker. | Structure settles before behaviour is wired to it. | 2026-09 implementation |
| **SR-07** | Build a thin native slice early and let the mockup mirror the build, not lead it. | The tenant shows the real building blocks; a free-form mockup does not. | 2026-09 implementation |
| **SR-08** | Closed value lists are lookup tables (pointer or multi-select), never code or free text. | The customer can add a value without a developer. | 2026-09 implementation |
| **SR-09** | Minimum fields on a card: every field names who fills it and who reads it; remove what nobody reads. | Overloaded cards are the top adoption complaint. | 2026-09 implementation (department heads' feedback) |
| **SR-10** | Page code only through official events, never hooks on `Simbla`/`Parse`; a code element states the native mechanism checked. | See 03-pages §10. | Page-JS review 08/2026 |

## 3. Feeding the file

- **Where corrections are caught:** discovery `decisions[]` with `kind: rule`; the process plan's per-track changelog with `kind: rule`; the build report's "owner corrections" section; any owner feedback on a model, mockup or card.
- **Promotion:** a correction that is not customer-specific becomes a proposed `SR-##` row (rule · why · origin) for the library maintainers — the same append-on-discovery discipline the capability matrix uses. A customer-specific one goes to `<client>/docs/design-rules.md` as `CR-##`.
- **Retirement:** a rule is never deleted; it is marked retired with the date and the reason.

## Limitations & gotchas

- Rules are defaults for design, not product facts; a product fact belongs in the capability matrix or known limitations.
- Keep each rule one line; the justification lives in "Why", the detail in the cited doc.
