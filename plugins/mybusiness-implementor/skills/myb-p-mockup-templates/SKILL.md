---
name: myb-p-mockup-templates
description: "Build interactive local MyBusiness CRM prototypes and product mockups with reusable screen templates, synthetic data, navigation, working forms, filters and browser-local state. Use for feature previews, approval walkthroughs, clickable mockups, screen design and local demos: 'מוקאפ', 'מוקאפים', 'אב טיפוס', 'תשרטט מסך', 'דמו אינטראקטיבי', 'משהו שרץ מקומית', 'איך זה ייראה במערכת', 'interactive mockup', 'clickable prototype', 'local demo', 'preview this feature'. Prefer this for a local simulation; use myb-p-page-builder or myb-p-create-entity for actual CRM changes, and myb-p-dashboards for a live dashboard. Includes CRM and module visual references plus twelve interactive page patterns."
---

# MyBusiness interactive mockups

Make the proposed user journey usable locally: a reviewer should be able to navigate,
search, open a record, change a value, save it and see the consequence. A screenshot alone
is insufficient unless the user explicitly requests a static deliverable.

## Knowledge sources

- `../myb-p-kb/references/50-ui-walkthrough/03-mockup-visual-baseline.md` — visual baseline,
  provenance date, CRM/module shells and measured styles. Read before changing product chrome.
- `../myb-p-kb/references/50-ui-walkthrough/01-runtime-app-tour.md` — product screen context;
  read when choosing a module or checking whether a screen already exists.
- `references/template-catalog.md` — page selection, implemented interactions and original HTML references.
- `references/interaction-contract.md` — state, navigation, keyboard access, offline boundaries and QA.
- `assets/prototype/` — runnable starter with twelve screen patterns and a visual gallery.
- `scripts/scaffold.mjs`, `scripts/serve.mjs` — dependency-free project copying and loopback HTTP serving.

Running the local starter needs no account or CRM connection. Establishing visual fidelity
requires a reference: inspect the authorized current product screen when access is available.
Product facts come from the knowledge base and observed UI, not invented sample behavior.

## 1. Turn the brief into a small journey

Infer the module, persona, primary action and language from the request. Ask only if a
missing decision changes the experience materially. Default to Hebrew/RTL, synthetic data,
local persistence and the existing CRM shell.

Write down 3–5 observable acceptance steps before editing, for example:
search for a record → open it → change its status → save → see the new status in the list.
Pick the closest interactive pattern from the catalog. For a new module shell, use the
matching original HTML reference. Do not mix CRM and module chrome.

## 2. Compare the real screen before designing

When the user asks for a mockup that looks like the system or says it does not match,
inspect the authorized environment read-only before changing the mockup. Follow local
access documentation to find the intended demo account; never copy its details into the
skill or prototype. Do not change the live tenant to make the comparison.

Compare composition as well as color: header, menu, background, search grid, table density,
record-card placement, tabs, settings navigation, calendar grid and dashboard columns.
Confirm each destination's purpose: **Activities** is a business-activity list and card,
not a local audit feed. **Reports** starts with a saved-report chooser and results table;
configuration opens in a tabbed modal. Never put a generic concept behind a native menu
item. Inspect that exact destination and its primary action, even if the shell was verified.
Read `references/visual-fidelity-checklist.md`. Keep live screenshots as private task evidence;
only sanitized measurements and public branding belong in reusable assets.

The gallery is an external pattern chooser. It must not replace native CRM navigation.
Open the requested screen as the initial route for a feature review. Core layouts were
compared with the live product in September 2026; other patterns remain proposals.

## 3. Create a runnable project

Use an available Node.js runtime (18 or later). No package installation or build is needed.
Resolve `SKILL_DIR` to this installed skill's directory and `OUTPUT_DIR` to a new task output folder.
Pass paths as individual arguments; quote paths containing spaces.

```text
node "SKILL_DIR/scripts/scaffold.mjs" "OUTPUT_DIR" --template records
node "OUTPUT_DIR/serve.mjs" "OUTPUT_DIR" --port 4173
```

The scaffolder refuses to overwrite a non-empty folder and creates:

```text
index.html           app.css             app.js
data.js              catalog.js          config.js
pages/               reference-pages/    serve.mjs
package.json         README.md
```

