# 4. Prove the connection, and read the failures

> **Codex Desktop 1.2.1:** use [SETUP-CODEX.md](../../../SETUP-CODEX.md) and the built-in Custom MCP form. Set Application ID and API token as the two Headers. No custom window, Python, Bitwarden or OAuth. Claude/manual examples below are not Codex setup instructions.

## 4.1 The three-call proof

A green server status is not proof. The server answers `initialize` and lists its tools **without any
authentication** — only a real tool call is authorised. Run these three, in order, at the start of any session
that will touch a system:

| # | Call | What a good answer looks like | What it proves |
|---|---|---|---|
| 1 | `Usage-Guide` | the server's own instruction text | the transport works and you are talking to the MyBusiness server |
| 2 | `Get-Current-User` | mode A: the signed-in user · mode B: `Master` (or `User name not found`) | auth works, and **which mode** you are in |
| 3 | `Get-Schema` (no arguments) | the table list of the database | you reached a real database — read 3–4 table names back to the user for confirmation |

Only after step 3 is confirmed should anything be written.

## 4.2 Message → cause → fix

> **The most important row first**: a *wrong* credential does not come back as an HTTP error. The call
> succeeds at the transport level and the **tool** answers with the failure. Only a *missing* credential
> produces `Authorization header is required`. So "the server is connected" and "HTTP 200" both prove nothing
> — read the tool's answer.

| What you see | What it means | Fix |
|---|---|---|
| `Authorization header is required` | the call arrived with **no** credentials at all — the configuration fields are empty, or the plugin was not reloaded after they were set | fill `Application Id` + key (`/plugin configure …`), then `/reload-plugins`; in mode A, complete *Authenticate* in `/mcp` |
| `Permission denied for action find on class …` on **every** table (`Usage-Guide` still works) | the credential is **wrong**: a typo, a revoked key, a key from a different database — or the right key under the **wrong header name**. The MCP server takes the key as `X-Parse-API-Key`; put it in `X-Parse-Master-Key` and it is treated as a wrong credential | re-copy the key from the Settings screen, check the header name, `/reload-plugins` |
| `Failed to get admin session with master key` from `Get-Current-User`, same as above | same cause — this is the same wrong-credential symptom seen from a different tool | as above |
| `invalid_token` | a sign-in token exists but is rejected — expired, revoked, or issued for a different system | `/mcp` → the server → re-authenticate |
| The sign-in browser tab ends on `403` | the client's local callback address is rejected before reaching the server (desktop/CLI clients) | use the Application Id + API key connection — `03-connect-with-application-credentials.md` |
| No MyBusiness tools are offered at all | the plugin's servers were not loaded — installed mid-session, or the config changed | `/reload-plugins`, or restart the client; confirm with `/mcp` that the servers are listed |
| `Permission denied` on **one** table only | connected fine, but that table's permissions exclude this user (mode A), or a newly created table starts with no permissions at all | grant access — `../../myb-p-users-roles-permissions/SKILL.md` |
| Everything works except one user's calls | that user has no MCP Permissions, or their role does not reach the table. MCP use also depends on the subscription plan | Settings → user settings → the user → MCP Permissions → apply |
| Tools answer, but from the wrong system | more than one connection is live, or the credentials belong to another database | keep exactly one MyBusiness server enabled in `/mcp`; re-run `Get-Schema` and confirm the tables |
| Two identical tool sets in the list | the plugin's server and a hand-registered one are both connected | toggle the unused one off in `/mcp` |
| `429` / rate-limit errors | too many calls too quickly | slow down, batch (`Create-Many` instead of many `Create-Data`), retry the tail |
| Empty results where data should exist | `Get-Data` returns **5 rows by default** — a truncated answer looks like a small table | always pass `limit` explicitly |

## 4.3 Which mode am I in?

`Get-Current-User` is the whole test:

- a real user object → the **sign-in** mode, permission-aware. What that user cannot do, the AI cannot do.
- `Master` / `User name not found` → the **Application Id + API key** mode, master level. Nothing is protecting
  the data but you.

Say which one you are in when you report the connection to the user — it changes what they should let you do.

## 4.4 Report it like this

> Connected to the database *<name/subdomain>* as *<user or `Master`>*. It has *<n>* tables, including
> *<3–4 recognisable names>*. Is that the right system?

Then offer the first task (see the routing table in `SKILL.md`, Step 4).
