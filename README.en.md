[גרסה בעברית](README.md)

# MyBusiness CRM — Build and Extend a CRM with AI

![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-d97757) ![version](https://img.shields.io/badge/version-1.0.1-007ec6) ![skills](https://img.shields.io/badge/skills-20-007ec6) ![ISO 27001](https://img.shields.io/badge/security-ISO_27001-2ea44f)

The official [Claude Code](https://claude.com/claude-code) plugin marketplace for **[MyBusiness CRM](https://www.mybusiness.co.il)** — a Hebrew-first, Israeli business-management platform: CRM core (leads, accounts, sales, cases, tasks) plus the MyBooks (billing), MyCampaigns (marketing), MyChat (WhatsApp), MyCollege (courses) and TimeSheet modules.

The `mybusiness-implementor` plugin turns Claude Code into an **expert implementor of the system**: describe what you need in plain language — Hebrew or English — and the AI plans and executes it for real: entities and fields, card pages, tables and dashboards, reports, automations, permissions, data import, and website form integration.

## Who is this for

**Existing MyBusiness customers** — want to add a new entity, build a management dashboard, set up an automation, or wire a landing-page form? Instead of a customization project — a conversation. Describe the need, review the plan, approve. All on your existing system, through the official API.

**System builders — for your own business or for your clients** — entrepreneurs, implementors, and agencies who want to stand up a complete business system at AI speed, without compromising on information security, standards, or sound architecture.

## All the advantages of vibe coding. Without the drawbacks.

Today anyone can "spin up a system" with AI in a few days. Anyone who has done it also knows what comes next: a codebase nobody really knows, no one to support it a year from now, and information security left entirely to you.

Here the AI **does not write a system from scratch — it configures one on top of a proven business platform**:

| | Vibe coding from scratch | MyBusiness + Claude Code |
|---|---|---|
| **Time to launch** | Days | Days — in plain language |
| **Code maintenance** | A codebase born yesterday that nobody knows | No codebase to maintain — configuration on a managed platform |
| **Long-term support** | None | A living product: team, support, ongoing updates |
| **Information security** | Entirely on you | **ISO 27001** certified, built-in roles and permissions model |
| **Architecture** | Whatever the prompt produced | A proven product data model and infrastructure |

<p align="center"><a href="https://sub.mybusiness.co.il/landingreg/"><b>Open a new system — 14-day free trial</b></a></p>

## What's inside

- **A product knowledge base** (`myb-p-kb`) — product capabilities, data model, known limitations, and the implementation methodology. Ask "can MyBusiness do X?" and get an answer from documentation, not guesswork.
- **19 hands-on implementation skills** that plan and execute real configuration work on a live tenant through the official MyBusiness MCP server:

| Area | Skills |
|---|---|
| Knowledge & analysis | `myb-p-kb` · `myb-p-fit-gap` (requirements fit-gap analysis) |
| Data model | `myb-p-create-entity` · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` |
| Pages & UI | `myb-p-page-builder` · `myb-p-page-tables` · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| Automation | `myb-p-trigger-setup` · `myb-p-form-rules` · `myb-p-sla-configuration` |
| Data & integrations | `myb-p-data-import` · `myb-p-web2lead-web2table` |
| Billing & quotes | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| Users & access | `myb-p-users-roles-permissions` |

Skills trigger in **both Hebrew and English**.

## Getting started

1. **Don't have a system yet?** Open a [trial account — 14 days free](https://sub.mybusiness.co.il/landingreg/).
2. **Connect Claude Code to your system** through the [MyBusiness MCP server](https://www.mybusiness.co.il/mcp-server/). One connection serves one tenant.
3. **Install the plugin** in Claude Code:

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
```

4. **Start a new session** and ask, for example: "Set up a supplier-management module with a list page and a dashboard." The skills load and trigger automatically.

> The implementation skills write to the live tenant they are connected to. Run your first experiments on a demo or sandbox tenant, and review the plan the AI presents before approving writes on a production system.

## Security and standards

- MyBusiness is **ISO 27001** certified.
- Every action goes through the product's official API — with its built-in permissions model, roles, and audit trail. No scripts, no direct database access.
- The knowledge base inside the plugin is limited to the product's public documentation.

## What's in this repository

```
.claude-plugin/marketplace.json      the marketplace manifest
plugins/mybusiness-implementor/      the plugin: 20 skills, each a folder with
                                     SKILL.md + references/
```

This repository is a generated release artifact — issues and feedback are welcome, but content changes land through the internal source repository and arrive here with the next release.

## Links and support

**MyBusiness CRM** · [www.mybusiness.co.il](https://www.mybusiness.co.il) · [Open a new system — 14-day free trial](https://sub.mybusiness.co.il/landingreg/) · [MCP server](https://www.mybusiness.co.il/mcp-server/) · [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com)