Open the URL printed by the server. `--port 0` selects an available port; keep the printed
port stable when testing persistence. Stop with Ctrl+C or the process handle used to launch it.
If a background process is needed on Windows, start it hidden and record its process ID.
Serve only this generated folder, never a repository/workspace root. Do not use `file://`
for the module-based starter. If Node is unavailable, locate a bundled runtime; otherwise
explain that the preview was not run and offer the original static HTML as a limited fallback.

## 4. Adapt the prototype to the requested feature

- Edit `config.js` for the project title, initial page and unique storage namespace.
- Edit `data.js` for **invented** records, statuses, dates and labels. Use `example.com` for
  email samples, generic roles instead of real people, and explicit demo record identifiers.
- Edit the relevant `pages/*.js`, `app.js` and `app.css` for the journey. Preserve the shell,
  typography, component shapes and RTL logical spacing from the chosen visual reference.
- All primary controls must cause a visible result. Implement action → state change →
  confirmation → updated view; use validation before saves and show empty/error/loading states.
- Remove irrelevant example routes from `catalog.js` and the corresponding navigation.
  Keep every remaining link meaningful. A static reference is clearly labeled as such.
- Use the bundled current MyBusiness SVG wordmark in every header, including static references.
  Never substitute FontAwesome cubes, a letter or typed brand text. Reference pages share
  `assets/brand/`; the scaffolder includes those assets. On dark headers use the supplied
  white logo surface and keep the module name separate. See `references/asset-provenance.md`.
- Keep a persistent **"הדגמה מקומית · נתונים פיקטיביים"** label and a working reset action.
  Put scope notes in the handoff, not implementation jargon throughout the product UI.
- Separate **observed screen structure** from **proposed interaction**. A prototype behavior
  demonstrates a design idea; it does not establish a native CRM capability.
  Check the knowledge base before making any capability claim. For an unfamiliar existing
  screen, inspect an authorized environment read-only or mark the visual match unverified.

Browser storage is convenient for demos, not secure storage. Never insert actual customer
data, credentials, tenant IDs, private URLs, screenshots or exported conversations into
a reusable template. Local demo actions must not call CRM APIs or send messages.

## 5. Verify behavior and appearance

Run the real browser journey rather than checking only markup. Use the browser tool available
in the current environment. Read `references/interaction-contract.md` for the full checklist.

1. Open the printed HTTP URL and exercise every acceptance step, including invalid input.
2. Refresh and verify intended persistence; cancel an edit and verify that it did not save.
3. Reset only this project's state and verify restoration of the synthetic seed.
4. Exercise no-results, simulated error + retry, and keyboard navigation. Escape closes dialogs
   and restores focus; visible field labels and focus rings stay intact.
5. Inspect desktop (1440px) and mobile (390px). Wide tables may scroll inside their container;
   the whole page must not overflow. Inspect screenshots for layout defects.
6. Compare prototype and target screenshots at the same viewport. Use the visual checklist;
   matching navy colors alone is insufficient. Document remaining differences.
7. Check the console and requests. The interactive starter works offline after serving and
   makes no external requests. Original reference pages use optional font/icon CDNs.

Record actual results in the task output. Do not claim native CRM, channel delivery, secure
authentication, multi-user persistence or successful browser testing from local simulation.

## 6. Deliver and open

Leave the local preview available when the user is reviewing it. Provide the preview URL,
entry file, start/stop instructions, implemented interactions and any remaining simulation.
Open it in the available browser panel when possible. Keep a short handoff in `README.md`;
use `../myb-p-kb/assets/doc-template.html` for an accompanying review/report document.
The application itself uses the product shell rather than the report-document layout.

## Known limitations

- These are browser-local simulations with invented data; no CRM writes or real integrations.
- Core CRM geometry was compared with the live product on 2026-09-20. Module references
  remain historical; tenant configuration and later product changes require comparison.
- Activities and Reports have verified composition with a local subset of actions. Reports
  support two synthetic data sources, columns, labels, filters and sorting. Calculated fields,
  sharing, scheduling and advanced reports are outside the demo. Activity reminders and
  additional participants are stored form values only. The audit feed remains separate.
- Original HTML references remain static and may need responsive adaptation before reuse.
- Reset affects this prototype's storage key only. Private browsing or storage restrictions
  may prevent persistence; the app then reports that changes last for the current session.
- The starter supplies application mechanics, not exact fidelity for every module. Reuse the
  appropriate module reference and verify it when delivering a module-specific prototype.
