---
name: myb-p-getting-started
description: "Zero to connected: open a MyBusiness CRM trial, log in for the first time, and connect this plugin to YOUR system in either supported way — signing in with your CRM user (permission-aware) or application credentials (Application Id + API key from the builder environment). Proves the connection is live, says which database you reached, and diagnoses the usual failures ('Authorization header is required', 'invalid_token', no tools at all, 'Permission denied on get', wrong database, duplicate servers). Use whenever someone is new, unconnected or unsure: 'how do I connect', 'התחברות ראשונה', 'איך מחברים את המערכת', 'לא רואה כלים', 'איך פותחים חשבון', 'מאיפה מביאים API key', 'איך נותנים הרשאות MCP', 'the MCP is not connected', 'no MyBusiness tools', 'where do I get the application id', 'getting started', 'setup', 'connect Claude Code to my CRM'. Run it BEFORE any building skill when the connection has not been proven in this session — every other skill assumes a live, correctly-scoped connection."
---

# Getting started — from zero to a connected MyBusiness CRM

Everything in this plugin acts on **your own CRM through the official MCP server**. Nothing works until the
connection exists and points at the right database, so this skill is the first door: account → login →
connection → proof → first task.

Two audiences read this skill: a person following the pictures, and an AI agent executing the steps. Both
paths are the same steps — the references carry the screenshots.

## Knowledge sources

| Need | Read |
|---|---|
| What the MCP server is, its tools, and the two authentication modes | `../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` §0 (esp. §0.4 Authentication modes) |
| Environments (runtime CRM vs builder/admin) and access | `../myb-p-kb/references/00-overview/04-environments-and-access.md` |
| What the product is and which modules exist | `../myb-p-kb/references/00-overview/01-product-overview.md` |
| Roles, users, table permissions | `../myb-p-users-roles-permissions/SKILL.md` |

Step-by-step guides with screenshots live in this skill's `references/`:

1. `references/01-account-and-first-login.md` — open an account, first login, the two environments.
2. `references/02-connect-with-user-login.md` — the per-user sign-in mode (browser-hosted clients).
3. `references/03-connect-with-application-credentials.md` — **the main path**: Application Id + API key, with
   screenshots of every click from the CRM to the key.
4. `references/04-verify-and-troubleshoot.md` — prove the connection, read the failure messages.
5. `references/05-other-ai-clients.md` — installing outside Claude Code (Agent Plugins 1.0 packaging).

## Codex Desktop — choose the installed authentication variant

Read [SETUP-CODEX.md](../../SETUP-CODEX.md) from THIS installed plugin before giving instructions. The shared skills are identical, while that root guide identifies the authentication variant.

- **MyBusiness — OAuth / mybusiness-oauth:** MCP is bundled. Guide the user to Settings → Plugins → MCPs → MyBusiness → Authenticate, then the browser login/consent. Never ask for App ID or API token in this variant.
- **MyBusiness — App ID וטוקן / mybusiness-implementor:** follow the root guide for personal Custom MCP settings. Codex's bundled-server credential form remains unsupported. Never claim this variant auto-configures the personal connection.

Install only one variant. Never install or change local settings unless asked. If the user wants step-by-step instructions, give one step and wait. Never request credentials in chat, open a custom setup window, or install Python/Bitwarden. After authentication, open a new task and verify Usage-Guide, Get-Current-User and Get-Schema, then confirm the intended system. A tool list is not proof of authorization. Do not continue into the legacy Claude/API-key steps below when guiding Codex.

## Step 0 — Do you already have a MyBusiness system?

- **Yes** → go to Step 1.
- **No** → open a free 14-day trial at <https://sub.mybusiness.co.il/landingreg/>, then follow
  `references/01-account-and-first-login.md`. You cannot connect this plugin to anything until a database exists.

Never invent a database, subdomain or key for the user. If they don't know their system's address, have them
look at the URL they use to log in — it is `https://<subdomain>.mbapps.co.il/...`.

## Step 1 — Connect this plugin to the system

The plugin already carries the MCP server. Installing it registers one server, **`MyBusiness`**, which needs
two values you generate yourself in the CRM's development environment:

| | Where it comes from |
|---|---|
| **Application Id** | development environment → **Databases** → your database → **Settings** → *Copy* |
| **API key** | the same Settings screen → **API Keys** → *Add Key* → **Save** → copy |

Full walkthrough with screenshots — including how to reach the development environment (the arrow next to the
user name) — in `references/03-connect-with-application-credentials.md`. Then:

```
/plugin configure mybusiness-implementor@mybusiness      # paste both values
/reload-plugins                                          # MCP config is not picked up hot
```

