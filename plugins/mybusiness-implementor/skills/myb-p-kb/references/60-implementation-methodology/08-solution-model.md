# The Native Solution Model — phase 3b, between fit-gap and spec

> **Purpose:** The stage that fixes *what the solution is made of* — entities, fields, relations, lookups, statuses — before any screen, mockup or automation is designed. Its output is one approved page plus a mapping file that every later stage inherits.
> **Audience:** Implementers and AI agents running the pre-implementation pipeline; the customer's decision-maker, who approves the model.
> **Sources:** [06-native-before-new-table](../20-data-model/06-native-before-new-table.md) (the D-rules), [09-standing-design-rules.md](09-standing-design-rules.md), the build skill's REUSE / ADD-FIELD / CREATE reconciliation (moved up to this stage), the process-plan station ladder (structure stations 2–4); a 2026-09 implementation whose first mockup had to be rebuilt because no such stage existed.
> **Last updated:** 2026-09-28 · **Status:** active

---

## 1. Why this stage exists

Without it, entities are decided implicitly: a discovery noun becomes a table, a mockup draws it, the spec writes it down, and the owner first sees the data model inside a finished approval bundle — when every screen already depends on it. The failure mode is predictable: too many entities, statuses per entity, automation mixed into structure, and screen elements the platform cannot render natively. This stage makes the data model a **separate, early, one-page decision**, checked against the platform before anything is drawn.

## 2. Position and inputs

`business-discovery` → `fit-gap` → **solution model** → `functional-spec` → `plan-summary-for-approval` → `build`.

| Input | From |
|---|---|
| In-scope rows of `fit-gap.csv` (with `Footprint` and `Usage evidence`) | fit-gap |
| `usage-evidence.csv` — per legacy field: fill-rate, last update, who fills, who reads | discovery (existing-system mode) |
| The BRD's entities and process maps | discovery |
| A **read-only** baseline of the tenant: `Get-Schema` of every touched table, `Get-Site-Pages`, existing lookups | this stage (moved up from build Step 0) |
| Global + client standing rules | [09-standing-design-rules.md](09-standing-design-rules.md), `<client>/docs/design-rules.md` |

## 3. Procedure

1. **Read the standing rules** (global + client). Every rule applied is cited later by ID.
2. **Baseline the tenant (read-only)** and reconcile each candidate entity: **REUSE** (a vanilla table carries it), **ADD-FIELD** (extend a vanilla table), **CREATE** (nothing fits). Default to REUSE.
3. **Construct pass.** From the in-scope rows, list every entity, field, status list and behaviour the solution implies — one row each in `native-map.csv`.
4. **Map every row to a native mechanism** (§4) using the order of preference and the D-rules. A row that maps to nothing becomes `custom` with a written cost, or is dropped.
5. **Cut with evidence.** A field kept from the legacy system needs usage evidence; "no evidence of use" → drop or defer.
6. **Budget.** Count new data tables against the budget (D-rules §5); each has its five-question justification.
7. **Phase-tag.** Every row gets `R1` (structure: tables, fields, lookups, statuses, cards, lists, tabs, form rules) or `R2` (automation: triggers, scheduled triggers, templates, notifications, integrations, documents). Default for behaviour is R2; R1 needs a written go-live reason.
8. **Render the one-page model** (§5) and get the owner's approval — recorded in `engagement.json.model`.
9. **Thin slice (with the owner's go for tenant writes).** Build R1 in the tenant — tables, lookups with values, the core cards and lists, sample records — and walk it with the owner. Corrections go back into the model (new version) and, when they are general, into the standing rules.
10. Hand off: the functional spec copies §2 (tables/fields) from the approved model; mockups are generated from `native-map.csv` or mirror the slice.

## 4. `native-map.csv` — columns

| Column | Content |
|---|---|
| `MOD ID` | `MOD-###`, assigned once, never reused |
| `Element` | the thing, in the customer's words (e.g. "תאריך הפסקה", "סוג שירות") |
| `Kind` | entity · field · status-list · status-value · relation · behaviour · screen-element |
| `Mechanism` | vanilla-entity · renamed-entity · field · pointer · lookup · lookup-value · multi-select · status · form-rule · table-view · tab · section · trigger · scheduled-trigger · template · report · dashboard · custom-js · custom-server |
| `Target` | exact name: `Cases.StopDate`, `LeaveReasons`, rule name, page id … |
| `Provenance` | vanilla · extended · new |
| `Phase` | R1 · R2 |
| `Evidence` | REQ IDs + usage evidence reference |
| `Rules` | D-## / SR-## applied |
| `Decision` | keep · drop · custom-with-cost |
| `Note` | the one-line justification (mandatory for `new` tables and `custom`) |

Quality gate: every in-scope REQ is covered by ≥1 row; no row has an empty `Mechanism`; every `new` table has a justification and is inside the budget; every `custom` row carries its cost.

## 5. The one-page data model (`docs/model/data-model.html`)

One page, customer-readable (Hebrew for Israeli customers), rendered with the shared template:

- the entities as a small diagram (≤ 10 nodes) with a provenance chip per table — **vanilla / renamed / extended / new**;
- per entity: its fields grouped by section, its status list, its lookups with their values;
- the table budget ("new data tables: 1 of 3") and one line per new table;
- what is deliberately **not** in the model, and what waits for R2.

## 6. Artifacts and state

```
<engagement-root>/docs/model/
├── data-model.html          ← the one page the owner approves
├── native-map.csv           ← every element → native mechanism, phase, evidence, rules
└── usage-evidence.csv       ← copied from discovery when a legacy system exists
```

`engagement.json.model = {"version": "1.0", "approvedBy": "<name>", "approvedAt": "YYYY-MM-DD", "newTables": 0, "budget": 0, "rows": 0, "slice": "none | built | walked"}`. `approval.json` records the `modelVersion` it covers. See [07-pipeline-contract.md](07-pipeline-contract.md).

## 7. Exit criteria

- The owner approved the one-page model (by name, dated).
- `native-map.csv` passes the quality gate.
- For M/L engagements: the R1 slice is built and walked, or the owner waived it in writing.

## Limitations & gotchas

- The model is not the spec: it fixes *what exists*, not screen layouts, trigger JSON or report definitions.
- A mockup made before this stage is a sketch, not a design — do not let it drive the model.
- Tenant writes for the slice still need the owner's explicit go; a read-only baseline does not.
