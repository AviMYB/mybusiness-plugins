# MyBusiness CRM — Product Documentation (Public Tier)

> Reference documentation for implementers, developers, and AI agents working with **MyBusiness CRM** — a Hebrew-first Israeli CRM platform (Simbla no-code builder + Parse Server backend). This package powers the `myb-p-kb` skill: read selectively via its routing table.

## Map

| Section | Contents |
|---|---|
| **00-overview** | Product overview, architecture, bilingual glossary, environments & access |
| **10-modules** | CRM Core, MyBooks (Israeli billing), MyCampaigns, MyChat, MyCollege, TimeSheet, MyInbox |
| **20-data-model** | Data model, core & module tables, system/log tables, field types & conventions |
| **30-customization** | The customization surface: tables/fields, pages, table views, dashboards & reports, triggers, form rules, users & permissions, terminology, quote templates, field patterns, solution blueprints, customer portals |
| **40-integrations-api** | Parse REST API, MCP tools catalog, web2lead/web2table, server-side extensions, messaging channels, files |
| **50-ui-walkthrough** | Screenshot tours: runtime app + admin/builder |
| **60-implementation-methodology** | Lifecycle, discovery (אפיון), fit-gap analysis, technical spec authoring, implementation planning, estimation — **with fill-in templates** under `60-implementation-methodology/templates/` |
| **80-capability-matrix** | Capability matrix (fit-gap backbone) + known limitations |
| **90-appendices** | Official guides catalog + FAQ/troubleshooting |

## Conventions

- English body with canonical Hebrew UI terms inline — מונח (Term); customer-facing templates are Hebrew.
- Capability levels: `Native / Config / Custom-JS / Custom-Server / External / Gap` (defined in 60/03).
- ⚠️ UNVERIFIED marks claims to verify before relying on; ticket/"in QA" claims expire — re-verify at use time.
- **Live system beats documents**: tenant schemas diverge — verify per app with read-only MCP calls before promising behavior.
- Every doc ends with `Limitations & gotchas`.