**What that key is:** full access to that database — every table, every record, regardless of roles — with
actions recorded as `Master` rather than as a person. It is not a scoped credential; its advantage is that the
customer can **revoke it themselves**, per key, in one click. Say this plainly to anyone you walk through the
setup, and prefer a sandbox for first experiments.

### The other mode — signing in as a user

The server also supports a per-user sign-in (OAuth), where the connection acts as the signed-in CRM user and is
limited by that user's role plus their **MCP Permissions** tab. That is the better model when it is available,
and it is how browser-hosted AI clients connect. ⚠️ **It is not available in desktop/CLI clients such as Claude
Code** — their sign-in callback is a local address that the platform currently rejects (see
`../myb-p-kb/references/40-integrations-api/02-mcp-tools-catalog.md` §0.4). Details and the administrator's
side of it: `references/02-connect-with-user-login.md`.

## Step 2 — Connect

Short form of `references/03-connect-with-application-credentials.md`:

1. In the CRM, click the **arrow next to your user name** (top-left) → **סביבת פיתוח / Development environment**.
2. **Databases** → your database (**DB for MyBusiness**) → the **Settings** tab.
3. Copy the **Application Id**.
4. **API Keys** → **+ Add Key** → **Save** (this is what persists it) → reload → copy the key.
   The `Name` field is not saved — don't rely on it to tell keys apart.
5. `/plugin configure mybusiness-implementor@mybusiness`, paste both, then `/reload-plugins`.

**Not in Claude Code?** The same folder is also an [Agent Plugins 1.0](https://agent-plugins.org/specification)
package (`plugin.json` + `mcp.json` + `skills/`), for ChatGPT/Codex, Cursor, GitHub Copilot, VS Code and Kiro.
For Codex, use the built-in Custom MCP settings above. For another host, use its secure credential configuration; never place a real key inside the plugin package.

## Step 3 — Prove the connection (never skip)

`initialize` and the tool list succeed even without authentication, so "the server is green" proves nothing.
Only a real tool call does. In order:

1. `Usage-Guide` — the server's own instructions; the first call of any session.
2. `Get-Current-User` — mode A returns the signed-in user, mode B returns the pseudo-user `Master`. This is how
   you tell the two connections apart.
3. `Get-Schema` (no arguments) — the table list. Read back to the user 3–4 recognisable table or field names
   and ask them to confirm this is the right database *before* anything is written.

If any call fails, go to `references/04-verify-and-troubleshoot.md` — the message-to-cause table is there.

## Step 4 — First task

Say what the system contains (module + table counts from `Get-Schema` / `Count-Data`), then offer three
starting points and hand off to the skill that owns each:

| The user wants… | Skill |
|---|---|
| "Can it do X?" / a requirements review | `myb-p-kb`, then `myb-p-fit-gap` |
| A new module or entity end-to-end | `myb-p-create-entity` |
| A card page, a list, a dashboard, a report | `myb-p-page-builder`, `myb-p-page-tables`, `myb-p-dashboards`, `myb-p-create-update-reports` |
| Automation, alerts, deadlines | `myb-p-trigger-setup`, `myb-p-form-rules`, `myb-p-sla-configuration` |
| Import data, or a form on their website | `myb-p-data-import`, `myb-p-web2lead-web2table` |
| Users, roles, permissions | `myb-p-users-roles-permissions` |

Do the first change on a trial or sandbox database, and show the plan before writing to a live system. Several
tools replace whole objects rather than merging into them, so an unreviewed write can erase configuration that
was never mentioned in the request.

## Hard rules

1. **Never put an API key in a file that is shared or committed** — not in a repository, not in a project
   `.mcp.json` that is version-controlled, not in chat. The plugin configuration stores it in the OS credential
   store; that is where it belongs.
2. **Never ask a user for their account password.** Mode A takes them to the official login page; mode B needs
   no password at all.
3. **One connection = one database.** There is no cross-database tool. If the user works with several systems,
   they switch connections — verify with `Get-Current-User` + `Get-Schema` after every switch.
4. **Prove before you write.** A confirmed database identity is the only thing standing between a demo request
   and a change on a production system.

## Known limitations

- Sign-in (mode A) is not available yet in desktop/CLI clients whose OAuth callback is a local address; use
  mode B there until it opens.
- Per-user MCP permissions are granted per user, not per role — onboarding ten users means ten grants.
- This skill sets up and proves the connection; it does not diagnose the CRM itself. Table-level access errors
  (`Permission denied on get`) are a permissions question — `myb-p-users-roles-permissions`.
