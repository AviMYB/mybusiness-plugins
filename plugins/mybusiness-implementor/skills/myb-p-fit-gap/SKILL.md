---
name: myb-p-fit-gap
description: "Run a Fit-Gap analysis for a MyBusiness CRM customer - classify every requirement from the discovery document against actual product capabilities and produce a branded Hebrew HTML report + machine-readable workbook. Use after business discovery (אפיון) when the user asks for - fit gap, ניתוח פערים, ניתוח התאמה, gap analysis, 'מה המערכת יודעת לעשות מתוך הדרישות', סיווג דרישות, scope decision, הערכת היקף לדרישות, או כשיש req-register.csv שצריך לסווג. Classification uses the evidence-backed capability matrix (never intuition), the ladder Native/Config/Custom-JS/Custom-Server/External/Gap plus Process-change and Defer dispositions, and produces effort + ownership per requirement. Input - the discovery REQ register; output feeds functional-spec."
---

# Fit-Gap Analysis — ניתוח התאמה ופערים

Classify every requirement to the **cheapest rung that genuinely works**, with evidence, and hand the customer a scope decision they can sign. Method: our capability ladder + the fit-to-standard-first principle (adopt > adapt > build), gap dispositions with written justification, and a traceable workbook the spec skill consumes.

## Knowledge sources (binding lookup order — never classify from memory)

1. **Capability matrix**: `../myb-p-kb/references/80-capability-matrix/01-capability-matrix.md` → then ALWAYS `02-known-limitations.md` before any "yes". The matrix is evidence-backed; if a row is missing, check `30-customization/12-solution-blueprints.md` (solved patterns: SLA, import, web2lead, multi-select, cascading, portals…), then the domain doc, then verify live on a sandbox before classifying. ⚠️ UNVERIFIED items must be verified before promising.
2. Effort anchors: `../myb-p-kb/references/60-implementation-methodology/06-estimation-guide.md`.
3. Method: `../myb-p-kb/references/60-implementation-methodology/03-fit-gap-analysis.md` + this skill's `references/classification-playbook.md`. **Precedence: the workbook/CSV header in this skill's `references/output-spec.md` §2 is the authoritative contract; the KB method doc (and any template CSV) is background — on any schema difference, output-spec wins.**
4. Effort anchors: `../myb-p-kb/references/60-implementation-methodology/06-estimation-guide.md`.

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

Plus two **dispositions** that may resolve a row instead of a class: **Process-change** (השינוי בתהליך, לא במערכת — the customer adapts to the standard flow; requires customer agreement recorded) and **Defer** (waiting room with a revisit date). Every step DOWN the ladder requires one line of written justification citing the decision factors (playbook §4).

Mandatory per row: exact **solution sketch** naming the mechanism ("scheduled trigger on Cases.NextStepDate +6h → email to OwnerId") — if you can't write that line, you haven't classified; **limitation check** against known-limitations (trigger chains ≤3, full-replace writers, aggregate groupby String, no native dedupe…); **effort** (S/M/L/XL per anchors); **owner**; Custom-Server/External rows get a developer-consult flag (5-minute consult prevents a mis-sold week).

## Step 4 — Scope decision

Priority × effort defaults: חובה+S/M → in scope · חובה+L/XL → challenge the requirement first (can a blueprint or leaner variant serve the need?) · רצוי/אפשרי+L/XL → propose phase 2 with a revisit date. Gaps get one of three written resolutions: workaround (+its friction cost) / defer / descope (customer informed). Derive the **complexity tier** (Low/Medium/High/Enterprise = deepest rung used) — it scales the rest of the engagement. Paid custom work requires the customer's גורם מאשר explicitly, item by item.

## Step 5 — Render & hand off

- Output per `references/output-spec.md`: branded Hebrew HTML report (`../myb-p-kb/assets/doc-template.html`, {{DOC_TYPE}}="ניתוח התאמה ופערים — Fit-Gap") + **`fit-gap.csv`** (the machine handoff to `functional-spec`).
- **The classification table MUST ship with a legend (מקרא) + an interactive client-side filter** (priority/class/effort/decision/domain + free-text) — mandatory in every report; drop-in snippet in `references/output-spec.md` §5.
- Location: per the pipeline contract (`../myb-p-kb/references/60-implementation-methodology/07-pipeline-contract.md`) — customer folder `docs/fit-gap/` (fallback `./deliverables/fit-gap-<customer>/`); update `engagement.json` (tier, scope counts).
- Tell the user: counts per class, tier, effort rollup, items needing dev consult, items awaiting customer decision.

## Hard rules

- **Look it up, don't guess** — every class cites matrix row/blueprint/live verification. An answer "from experience" is a bug.
- Claims citing open tickets or "in QA" in the KB **expire** — re-verify before relying.
- If you discover a capability or limitation the matrix lacks — note it in the report AND flag for the maintainers (matrix is append-on-discovery).
- "Config in theory, Custom in practice": 14 interlocking triggers are worse than one server function — judge by maintainability, not class vanity.
- The report is Hebrew; solution sketches may carry English mechanism names.
