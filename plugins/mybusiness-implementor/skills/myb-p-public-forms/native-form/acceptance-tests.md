# Acceptance pack — native public form (12 tests)

Run all of them before calling the form done; report `n/12` and name the failures. Six are **negative** — they prove that something is refused. They are the ones that get skipped and the ones that catch a form that "works" because a permission was left open.

**Setup:** a private browser window (or an isolated browser context) that has never logged in to the tenant; `curl` with only the `X-Parse-Application-Id` header; MCP for read-backs. Use a test record / test invite whose contact details are internal.

| # | Test | Expect | Type |
|---|---|---|---|
| 1 | Open the link logged-out, fill every field, pass the CAPTCHA, Send | success text or redirect; **one** new intake row | positive |
| 2 | Read the row back (`Get-Data`, newest first) | every answer present, with its type: Number for scales, Date at 12:00 local, Pointer / array of pointers for dropdowns, Boolean for checkboxes; `createdBy = Public`; the link pointer (if any) set | positive |
| 3 | Compare the form's `name=` attributes (`Get-Page-Content`) with `Get-Schema(<Intake>)` | every name exists — an unknown name is dropped silently | positive |
| 4 | Every dropdown shows its options in the logged-out window | options listed — and the lookup holds nothing sensitive | positive |
| 5 | The staff screen / report on the intake table, as a staff user | rows visible, no permission error | positive |
| 6 | If prefill / one-click: open the link with the parameters | fields filled from the URL; one-click records with no click; reload does **not** add a row | positive |
| 7 | `POST /parse/classes/<Intake>` tokenless | `code 119` "…without a valid CAPTCHA" | **negative** |
| 8 | `GET /parse/classes/<Intake>` and `GET /parse/classes/<Intake>/<id from test 1>` tokenless | both refused ("Permission denied…") | **negative** |
| 9 | `PUT /parse/classes/<Intake>/<id>` tokenless | refused | **negative** |
| 10 | `POST` / `PUT` tokenless on the business table the answers project onto | refused | **negative** |
| 11 | If an invite gate: no `invite`, a wrong id, an expired invite | form hidden, "link expired" shown, nothing saved; `GET /parse/classes/<Invite>` (find) refused | **negative** |
| 12 | If follow-up triggers: a good answer and a bad answer | the bad one produces exactly the agreed task / notification / projection; the good one produces **none** (count before/after) | positive + **negative** |

## Notes

- Test 1 is the only one that needs a human for the CAPTCHA when Google shows a challenge; with the invisible widget it usually passes silently.
- `code 119` is also the code of a permission denial — in tests 8–11 read the message, not just the code.
- If test 7 **succeeds**, the tenant does not enforce the CAPTCHA gate — stop and report it; do not build on it.
- If test 9 succeeds, someone opened `update` — close it (`Set-Table-Permissions`, read back) and re-run.
- **Cleanup:** list every test row, test invite and test record you created and remove them or hand the list to someone who can (MCP has no delete). Test rows left in the intake distort the first report the customer reads.
