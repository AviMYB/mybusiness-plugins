# Acceptance pack — 11 tests

Run all of them before telling anyone the survey is done, and report `n/11` with the failures named. Tests 6–9 are **negative** — they assert that something does *not* happen. They are the ones that get skipped, and they are the ones that catch the builds that look finished and are not.

Prerequisites: a test contact whose email is an internal address, one or two test records attached to it, and the send trigger **off** except inside the controlled window of test 1.

| # | Test | Type |
|---|---|---|
| 1 | Closing in a qualifying status sends the mail | positive |
| 2 | The mail renders three links, zero literal placeholders | positive |
| 3 | Clicking a link records the rating on the business record | positive |
| 4 | The free-text comment lands too | positive |
| 5 | A negative rating produces the agreed response (task or notification) | positive |
| 6 | A **positive** rating produces **no** task/notification | **negative** |
| 7 | A **non-qualifying** closing status sends **nothing** | **negative** |
| 8 | Anonymous **read** of the intake table is rejected | **negative** |
| 9 | Anonymous **update** of an intake row is rejected | **negative** |
| 10 | Anonymous **write** to the business table is rejected | **negative** |
| 11 | The reports return the rated records | positive |

---

## 1 · Qualifying close sends the mail

Enable the send trigger for the window (all mail actions diverted — verify each one). Set the test record to a qualifying closing status. Expect exactly one row in `Emails` addressed to the internal address. Disable the trigger and confirm with `Get-Triggers`.

## 2 · Rendered links

From that `Emails` row: three distinct `href`s; no literal `{{{` anywhere in the body; each link carries a non-empty `c` and `p`; the `r` values are the distinct rating levels; the three faces differ by glyph. See `url-contract.md` §2–3.

## 3 · Rating lands on the record

Open one link in a logged-out browser. Expect: a new intake row, and `CsatRating`/`CsatAt` populated on the business record within seconds. Verify the value matches the face that was clicked — not just that *something* was written.

## 4 · Comment lands

On the thank-you screen, submit a comment. Expect a **second** intake row (correct — `web2table` cannot update) and `CsatComment` on the record. Two rows for one response is the designed behaviour.

## 5 · Negative rating produces the agreed response

Rate a second test record at the lowest level. Expect exactly the artefact agreed in Step 0 — a task for the process owner linked to the record and the customer, or a notification. Read its body: if it was supposed to contain the comment and is empty, you hit the ordering trap (SKILL.md Step 8) — the fix is to point at the record, not to embed the text.

## 6 · Positive rating produces nothing  ⚠ negative

Rate a third record at the top level. Expect **zero** new tasks/notifications. Count before and after; do not eyeball a list. A criteria mistake here means the process owner gets a queue item for every happy customer and stops reading the queue within a week.

## 7 · Non-qualifying closing status sends nothing  ⚠ negative

Re-enable the trigger for a second controlled window. Close a record in a closing status that was excluded in Step 0 — the "could not reach the customer" one is the sharpest test. Expect **no** new `Emails` row. Disable and verify.

## 8 · Anonymous read rejected  ⚠ negative

From an unauthenticated context, `GET /parse/classes/<intake table>` with only the application-id header. Expect a rejection, not rows. If rows come back, someone loosened the CLP during debugging — close it and re-run.

## 9 · Anonymous update rejected  ⚠ negative

Unauthenticated `PUT` on an existing intake row. Expect rejection. This is what stops a link-holder from editing someone else's answer.

## 10 · Anonymous write to the business table rejected  ⚠ negative

Unauthenticated `POST` to the business class. Expect rejection (CAPTCHA-gated, `code 119`). This is the assertion that the public page never got a back door into the record — the whole reason the staging table exists.

## 11 · Reports return the data

Run each report built in Step 9 (`reports.md`). For each: it returns rows, and the row count matches a `Count-Data` on the same condition — an empty table reads to a manager as "nobody is answering", which is how a working survey gets switched off.

Check specifically: every rated row carries a non-null owner and date (a null in either silently drops the row from the per-agent and trend cuts rather than erroring); R1's `exists` filter excludes unrated records; R5 sorts **oldest first**. If R6 was built, confirm `CsatSentAt` is stamped — it is set by a second action on the send trigger, so it is only proven by test 1's controlled window, and it **cannot be backfilled** if it was missed.

If any report was **scheduled**, it is not done until the process owner confirms they opened it in the report generator and pressed Save — a tool-side schedule never fires on its own. Report it as pending, not as delivered.

---

## Cleanup

List every artefact the test run created — test contact, test records, intake rows, any diverted trigger action left modified — and either remove it or hand the list to whoever can. Test rows left in the intake table distort the first month's average, which is exactly the month the customer looks at.
