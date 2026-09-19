# Environments, Access & Packages (Public Edition)

> **Purpose:** How a MyBusiness CRM app is accessed and licensed — what an implementer needs to connect and work.
> **Last updated:** 2026-06-10 · **Status:** draft (public tier)

## Your app

Every MyBusiness customer gets an isolated application: its own `applicationId`, master key, database, and subdomain. The same app is reachable through four surfaces:

| Surface | Endpoint | Use |
|---|---|---|
| Runtime UI (Hebrew, RTL) | `https://<subdomain>.mbapps.co.il/apps/<module>/<page>` | End users |
| Builder/admin | via `https://sub.mybusiness.co.il/login/` → סביבת פיתוח | Implementers (page editor, DB manager, triggers, security) |
| Parse REST API | `https://api.mbapps.co.il/parse/` | Integrations, scripts |
| MCP server | `https://mcp.mbapps.co.il/` | AI agents (60+ tools) |

## Credential convention for projects

Keep a per-app `.env` (never commit it):

```
X_PARSE_APPLICATION_ID=...   # the app id
X_PARSE_MASTER_KEY=...       # master key — server-side only, bypasses ALL permissions
MB_USER_EMAIL=...            # a working user for UI verification
MB_USER_PASSWORD=...         # policy: min 8 chars, 1 lower, 1 upper, 1 digit
```

Master-key calls carry no user identity — audit fields won't show a person. For UI-behavior testing, log in as the named user instead.

## Packages & seats

- Licensing is per **seat** (named staff users), per package tier; an app can mix package types.
- **Portal users consume no seat** — external registered users (customers/parents/students logging into portal pages) are unlimited by license. See [../30-customization/13-customer-portals.md](../30-customization/13-customer-portals.md).
- Seat assignment and user management: [../30-customization/08-users-roles-permissions.md](../30-customization/08-users-roles-permissions.md).

## Environments practice

- There is **no separate staging tier**: configuration is built in the customer app pre-go-live; risky experiments belong in a sandbox app first, then re-created cleanly (page/trigger configs do not merge between apps).
- Cloning a whole app onto another is possible as a vendor-side operation — ask MyBusiness support; note the clone **overwrites** the destination.

## Limitations & gotchas

- New users, roles, and tables start with **zero permissions** — assign roles/CLP explicitly after every creation.
- Email sending requires per-app/per-user SMTP setup before anything (triggers, calendar invites, campaigns) can send.
