---
name: myb-p-fit-gap
description: "Run a Fit-Gap analysis for a MyBusiness CRM customer - classify every requirement from the discovery document against actual product capabilities and produce a branded Hebrew HTML report + machine-readable workbook. Use after business discovery (אפיון) when the user asks for - fit gap, ניתוח פערים, ניתוח התאמה, gap analysis, 'מה המערכת יודעת לעשות מתוך הדרישות', סיווג דרישות, scope decision, הערכת היקף לדרישות, או כשיש req-register.csv שצריך לסווג. Classification uses the evidence-backed capability matrix (never intuition), the ladder Native/Config/Custom-JS/Custom-Server/External/Gap plus Process-change and Defer dispositions, and produces effort + ownership per requirement. Also records each row's footprint (vanilla / new table / automation / custom) against a new-table budget and legacy usage evidence. Input - the discovery REQ register; output feeds the solution model, then functional-spec."
---

# Fit-Gap Analysis — ניתוח התאמה ופערים

Classify every requirement to the **cheapest rung that genuinely works**, with evidence, and hand the customer a scope decision they can sign. Method: our capability ladder + the fit-to-standard-first principle (adopt > adapt > build), gap dispositions with written justification, and a traceable workbook the spec skill consumes.

## Knowledge sources (binding lookup order — never classify from memory)

1. **Capability matrix**: `../myb-p-kb/references/80-capability-matrix/01-capability-matrix.md` → then ALWAYS `02-known-limitations.md` before any "yes". The matrix is evidence-backed; if a row is missing, check `30-customization/12-solution-blueprints.md` (solved patterns: SLA, import, web2lead, multi-select, cascading, portals…), then the domain doc, then verify live on a sandbox before classifying. ⚠️ UNVERIFIED items must be verified before promising.
2. Effort anchors: `../myb-p-kb/references/60-implementation-methodology/06-estimation-guide.md`.
3. Method: `../myb-p-kb/references/60-implementation-methodology/03-fit-gap-analysis.md` + this skill's `references/classification-playbook.md`. **Precedence: the workbook/CSV header in this skill's `references/output-spec.md` §2 is the authoritative contract; the KB method doc (and any template CSV) is background — on any schema difference, output-spec wins.**
4. Data-model gate and standing rules: `../myb-p-kb/references/20-data-model/06-native-before-new-table.md` (order of preference, D-rules, new-table justification, table budget) and `../myb-p-kb/references/60-implementation-methodology/09-standing-design-rules.md` + the customer's `docs/design-rules.md` — read both before classifying and cite the rule IDs you apply.

## Inputs

- `req-register.csv` (or the REQ table) from `business-discovery` — including fit-criterion and demo fit-evidence columns.
- The discovery document itself (process maps — needed for connected-process impact).
- If no register exists: offer to run a compact discovery first, or build the register interactively from what the user provides (same schema) — never classify free-floating wishes.

## Step 1 — Calibrate

Inherit the engagement size (S/M/L) from discovery. S: classification table inside one report, decisions inline. M/L: full report incl. gap register with decision factors, connected-process impacts, phase plan.

## Step 2 — Fit-to-standard pass (before any gap thinking)

Sort the register: rows whose discovery fit-evidence says `works-as-is` → classify **Native** immediately (cite the demo). Rows with `works-with-config` → tentative **Config**, verify mechanism by name. Only the remainder enters real analysis. Principle: *adopt wherever possible, adapt only where justified; never rebuild the customer's legacy system inside the CRM*.

## Step 3 — Classify the remainder (per requirement)

Follow `references/classification-playbook.md` (decision tree + worked examples). The ladder, cheapest first:

| Class | Meaning | Owner |
|---|---|---|
| **Native** | works out of the box / a setting | — |
| **Config** | no-code: fields, pages, views, dashboards, reports, triggers, form rules, roles/CLP, terminology, quote templates | implementer/AI |
| **Custom-JS** | page-level JS/CSS | implementer + dev review |
| **Custom-Server** | server function (dev ticket) | developer |
| **External** | Make/Zapier/external service owns it | dev/implementer + service |
| **Gap** | not acceptably solvable today | — |

