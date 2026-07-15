# MyBusiness CRM — Claude Code plugins

Implementation toolkit for [MyBusiness CRM](https://www.mybusiness.co.il), a Hebrew-first Israeli CRM built on the Simbla platform.

## Install

In Claude Code:

```
/plugin marketplace add AviMYB/mybusiness-plugins
/plugin install mybusiness-implementor@mybusiness
```

## What's inside

**`mybusiness-implementor`** — a product knowledge base plus no-code implementation skills:

- Custom entities & modules, card/form pages, list/table views
- Dashboards, reports & queries
- Triggers/automations, form rules
- Users, roles & permissions (CLP)
- Terminology localization, price-quote templates
- Data import & synthetic demo data
- `web2lead` / `web2table` external-form integration
- Multi-select & cascading fields, timestamp fields, settings pages
- SLA configuration for cases, MyBooks billing setup
- Fit-gap analysis
- The `myb-p-kb` product knowledge base (librarian)

Skills load automatically after install — Claude invokes them based on task context. No commands or hooks to configure.

## Updating

New versions ship as commits to this repository. Refresh your local copy with:

```
/plugin marketplace update
```

---

© MyBusiness CRM · support@mybusiness-crm.com
