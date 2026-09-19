# Installing outside Claude Code

> **Codex 1.3.0:** Follow [the installed variant guide](../../../SETUP-CODEX.md). OAuth uses the bundled MCP and Authenticate; the App ID/token variant uses personal MCP settings. Older availability notes below are historical, not a current Codex support verdict.
## Codex

Follow [SETUP-CODEX.md](../../../SETUP-CODEX.md): install the skills plugin and add a personal Custom MCP in built-in Settings. Enter Application ID and API token in the Headers fields. The portable mcp.json deliberately contains no servers, so there is no uneditable plugin server and no duplicate connection. No custom setup program is required.

## Claude Code

The separate .claude-plugin/plugin.json and .mcp.json retain the existing Claude-specific configuration. Follow guide 3 for that host, not the Codex settings walkthrough.

## Other MCP hosts

Use the host's own connection settings: Streamable HTTP, https://mcp.mbapps.co.il/, X-Parse-Application-Id and X-Parse-API-Key. Credential storage depends on the host. Never edit a distributed plugin package to include real credentials. Portable skills remain under skills/.