**Stepping onto Custom-JS carries an extra burden of proof.** Most page JS written in this platform replaces a mechanism the page runtime already ships (filtering a picker's options, blocking a save, a mandatory field, a dependent dropdown, page structure, a change log). Before a row may be classified **Custom-JS**, name the native mechanism you checked and why it does not fit — the anti-pattern-to-mechanism table is `../myb-p-kb/references/30-customization/03-pages-and-layouts.md` §10, and the traps that make a native path *look* unavailable are `../myb-p-kb/references/80-capability-matrix/02-known-limitations.md` §16. A Custom-JS row that turns out to be a native mechanism is sold effort the customer should never have paid for, plus a workaround that breaks on the next platform update.

**Footprint — the cost hidden inside Config.** A new field, a new lookup value, a new data table and a trigger are all "Config", but they cost very differently over the life of the system. Every row also gets a `Footprint`: **Vanilla** (field, value or status on an existing entity; a renamed entity) · **New-table** (a new data table — needs the five-question justification and counts against the table budget, KB `20-data-model/06` §4–5) · **Automation** (trigger, scheduled trigger, template, notification) · **Custom** (JS/server). Walk the order of preference first: a noun a vanilla entity already models is renamed, a state with dates is a status + date fields, a closed list is a lookup — only then a table. A row that keeps a legacy field or table carries its **usage evidence** (fill-rate · who fills · who reads, from discovery); `none` makes it a drop/defer candidate.

Plus two **dispositions** that may resolve a row instead of a class: **Process-change** (השינוי בתהליך, לא במערכת — the customer adapts to the standard flow; requires customer agreement recorded) and **Defer** (waiting room with a revisit date). Every step DOWN the ladder requires one line of written justification citing the decision factors (playbook §4).

Mandatory per row: exact **solution sketch** naming the mechanism ("scheduled trigger on Cases.NextStepDate +6h → email to OwnerId") — if you can't write that line, you haven't classified; **limitation check** against known-limitations (trigger chains ≤3, full-replace writers, aggregate groupby String, no native dedupe…); **effort** (S/M/L/XL per anchors); **owner**; Custom-Server/External rows get a developer-consult flag (5-minute consult prevents a mis-sold week).

## Step 4 — Scope decision

Priority × effort defaults: חובה+S/M → in scope · חובה+L/XL → challenge the requirement first (can a blueprint or leaner variant serve the need?) · רצוי/אפשרי+L/XL → propose phase 2 with a revisit date. **Footprint default: `Automation` rows (triggers, scheduled reminders, templates, notifications, integrations) go to Phase 2 — structure settles before behaviour is wired to it — unless the row blocks go-live (write the reason).** Gaps get one of three written resolutions: workaround (+its friction cost) / defer / descope (customer informed). Derive the **complexity tier** (Low/Medium/High/Enterprise = deepest rung used) — it scales the rest of the engagement. Report the **footprint summary** next to the class counts: new data tables vs the budget (each with its justification), new fields per table, triggers. Paid custom work requires the customer's גורם מאשר explicitly, item by item.

## Step 5 — Render & hand off

- Output per `references/output-spec.md`: branded Hebrew HTML report (`../myb-p-kb/assets/doc-template.html`, {{DOC_TYPE}}="ניתוח התאמה ופערים — Fit-Gap") + **`fit-gap.csv`** (the machine handoff to the solution model, which fixes the data model before `functional-spec` — pipeline contract).
- **The classification table MUST ship with a legend (מקרא) + an interactive client-side filter** (priority/class/effort/decision/domain + free-text) — mandatory in every report; drop-in snippet in `references/output-spec.md` §5.
- Location: per the pipeline contract (`../myb-p-kb/references/60-implementation-methodology/07-pipeline-contract.md`) — customer folder `docs/fit-gap/` (fallback `./deliverables/fit-gap-<customer>/`); update `engagement.json` (tier, scope counts).
- Tell the user: counts per class, tier, effort rollup, items needing dev consult, items awaiting customer decision.

## Hard rules

- **Look it up, don't guess** — every class cites matrix row/blueprint/live verification. An answer "from experience" does not count.
- Claims in the KB that are marked provisional or pending verification **expire** — re-verify before relying.
- If you discover a capability or limitation the matrix lacks — note it in the report AND flag for the maintainers (matrix is append-on-discovery).
- "Config in theory, Custom in practice": 14 interlocking triggers are worse than one server function — judge by maintainability, not class vanity.
- **A new table is never "just Config."** Mark it `New-table`, justify it, count it against the budget — a design that adds a table for a state, a period or a set of labels has skipped the order of preference.
- The report is Hebrew; solution sketches may carry English mechanism names.
