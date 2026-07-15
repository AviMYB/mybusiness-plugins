# MyBusiness CRM — Product Overview

> **Purpose:** First-stop orientation for anyone (human or AI) who has never seen the product: what it is, who uses it, what it's made of, and how it gets adapted per customer.
> **Audience:** New developers, implementers, AI agents.
> **Last updated:** 2026-07-13 · **Status:** draft

---

## 1. What MyBusiness CRM is

**MyBusiness CRM** (מייביזנס) is an Israeli, Hebrew-first CRM platform for SMBs, built as a white-label vertical on top of **Simbla**, a no-code application builder, with a **Parse Server** backend hosted on Google Cloud. Every customer gets an isolated application (own `applicationId`, master key, numeric subdomain) pre-loaded with the MyBusiness module suite, which is then **customized per customer**: renamed entities, added fields and tables, redesigned pages, automations, permissions, documents, and integrations.

Its differentiation is **deep per-customer adaptation delivered as a service** — implementations behave more like micro bespoke projects than like self-service SaaS onboarding. That is why this documentation package centers on the customization surface and the pre-implementation methodology.

- Marketing site & guides: https://www.mybusiness.co.il (support guides under `/support/`)
- Support: support@mybusiness-crm.com

## 2. The module suite

| Module | URL path | What it does | Reference |
|---|---|---|---|
| **CRM Core** | `apps/mybusiness/` | Accounts (לקוחות/לידים), Contacts, Sales + pipeline, Cases (פניות), Tasks, Activities/calendar, dashboards | [10-modules/01](../10-modules/01-crm-core.md) |
| **MyBooks** | `apps/mybooks/` | Israeli invoicing & billing: quotes→invoices→receipts, credit clearing, retainers, inventory, מבנה אחיד, חשבונית ישראל | [10-modules/02](../10-modules/02-mybooks.md) |
| **MyCampaigns** | `apps/mycampaigns/` | Email/SMS/WhatsApp campaigns, audiences, landing pages | [10-modules/03](../10-modules/03-mycampaigns.md) |
| **MyChat** | `apps/mychat/` | Multi-channel conversations (WhatsApp et al.), chatbots | [10-modules/04](../10-modules/04-mychat.md) |
| **MyCollege** | `apps/mycollege/` | Courses, enrollment, attendance, exams | [10-modules/05](../10-modules/05-mycollege.md) |
| **TimeSheet** | `apps/timesheet/` | Projects, time tracking, salary calculation | [10-modules/06](../10-modules/06-timesheet.md) |
| **MyInbox** | `apps/myinbox/` | Email management (minimal) | [10-modules/07](../10-modules/07-myinbox-and-misc.md) |

All modules share one database and one user base per customer app; the central table is **Accounts** (referenced by 46+ tables). Data model: ~196 tables, ~2,592 fields, ~766 pointer relationships — see [20-data-model](../20-data-model/01-data-model-overview.md).

## 3. How the product is adapted per customer (the customization surface)

Six escalating mechanisms — this ladder is the backbone of fit-gap classification (see [60-implementation-methodology/03](../60-implementation-methodology/03-fit-gap-analysis.md)):

1. **Native features** — work out of the box (pipeline, calendar sync, document lifecycle, dashboards...).
2. **Configuration (no-code)** — terminology renaming, tables/fields, form pages, table views, menus, triggers/automations, form rules, roles/CLP, reports/dashboards, quote templates. Done in the builder UI or — increasingly — via the **MCP server** (~59 tools) by AI agents. See [30-customization](../30-customization/01-customization-overview.md).
3. **Custom JS/CSS** — per-page scripts and styling.
4. **Custom server functions** — Node functions deployed per app (`/functions/<appId>/<name>`), maintained in the platform's server-side codebase. See [40-integrations-api/04](../40-integrations-api/04-cloud-functions.md).
5. **External services** — Make/Zapier scenarios, GCP functions (lead scoring, AI services), external systems via webhooks.
6. **Product development** — changes to the shared platform.

A flagship composite that spans this whole ladder: **customer-facing portals** (פורטלי לקוח) — external audiences (parents, schools, examinees, citizens) logging into dedicated page sets with their own data scope. Scaffolding pages ship natively and portal users consume no license seats; real portals are assembled per customer across verticals (schools, membership orgs, and more) — see [30-customization/13](../30-customization/13-customer-portals.md). Surface the portal question early in discovery — it is the single biggest scope fork.

## 4. Access layers

| Layer | Endpoint | Used by |
|---|---|---|
| Runtime UI | `https://<numericId>.mbapps.co.il/apps/...` | End users (Hebrew UI) |
| Builder/admin UI | via `https://sub.mybusiness.co.il/login/` | Implementers |
| Parse REST API | `https://api.mbapps.co.il/parse/` | Integrations, scripts |
| MCP server | `https://mcp.mbapps.co.il/` | AI agents (59 tools) |

Authentication and the credential conventions are described in [04-environments-and-access.md](04-environments-and-access.md); architecture in [02-architecture.md](02-architecture.md); bilingual terminology in [03-glossary.md](03-glossary.md).

## 5. The implementation business model

A customer's life: **sale → kickoff & provisioning → discovery (אפיון) → fit-gap → technical spec → implementation plan → build → migration → UAT/training → go-live → ongoing support** (Level I/II, AI-assisted). The four pre-implementation deliverables and their templates are the subject of [60-implementation-methodology](../60-implementation-methodology/01-implementation-lifecycle.md). Customers are tiered by complexity (Low / Medium / High / Enterprise) according to how far down the customization ladder their needs reach — the tier scales process, pricing, and who must be involved.

## 6. Orientation paths ("I'm new — what do I read?")

| You are... | Read in this order |
|---|---|
| **Implementer preparing a discovery meeting** | This page → [10-modules](../10-modules/01-crm-core.md) (the customer's likely modules) → [60/02 discovery guide](../60-implementation-methodology/02-discovery-and-process-mapping.md) + questionnaire |
| **Analyst doing fit-gap / writing a spec** | [80-capability-matrix](../80-capability-matrix/01-capability-matrix.md) → [80/02 limitations](../80-capability-matrix/02-known-limitations.md) → [30-customization](../30-customization/01-customization-overview.md) → [60/03](../60-implementation-methodology/03-fit-gap-analysis.md) + [60/04](../60-implementation-methodology/04-technical-requirements-spec.md) |
| **Developer building custom work** | [02-architecture](02-architecture.md) → [20-data-model](../20-data-model/01-data-model-overview.md) → [40-integrations-api](../40-integrations-api/01-parse-rest-api.md) (esp. cloud functions) |
| **AI agent executing a spec** | [40/02 MCP catalog](../40-integrations-api/02-mcp-tools-catalog.md) → [30-customization](../30-customization/01-customization-overview.md) (build order + tool grammar) → the TRS at hand |
| **Anyone wanting to see the product** | [50-ui-walkthrough](../50-ui-walkthrough/01-runtime-app-tour.md) |

## Limitations & gotchas

- The Playground app used for live verification has renamed terminology (e.g., מכירות→פרויקטים) and synthetic data — don't mistake its quirks for product defaults.
- "Active customers" (business) and "registered apps" (platform) measure different things — apps include demos, churned, and internal environments.
- The platform evolves: a major UI redesign shipped May 2026 (unified-master.css); always re-verify visual/UI claims against the live system.
