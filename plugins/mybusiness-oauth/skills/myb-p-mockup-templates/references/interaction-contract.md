# Interaction and handoff contract

## State and boundaries

- Use one consistent synthetic data model across routes. Record edits, board moves, dashboard
  counts and activity entries must agree. Keep unsaved form drafts separate from saved state.
- Store under one project-specific, versioned key. Never call `localStorage.clear()`; reset
  only the current project's key. Catch blocked/full storage and explain session-only operation.
- A successful save confirms the action and updates affected views. Cancel and Escape must
  leave saved state unchanged. A reset explicitly confirms replacement of demo edits.
- Provide a stable local HTTP address during a review; a different port has separate storage.
- External sends, payments, login, integrations and AI outputs must be visibly simulated.
  Do not connect the reusable prototype to production. Use another skill for a separately
  authorized implementation task.
- HTML-escape user-entered text; never interpolate it directly into markup. CSV export must
  neutralize spreadsheet formulas. Do not place identifiers or credentials in storage or URLs.

## User experience

- Real anchors for route navigation, real buttons for actions, visible labels for inputs.
- Tables may scroll inside a labeled content area on narrow screens; the document should fit.
- Dialogs have a heading, focus entry, keyboard dismissal and focus restoration. Native
  `dialog.showModal()` supplies focus containment; verify the result in the target browser.
- Keep per-thread message drafts separate. A local message action never claims delivery.
- Provide alternatives to drag-and-drop. Keyboard users can change a board stage with a select.
- Include an empty state, validation failure and retryable error in the core journey. If an
  async operation is simulated, show and test its loading state rather than leaving a dead control.
- Button labels should describe the user's action. Implementation notes belong in the handoff.

## Acceptance checklist

| Area | Minimum observable check |
|---|---|
| Navigation | Every retained route opens; back/forward works; current item is indicated |
| Search/filter | Matching rows narrow; zero matches have clear feedback; reset restores rows |
| Forms | Required/invalid input blocks submission; corrected values save; cancel discards |
| Persistence | Saved state survives refresh; reset restores seed and leaves other keys intact |
| Cross-screen data | Status change appears in list, board, KPI counts and activity feed |
| Dialog | Tab remains inside, Escape closes, focus returns to the trigger |
| Responsive | Desktop 1440px and mobile 390px screenshots inspected; no page overflow |
| Safety | No external requests in interactive journey; no customer data or credentials |
| Errors | No unexpected console errors; storage restriction and error/retry paths usable |
| Handoff | Preview URL, entry file, how to start/stop, behavior tested, simulation limits |

## Public-package audit

Inventory every shipped file, including HTML comments, fixtures, scripts, screenshots,
source maps and archives. Prefer text-only synthetic fixtures; do not bundle captures from
a customer's system. Scan for secrets, emails, phones, tenant/record IDs, private hosts,
absolute workstation paths, internal tickets and client names; inspect suspected matches
without printing secret values. Run the repository's public leak gate if available and
review the actual distribution, not just SKILL.md. Automated scans complement manual review.

Keep task-specific audit evidence outside the public skill package. Public templates may
contain only generic product mechanics, procedural guidance and invented examples.
