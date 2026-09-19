# 5. Installing in clients other than Claude Code

> **Codex Desktop 1.2.0 — follow this instead of the legacy instructions below:** read [SETUP-CODEX.md](../../../SETUP-CODEX.md), choose the plugin's setup starter and enter App ID/token in the local window. The portable mcp.json now runs a local bridge; it has no credential placeholders to replace. Requires Windows, Python/Tk and Bitwarden Secrets Manager. Do not edit the installed package or use Authenticate. The examples below describe the historical 1.1.0 remote package and other hosts, not current Codex installation.

This plugin ships in **two packaging formats at once, from one folder** — nothing is duplicated, the skills are
the same files:

```text
mybusiness-implementor/
├── plugin.json          ← Agent Plugins 1.0 manifest   (ChatGPT/Codex, Cursor, GitHub Copilot, VS Code, Kiro…)
├── mcp.json             ← Agent Plugins MCP config
├── .claude-plugin/
│   └── plugin.json      ← Claude Code manifest (+ its configuration fields)
├── .mcp.json            ← Claude Code MCP config
└── skills/              ← the skills themselves — shared by both
```

Each client reads only the files it knows and ignores the rest.

## 5.1 Claude Code

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
/plugin configure mybusiness-implementor@mybusiness     # Application Id + API key
/reload-plugins
```

Claude Code keeps the API key in the operating system's credential store, so nothing sensitive is written into
a file. Guide 3 has the walkthrough for obtaining the two values.

## 5.2 Agent Plugins clients

Any client that implements [Agent Plugins 1.0](https://agent-plugins.org/specification) — the open packaging
standard published 2026-08-06 — can consume the same folder. Install it the way your client installs a plugin
directory (clone the repository, or copy `plugins/mybusiness-implementor/` into the location your client reads),
then fill in your two values:

1. Open **`mcp.json`** in the plugin folder.
2. Replace `REPLACE_WITH_YOUR_APPLICATION_ID` and `REPLACE_WITH_YOUR_API_KEY` with the values from your CRM's
   Settings screen (guide 3).
3. Restart or reload the client.

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "MyBusiness": {
      "type": "streamable-http",
      "url": "https://mcp.mbapps.co.il/",
      "headers": {
        "X-Parse-Application-Id": "REPLACE_WITH_YOUR_APPLICATION_ID",
        "X-Parse-API-Key": "REPLACE_WITH_YOUR_API_KEY"
      }
    }
  }
}
```

> ⚠️ **Security note, and it is the reason Claude Code does it differently.** The Agent Plugins standard has no
> mechanism for user-supplied secrets: headers in `mcp.json` are, in the specification's own words, *visible
> package data, not secure*. Once you paste your key there it lives in a plain file on disk. So: keep that copy
> of the plugin outside any repository, do not commit it, and revoke the key (Settings → API Keys → Revoke)
> when the machine or the person no longer needs it. If your client offers its own secret storage or
> environment-variable substitution, prefer that over editing the file.

## 5.3 A client with no plugin support at all

Every client that speaks MCP can still use the connection — the plugin's value beyond the skills is one server
entry. Point it at `https://mcp.mbapps.co.il/` over streamable HTTP with the same two headers. The skills are
plain Markdown under `skills/` and can be read as documentation even where they cannot be auto-loaded.

## 5.4 Which format is right?

They are not competing here — the same folder is both. Use whichever your client implements; the skills, the
knowledge base and the connection are identical either way. The only real difference is where your API key ends
up: the OS credential store (Claude Code) or a file you maintain (Agent Plugins clients).
