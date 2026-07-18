# MyBusiness CRM — Claude Code Plugin Marketplace

The official [Claude Code](https://claude.com/claude-code) plugin marketplace for **[MyBusiness CRM](https://www.mybusiness.co.il)** — a Hebrew-first, Israeli business-management platform: CRM core (leads, accounts, sales, cases, tasks) plus the MyBooks (billing), MyCampaigns (marketing), MyChat (WhatsApp), MyCollege (courses) and TimeSheet modules.

This repository ships one plugin:

## `mybusiness-implementor`

An implementation toolkit that turns Claude Code into a MyBusiness CRM implementation assistant. It bundles:

- **A product knowledge base** (`myb-p-kb`) — the librarian skill: product capabilities, data model, customization grammar, MCP tools catalog, known limitations, and the implementation methodology. Ask "can MyBusiness do X?" and it answers from documentation, not guesswork.
- **19 hands-on implementation skills** that plan and execute real configuration work on a live tenant through the MyBusiness MCP server — no code required from you.

| Area | Skills |
|---|---|
| Knowledge & analysis | `myb-p-kb` (product KB librarian) · `myb-p-fit-gap` (requirements fit-gap analysis) |
| Data model | `myb-p-create-entity` · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` |
| Pages & UI | `myb-p-page-builder` · `myb-p-page-tables` · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| Automation | `myb-p-trigger-setup` · `myb-p-form-rules` · `myb-p-sla-configuration` |
| Data & integrations | `myb-p-data-import` · `myb-p-web2lead-web2table` |
| Billing & quotes | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| Users & access | `myb-p-users-roles-permissions` |

Skills trigger in **both Hebrew and English** — "צור ישות חדשה לניהול ספקים", "build a sales dashboard", "הוסף טריגר ששולח מייל בשינוי סטטוס" all route to the right skill automatically.

## Installation

In Claude Code:

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
```

Then start a new session. The skills load automatically and trigger on relevant requests.

## Requirements

- **Claude Code** (CLI, desktop, or IDE extension).
- **A MyBusiness CRM tenant** you are authorized to configure.
- **A MyBusiness MCP server connection** (`https://mcp.mbapps.co.il/`) configured for that tenant — one connection serves one tenant. Contact [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com) for connection credentials and setup. The full MCP tools catalog ships inside the plugin at `plugins/mybusiness-implementor/skills/myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md`.

The knowledge-base skill (`myb-p-kb`) works without an MCP connection; the implementation skills need one to do real work.

## A word of caution

The implementation skills write to the live tenant they are connected to (tables, pages, triggers, permissions). Run them against a demo or sandbox tenant first, and review what a skill plans to do before approving writes on a production system.

## What's in this repository

```
.claude-plugin/marketplace.json      the marketplace manifest
plugins/mybusiness-implementor/      the plugin: 20 skills, each a folder with
                                     SKILL.md + references/
```

This repository is a generated release artifact — issues and pull requests are welcome as feedback, but content changes land through the internal source repository and arrive here with the next release.

## Support

**MyBusiness CRM** · [www.mybusiness.co.il](https://www.mybusiness.co.il) · [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com)
