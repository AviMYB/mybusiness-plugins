# Screenshots for the getting-started guides

Captured on clean demo tenants (2026-08-08 and 2026-08-13). Every credential, address and personal name in
them is overwritten in the image itself, not merely cropped.

| File | Guide | Shows |
|---|---|---|
| `01-signup-form.png` | 01 | the trial registration form |
| `02-crm-first-login.png` | 01 | the login screen |
| `03-crm-home.png` | 01 | the CRM home screen after signing in |
| `20-user-menu-dev-environment.png` | 01, 03 | the arrow next to the user name → *סביבת פיתוח* |
| `21-dev-environment-home.png` | 03 | the development environment |
| `22-databases-list.png` | 01, 03 | Databases → the database card |
| `23-db-tabs.png` | 03 | the database opened, with its tab strip |
| `24-settings-application-id.png` | 03 | the Settings tab: Application Id + Copy (value masked) |
| `25-add-key.png` | 03 | *Add Key* — a key is generated (value masked) |
| `26-key-saved.png` | 03 | after Save + reload: the key carries a Created Date, and the Name came back empty |
| `27-revoke.png` | 03 | revoking a key |
| `10a-settings-hub.png` | 02 | the CRM Settings hub, where the משתמשים card lives |
| `10-settings-user-settings.png` | 02 | the users list (emails masked) |
| `11-user-mcp-permissions-tab.png` | 02 | a user's MCP Permissions tab: Read / Create / Update + apply |
| `13-oauth-login-approve.png` | 02 | the access-approval screen of the sign-in mode (account masked) |

## Rules for these images

1. **Use a demo or trial database, never a customer's.** No customer name, no real contact, no real record may
   be visible — including in breadcrumbs, tab titles and the browser URL bar.
2. **Mask every credential and every identity.** Application Id, API keys, user names and e-mail addresses are
   overwritten. A published screenshot is published forever, and an Application Id plus a key is a working
   connection.
3. Hebrew screenshots are fine, as long as the element named in the text is the one highlighted in the picture.
4. Highlight the element the step talks about (a red rectangle is enough). Do not annotate with text inside the
   image; the text belongs in the guide, where it can be translated and corrected.
