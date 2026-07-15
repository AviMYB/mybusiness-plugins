# Estimation Guide (Public Edition) — הערכת היקפים

> **Purpose:** A shared effort vocabulary (S/M/L/XL) and per-artifact anchors for consistent fit-gap and plan estimates.
> **Last updated:** 2026-06-10 · **Status:** draft (public tier)

## 1. Effort classes

| Class | Definition | Anchor (experienced implementer / AI agent + review) |
|---|---|---|
| **S** | Single mechanism, known pattern | ≤ 1 hour |
| **M** | Several mechanisms or one × many instances | half a day |
| **L** | Blueprint-scale assembly (tables + triggers + pages working together) or custom-JS work | 1–2 days |
| **XL** | Server-side development, external integration, or a novel unproven pattern | 3+ days, developer involved |

## 2. Per-artifact anchors (Config work)

| Artifact | Unit effort |
|---|---|
| Terminology replacement set | S |
| New field incl. Hebrew label | S (minutes; batch per table) |
| Lookup table + values | S |
| Full custom entity (table + form page + list page + menu + data) | M–L |
| Form-page restructure | M per page |
| Table view (columns/filters/formatting) | S–M |
| Trigger (internal action) / scheduled trigger | S / S–M |
| Form rule | S |
| Role + CLP for a table set | M |
| Report / aggregate report | S–M / M |
| Dashboard (3–6 elements) | M–L |
| Branded quote template | M–L (design iterations dominate — cap rounds in scope) |
| web2lead endpoint + mapping | S–M |
| WhatsApp channel + template approvals | M (external approval latency is calendar risk, not effort) |
| Bulk import per source file | M–L (dirty data → L; includes rehearsal + count validation) |
| SLA blueprint (full) | L |
| Custom-JS page behavior | L |
| Server function / external integration | XL / M–XL |
| Customer portal | L–XL, phased (see [../30-customization/13-customer-portals.md](../../30-customization/13-customer-portals.md)) |

## 3. Estimation procedure

1. Estimate per TRS item from the anchors; between two classes — take the higher.
2. Add the overheads everyone forgets: discovery/spec writing (M–L per project), migration rehearsal (M), UAT support + fixes (≈15–20% of build), training (S–M per session), go-live week (M).
3. Custom-Server/External items: estimate **with a developer**, plus integration-test time.
4. Quote ranges at fit-gap; commit to dates only in the plan, after customer dependencies are dated.
5. Record actuals next to estimates and recalibrate the anchor table periodically.

## Limitations & gotchas

- AI agents shrink build time dramatically, but review and customer communication do not — never scale a whole estimate by an "AI factor"; scale only the build portion.
- Customer dependencies (data files, WhatsApp template approval, branding assets) slip schedules more than build effort does — date them from day one.
