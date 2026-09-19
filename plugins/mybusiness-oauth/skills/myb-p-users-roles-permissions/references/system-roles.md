# System Roles Reference

The 10 default roles created with every MyBusiness CRM app, what they typically represent, and which tables they usually appear in.

Use this when mapping an employee's job title onto an existing system role. If none of the built-in roles fit cleanly, create a custom role rather than overloading one of these — system roles are referenced by many CLPs and their semantic meaning should stay stable across customers.

## The Default Ten

| Role name (as returned by Get-Roles) | Color | Typical audience | Tables it usually grants access to |
|---|---|---|---|
| Admin | red | Database/system administrators | Broad — appears in almost every table's CLP |
| CRM | purple | Generic CRM user | Accounts, Contacts, Sales, Cases, Tasks, Activities — the whole core CRM |
| Sales | azure | Sales reps | Accounts, Contacts, Sales, Tasks, Activities |
| Support | green | Support / service agents | Cases, Tasks, Activities, Accounts (usually read) |
| Lead Admin | red | Lead-management lead (supervisor role) | Leads, Sales pipeline, Accounts |
| Report Admin | orange | Reports & dashboards owner | Reports metadata, aggregate queries |
| MyBooks Admin | orange | Bookkeeping / finance | Invoices, Receipts, Retainers, Payments, Inventory (MyBooks module) |
| Campaign Manager | green | Marketing / campaigns | Campaigns, LandingPages, Segments (MyCampaigns module) |
| MyChatAdmin | red | Chat module admin | Conversations, Channels, Bots (MyChat module) |
| MyChatUser | azure | Chat agents | Conversations, own assignments (MyChat module) |

The actual tables vary between apps — the list above is the typical default. Always inspect real CLPs with `Get-Table-Permissions` rather than assuming.

## Choosing a role

Common customer job titles → which system role to use:

| Job title (Hebrew / English) | Usual role |
|---|---|
| מנהל מכירות / Sales manager | Sales + often also Lead Admin |
| נציג מכירות / Sales rep | Sales |
| נציג תמיכה / Support agent | Support |
| ראש צוות תמיכה / Support team lead | Support (add Admin if they manage configuration too) |
| מנהל כספים / Bookkeeper / רו"ח | MyBooks Admin |
| מנהל שיווק / Marketing manager | Campaign Manager |
| אנליסט / אנליסטית / Analyst | Report Admin |
| מנהל CRM / System administrator | CRM + Admin |
| מנהל לידים / Lead manager | Lead Admin |
| מוקד שיחה / Chat agent | MyChatUser |
| מנהל מוקד / Chat center lead | MyChatAdmin + MyChatUser |

Users often end up in multiple roles (e.g., a CRM admin is in both `CRM` and `Admin`). Their effective permissions are the **union** across all roles.

## When to create a custom role instead

Create a new role when:
- A group needs access to a **subset** of an existing role's tables (e.g., a "Finance Viewer" that can read MyBooks tables but not write).
- A group spans multiple system roles but needs its own CLP entry for clarity (e.g., a "Managers" role across departments that unlocks specific management reports).
- The customer has **industry-specific** groupings that do not map cleanly (e.g., "Loan Officers", "Case Workers").

Example custom roles used in the ongoing playground scenario:

| Custom role | Color | Used for |
|---|---|---|
| Managers | purple | Cross-department team leads (included in Sales, Support, MyBooks, Campaign, Lead, Chat managers) |
| Field Agents | green | Front-line reps (sales + support) who share a common narrow CLP |
| Finance | yellow | Read-only access to financial tables (Sales amounts, invoices) |

## Renaming — don't

System role **names** are the canonical keys referenced in every table's CLP (`role:Admin`, `role:Sales`). Renaming would orphan every CLP pointing to the old name. There is no MCP tool to rename a system role anyway — and that is by design.

If a customer insists on different labels, either:
- Rename through the terminology dictionary (UI-facing label only; underlying role name stays), or
- Create a parallel custom role with the desired name and migrate CLPs over time.
