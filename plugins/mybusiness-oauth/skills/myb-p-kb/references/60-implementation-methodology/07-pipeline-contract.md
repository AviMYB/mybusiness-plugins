# The Pipeline Contract — canonical layout, filenames, and machine-readable state

Status: active · Last updated: 2026-07-06

The pre-implementation pipeline (`business-discovery` → `myb-p-fit-gap` → `functional-spec` → `plan-summary-for-approval` → `build`) hands state forward through **files with fixed names in fixed places**. This contract is the single definition of that layout. Every pipeline skill's Inputs/Outputs section points here; on any conflict, this file wins.

## 1. Canonical engagement layout

All artifacts live under one **engagement root** — the customer's folder when the customer-folder convention exists, otherwise a single `./deliverables/` tree. Stages never invent parallel structures.

```
<engagement-root>/docs/
├── engagement.json                      ← the manifest (see §2) — created by discovery, updated by every stage
├── discovery/
│   ├── index.html                       ← the BRD (+ per-process pages for L)
│   └── req-register.csv                 ← 11-column contract → fit-gap
├── fit-gap/
│   ├── index.html
│   └── fit-gap.csv                      ← 17-column contract → functional-spec; build writes Actual effort/Variance back
├── spec/
│   ├── index.html                       ← the functional/technical spec
│   ├── workplan.html                    ← M/L (S embeds it in index.html)
│   ├── uat-checklist.html
│   └── uat-checklist.csv                ← the acceptance oracle (verify column uses the mcp:/browser:/manual: grammar)
├── approval/
│   ├── approval-summary.html            ← the executive approval document
│   └── approval.json                    ← the machine-readable gate record (see §3) — build's hard precondition
└── build/
    ├── baseline.json                    ← Step-0 tenant snapshot
    ├── build-ledger.csv|jsonl           ← the resumable execution ledger
    └── build-report.html                ← completion-gate output
```

Fallback when no customer folder exists: the same tree under `./deliverables/` (e.g. `./deliverables/discovery-<customer>/` … keep the filenames identical). A stage that cannot find its input at the canonical path asks the user — it never guesses silently or re-derives the artifact.

## 2. `engagement.json` — the manifest

Created by discovery, updated by every stage that changes pipeline state. Carried facts (not derivable from any single HTML doc):

```json
{
  "customer": "<name>",
  "vertical": "<vertical>",
  "size": "S | M | L",
  "discovery":  { "validatedAt": "YYYY-MM-DD", "validatedBy": "<who>", "reqCount": 0 },
  "fitGap":     { "tier": "Low | Medium | High | Enterprise", "inScope": 0, "phase2": 0, "out": 0 },
  "spec":       { "version": "0.9", "items": 0, "packages": 0 },
  "approval":   { "status": "none | draft | approved", "specVersion": "" },
  "build":      { "status": "none | in-progress | complete", "ledger": "docs/build/build-ledger.csv" },
  "updatedAt": "YYYY-MM-DD"
}
```

Rules: stages **read** upstream keys instead of parsing HTML (size, validation, tier, spec version); each stage **writes only its own key** + `updatedAt`; the file is additive — never delete another stage's record.

## 3. `approval.json` — the gate record

Emitted by `plan-summary-for-approval` (status `draft` on first render), flipped to `approved` only on an explicit recorded decision. `build` refuses to write anything to the tenant without an `approved` record whose `specVersion` matches the spec set (or an explicit user confirmation recorded in the ledger header).

```json
{
  "status": "draft | approved | rejected",
  "approver": "<decision-maker, by name>",
  "approvedAt": "YYYY-MM-DD",
  "specVersion": "<the spec version this approval covers>",
  "scope": { "inScope": 0, "phase2": 0, "out": 0 },
  "notes": "<הסתייגויות / conditions, if any>"
}
```

Invalidation rule: any change to the spec set bumps the spec version → the approval record no longer matches → re-approve. Nobody edits `status` by hand without the recorded decision behind it.

## 4. ID grammars (traceability spine)

- **REQ IDs** (`req-register.csv`): `REQ-###`, zero-padded, sequential in capture order. **Assigned once, never renumbered or reused** — a dropped requirement retires its ID (waiting-room note), it is not recycled. Every downstream row (fit-gap, spec items, UAT rows) traces by this ID.
- **Spec item IDs**: `<DOMAIN>-##` per the spec grammar (TERM-01, TBL-03, AUT-05 …), unique within the spec, each citing ≥1 REQ ID.
- **QA IDs** (`uat-checklist.csv`): `QA-###`, each citing its spec item.

## 5. Who reads / writes what

| Stage | Reads | Writes |
|---|---|---|
| business-discovery | (customer materials, tenant read-only) | `discovery/*`, creates `engagement.json` |
| fit-gap | `req-register.csv`, discovery HTML, `engagement.json` | `fit-gap/*`, updates `engagement.json.fitGap` |
| functional-spec | `fit-gap.csv`, discovery doc, live schema | `spec/*`, updates `engagement.json.spec` |
| plan-summary-for-approval | all four upstream deliverables | `approval/*` (incl. `approval.json`), updates `engagement.json.approval` |
| build | spec set + `approval.json` + ledger | `build/*`, fills `Actual effort`/`Variance note` in `fit-gap.csv`, updates `engagement.json.build` |
