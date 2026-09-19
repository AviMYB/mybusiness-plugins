[גרסה בעברית](README.md)

# MyBusiness CRM — Build and Extend a CRM with AI

## Codex Desktop: App ID + API token setup (1.2.0)

After installing MyBusiness, choose the starter **הגדרת חיבור MyBusiness — פתח טופס App ID וטוקן**, or ask Codex to open MyBusiness setup. Enter credentials only in the local window, select your Bitwarden project and choose **בדוק ושמור חיבור**. After success, start a new task and verify the CRM table names. Do not use Authenticate or edit plugin files.

Windows prerequisites: Python 3.11+ with Tk on PATH, and configured Bitwarden Secrets Manager CLI with a writable project. [Exact setup and troubleshooting](plugins/mybusiness-implementor/SETUP-CODEX.md). For an older installation, upgrade the mybusiness marketplace, then remove and reinstall the plugin. The legacy Claude/manual configuration examples below are not the Codex setup path.

![AI agents](https://img.shields.io/badge/AI_agents-plugin-d97757) ![Agent Plugins](https://img.shields.io/badge/Agent_Plugins-1.0-24292e) ![version](https://img.shields.io/badge/version-1.1.0-007ec6) ![skills](https://img.shields.io/badge/skills-22-007ec6) ![ISO 27001](https://img.shields.io/badge/security-ISO_27001-2ea44f)

The official **[MyBusiness CRM](https://www.mybusiness.co.il)** plugin **for AI agents** — Claude Code, Codex, Claude Cowork, ChatGPT Work, Cursor, GitHub Copilot and the rest. MyBusiness is a Hebrew-first, Israeli business-management platform: CRM core (leads, accounts, sales, cases, tasks) plus the MyBooks (billing), MyCampaigns (marketing), MyChat (WhatsApp), MyCollege (courses) and TimeSheet modules.

The `mybusiness-implementor` plugin turns your AI agent into an **expert implementor of the system**: describe what you need in plain language — Hebrew or English — and the AI plans and executes it for real: entities and fields, card pages, tables and dashboards, reports, automations, permissions, data import, and website form integration.

## Who is this for

**Existing MyBusiness customers** — want to add a new entity, build a management dashboard, set up an automation, or wire a landing-page form? Instead of a customization project — a conversation. Describe the need, review the plan, approve. All on your existing system, through the official API.

**System builders — for your own business or for your clients** — entrepreneurs, implementors, and agencies who want to stand up a complete business system at AI speed, without compromising on information security, standards, or sound architecture.

## All the advantages of vibe coding. Without the drawbacks.

Today anyone can "spin up a system" with AI in a few days. Anyone who has done it also knows what comes next: a codebase nobody really knows, no one to support it a year from now, and information security left entirely to you.

Here the AI **does not write a system from scratch — it configures one on top of a proven business platform**:

| | Vibe coding from scratch | MyBusiness + an AI agent |
|---|---|---|
| **Time to launch** | Days | Days — in plain language |
| **Code maintenance** | A codebase born yesterday that nobody knows | No codebase to maintain — configuration on a managed platform |
| **Long-term support** | None | A living product: team, support, ongoing updates |
| **Information security** | Entirely on you | **ISO 27001** certified, built-in roles and permissions model |
| **Architecture** | Whatever the prompt produced | A proven product data model and infrastructure |

<p align="center"><a href="https://sub.mybusiness.co.il/landingreg/"><b>Open a new system — 14-day free trial</b></a></p>

## What's inside

- **The connection to your system, built in** — installing the plugin registers the official MyBusiness MCP server for you. No file to write: paste the Application Id and an API key you generate yourself, and you are connected.
- **No vendor lock-in** — the plugin is packaged twice in one folder: as a Claude Code plugin *and* as an [Agent Plugins 1.0](https://agent-plugins.org/specification) package, the open standard published 2026-08-06 by OpenAI with AWS, Cursor, GitHub, VS Code and Vercel. The same skills run in Codex, Cursor, GitHub Copilot, VS Code and Kiro.
- **A product knowledge base** (`myb-p-kb`) — product capabilities, data model, known limitations, and the implementation methodology. Ask "can MyBusiness do X?" and get an answer from documentation, not guesswork.
- **21 hands-on implementation skills** that plan and execute real configuration work on a live tenant through the official MyBusiness MCP server:

| Area | Skills |
|---|---|
| Getting connected | `myb-p-getting-started` (account, first login, Application Id + API key, verification, other clients) |
| Knowledge & analysis | `myb-p-kb` · `myb-p-fit-gap` (requirements fit-gap analysis) |
| Data model | `myb-p-create-entity` · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` |
| Pages & UI | `myb-p-page-builder` · `myb-p-page-tables` · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| Automation | `myb-p-trigger-setup` · `myb-p-form-rules` · `myb-p-sla-configuration` |
| Data & integrations | `myb-p-data-import` · `myb-p-web2lead-web2table` |
| Service quality | `myb-p-csat-survey` (post-case satisfaction survey) |
| Billing & quotes | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| Users & access | `myb-p-users-roles-permissions` |

Skills trigger in **both Hebrew and English**.

## Getting started

**1. Don't have a system yet?** Open a [trial account — 14 days free](https://sub.mybusiness.co.il/landingreg/).

**2. Generate the two connection values** — the only step that happens inside the CRM, and it takes a minute:

| Value | Where |
|---|---|
| **Application Id** | the arrow next to your user name → *Development environment* → **Databases** → your database → **Settings** → *Copy* |
| **API key (token)** | the same Settings screen → **API Keys** → *Add Key* → **Save** → copy the key |

📘 **[Full guide, with a screenshot of every click](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/03-connect-with-application-credentials.md)** — reaching the development environment, generating the token, and revoking it.

That key has full access to the database and bypasses every permission — treat it like a password, and press
**Revoke** on its row when it is no longer needed.

**3. Install the plugin in the agent you use.**

*Claude Code:*

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
/plugin configure mybusiness-implementor@mybusiness      →  paste both values
/reload-plugins
```

Here the key goes to your operating system's credential store, not to a file.

*An agent that implements Agent Plugins* (Codex, Cursor, GitHub Copilot, VS Code, Kiro): install the plugin
folder the way your agent installs plugins, open the `mcp.json` inside it, and replace the two placeholders
with the values you generated:

```json
"headers": {
  "X-Parse-Application-Id": "REPLACE_WITH_YOUR_APPLICATION_ID",
  "X-Parse-API-Key": "REPLACE_WITH_YOUR_API_KEY"
}
```

⚠️ The open standard has no secret storage, so there the key lives in a plain file on disk. Keep that folder
out of any repository and revoke the key when it is no longer needed —
[the full note](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/05-other-ai-clients.md).

*An agent that doesn't install plugins* (ChatGPT Work, Claude Cowork and similar): add the system directly as
an MCP connector to `https://mcp.mbapps.co.il/` with the same two headers, and work against your data. The
skills in this folder are readable as plain documents anywhere.

**4. Start a new session** and ask, for example: "Set up a supplier-management module with a list page and a dashboard." The skills load and trigger automatically. If anything is unclear, just say "connect me to my system" — the `myb-p-getting-started` skill walks you through it and proves the connection.

**Every guide, inside this repository:**
[account & first login](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/01-account-and-first-login.md) ·
[**get the Application Id and the token**](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/03-connect-with-application-credentials.md) ·
[verify & troubleshoot](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/04-verify-and-troubleshoot.md) ·
[other AI agents](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/05-other-ai-clients.md) ·
[signing in as a user instead](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/02-connect-with-user-login.md)

> The implementation skills write to the live tenant they are connected to. Run your first experiments on a demo or sandbox tenant, and review the plan the AI presents before approving writes on a production system.

## Security and standards

- MyBusiness is **ISO 27001** certified.
- Every action goes through the product's official API — with its built-in permissions model, roles, and audit trail. No scripts, no direct database access.
- The knowledge base inside the plugin is limited to the product's public documentation.

## What's in this repository

```
.claude-plugin/marketplace.json      the Claude Code marketplace manifest
plugins/mybusiness-implementor/
├── plugin.json                      Agent Plugins 1.0 manifest   ← other clients
├── mcp.json                         Agent Plugins MCP config     ← other clients
├── .claude-plugin/plugin.json       Claude Code manifest (+ its two configuration fields)
├── .mcp.json                        Claude Code MCP config
└── skills/                          22 skills, each a folder with SKILL.md + references/
```

**One folder, two packaging formats.** The same plugin is both a Claude Code plugin and an
[Agent Plugins 1.0](https://agent-plugins.org/specification) package — the open standard published on
2026-08-06 by OpenAI together with AWS, Cursor, GitHub, VS Code and Vercel — so ChatGPT/Codex, Cursor, GitHub
Copilot, VS Code and Kiro can install the very same folder. The skills are not duplicated; each client reads
the manifest it knows and ignores the other. In those clients the two connection values are pasted into
`mcp.json` instead of the plugin configuration —
[details and the security note](plugins/mybusiness-implementor/skills/myb-p-getting-started/references/05-other-ai-clients.md).

This repository is a generated release artifact — issues and feedback are welcome, but content changes land through the internal source repository and arrive here with the next release.

## Links and support

**MyBusiness CRM** · [www.mybusiness.co.il](https://www.mybusiness.co.il) · [Open a new system — 14-day free trial](https://sub.mybusiness.co.il/landingreg/) · [MCP server](https://www.mybusiness.co.il/mcp-server/) · [support@mybusiness-crm.com](mailto:support@mybusiness-crm.com)
