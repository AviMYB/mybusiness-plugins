[גרסה בעברית](README.md)

# MyBusiness CRM — Build and Extend a CRM with AI

## הרשאות / Access permissions

**API token: full access to the connected system. OAuth: the signed-in user’s permissions.**

בטוקן API יש גישה מלאה. ב-OAuth מנהל המערכת צריך להפעיל את סוגי הפעולות המותרים למשתמש ב-User Settings → MCP Permissions. כלים מתקדמים דורשים בקשת פתיחה מ-MyBusiness, ולאחריה תפקיד Admin וסימון Edit pages and schema. שלב הפתיחה הנוסף אינו נדרש בחיבור עם טוקן.

[הסבר מלא עם צילומי מסך](plugins/mybusiness-implementor/PERMISSIONS.md).

## שתי אפשרויות התקנה / Two installation choices

בחרו אפשרות אחת בלבד — הסקילים זהים:

| אפשרות | חיבור ב-Codex |
|---|---|
| **MyBusiness — OAuth** (`mybusiness-oauth`) | כולל MCP; התחברות בדפדפן באמצעות Authenticate. [מדריך](plugins/mybusiness-oauth/SETUP-CODEX.md) |
| **MyBusiness — App ID וטוקן** (`mybusiness-implementor`) | הזנת הפרטים ב-Custom MCP אישי; מגבלת הגדרת פרטים בשרת מתוך פלאגין עדיין קיימת. [מדריך](plugins/mybusiness-implementor/SETUP-CODEX.md) |

No third variant. Install only one. OAuth discovery was checked; live sign-in still requires the user. The section below describes the App ID/token option only.

## Codex Desktop — 1.3.0

התקינו את הפלאגין לקבלת הסקילים. לחיבור המערכת הוסיפו **Custom MCP** דרך ההגדרות המובנות של Codex: **Streamable HTTP**, כתובת `https://mcp.mbapps.co.il/`, ושתי שורות **Headers** בשם `X-Parse-Application-Id` ו-`X-Parse-API-Key`. את הפרטים האישיים מזינים בטופס של Codex בלבד. לאחר Save פתחו משימה חדשה.

The plugin supplies skills; configure the personal MCP separately in Codex Settings. No custom window, Python or external vault is required. [Exact setup / הוראות מלאות](plugins/mybusiness-implementor/SETUP-CODEX.md). Upgrade the marketplace and reinstall to migrate from 1.2.0; existing personal MCP connections remain independent of the plugin.

![AI agents](https://img.shields.io/badge/AI_agents-plugin-d97757) ![Agent Plugins](https://img.shields.io/badge/Agent_Plugins-1.0-24292e) ![version](https://img.shields.io/badge/version-1.4.0-007ec6) ![skills](https://img.shields.io/badge/skills-23-007ec6) ![ISO 27001](https://img.shields.io/badge/security-ISO_27001-2ea44f)

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

- **Your CRM connection:** in Codex, add a personal Custom MCP using built-in Settings. The plugin supplies skills and setup guidance. Claude retains its host-specific connection.
- **No vendor lock-in** — the plugin is packaged twice in one folder: as a Claude Code plugin *and* as an [Agent Plugins 1.0](https://agent-plugins.org/specification) package, the open standard published 2026-08-06 by OpenAI with AWS, Cursor, GitHub, VS Code and Vercel. The same skills run in Codex, Cursor, GitHub Copilot, VS Code and Kiro.
- **A product knowledge base** (`myb-p-kb`) — product capabilities, data model, known limitations, and the implementation methodology. Ask "can MyBusiness do X?" and get an answer from documentation, not guesswork.
- **Implementation and local-prototyping skills** that plan and execute real configuration work on a live tenant through the official MyBusiness MCP server:

| Area | Skills |
|---|---|
| Getting connected | `myb-p-getting-started` (account, first login, Application Id + API key, verification, other clients) |
| Knowledge & analysis | `myb-p-kb` · `myb-p-fit-gap` (requirements fit-gap analysis) |
| Data model | `myb-p-create-entity` · `myb-p-multi-select-field` · `myb-p-parent-child-fields` · `myb-p-timestamp-field` · `myb-p-rename-terms` |
| Local prototypes | `myb-p-mockup-templates` |
| Pages & UI | `myb-p-page-builder` · `myb-p-page-tables` · `myb-p-create-settings-page` · `myb-p-dashboards` · `myb-p-create-update-reports` |
| Automation | `myb-p-trigger-setup` · `myb-p-form-rules` · `myb-p-sla-configuration` |
| Data & integrations | `myb-p-data-import` · `myb-p-web2lead-web2table` |
| Service quality | `myb-p-csat-survey` (post-case satisfaction survey) |
| Billing & quotes | `myb-p-mybooks-setup` · `myb-p-price-quote-template` |
| Users & access | `myb-p-users-roles-permissions` |

Skills trigger in **both Hebrew and English**.


## Interactive local mockups

The `myb-p-mockup-templates` skill builds local, clickable prototypes with **12 interactive page patterns and 14 original visual references**. Lists, record forms, dashboards, boards, calendars, wizards, document editing, conversations, reports, import review, activity and help screens use invented data. Save, cancel, refresh and reset work in the browser; no CRM connection is required. Ask: "Build an interactive local mockup of this workflow."

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

**Codex and other hosts:** configure a personal MCP through the host settings. Do not put real credentials into plugin files. [Exact Codex instructions](plugins/mybusiness-implementor/SETUP-CODEX.md).

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
└── skills/                          23 skills, each a folder with SKILL.md + references/
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
