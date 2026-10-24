# Contributing

## Found a bug that is not in the catalog?

Open an issue. It is either a real bug in the playground or a good candidate for the catalog.

## Adding a case

A case lives in `src/cases/<case-id>/` and has four parts:

```
src/cases/my-case/
  MyCaseApp.tsx   # the app under test, with planted bugs
  my-case.css     # its styles, every class prefixed to avoid leaks
  bugs.json       # the bug catalog
  index.ts        # CaseDefinition: metadata, briefing, element list, catalog, component
```

Then register it in `src/cases/index.ts`.

### 1. Elements: `data-bh`

Every element from `elements` in `index.ts` must be marked in the app with `data-bh="<element-id>"`.
This is what the "Mark a bug" mode highlights and clicks. Put `data-bh="other"` on the app root as a decoy.
Nested marks are fine: the innermost one wins.

### 2. Catalog: `bugs.json`

```json
{
  "id": "REG-04",
  "element": "password",
  "category": "validation",
  "severity": "major",
  "kind": "dynamic",
  "title": "A 3-character password passes validation",
  "hint": "Check the password length boundaries.",
  "explanation": "The check is length < 3, while the requirement is at least 8 characters."
}
```

- `category`: `validation`, `ui`, `logic`, `a11y`, `security`, `text`.
- `severity`: `trivial`, `minor`, `major`, `critical`.
- `kind`:
  - `static` - visible as is (typo, misalignment, missing aria-label). Marking it is enough.
  - `dynamic` - shows up only after an action. It counts only after its detector fired.
- `alternateElements` (optional) - other elements where the bug is visible, for example an empty table
  for a filter bug.
- **Every `element + category` pair must be unique within a case**, alternates included.
  If two bugs share a pair, split the element (for example `sort-salary` and `sort-date`).

### 3. Detectors: `trigger`

For every dynamic bug, call the trigger at the moment the bug becomes observable:

```tsx
import { useBugTrigger } from '../../lib/bugTrigger'

const trigger = useBugTrigger()

if (payload.password.length < 8) {
  trigger('REG-04')
}
```

`trigger` is stable and idempotent, so it is safe to call from `useEffect` on every render.

### Backend bugs: the mock API

If a case needs a real backend (bugs in requests, responses, status codes), use the pattern of
`src/cases/api`: the server lives in a service worker (`public/mock-api-sw.js`) and answers requests
under a case-specific prefix (`pulse-api/`), so they are visible in the DevTools Network tab.
The worker cannot call `trigger` directly: it posts a message to the page (`client.postMessage`),
and the case app calls `trigger('<ID>')` in response. Keep the `// BUG <ID>` comment in both places,
because the catalog test reads only `src/cases/<case-id>/`.

### Rules for planted bugs

- Every bug must be reproducible from the UI or DevTools. Write the reproduction in the PR.
- Mark each planted bug in the code with a `// BUG <ID>` comment so maintainers do not "fix" it.
- Everything else must work correctly. An accidental bug is a bug in the case, not a feature.
- Write a briefing with the requirements. A bug is a mismatch with requirements or common sense.
- Pin bugs that live in pure functions with a test (see `src/cases/cart/cartMath.test.ts`).
- User-facing text is in English. Use a plain hyphen, not an em dash.

### Before opening a PR

```bash
npm test
npm run build
```

`src/cases/catalog.test.ts` checks every case automatically: unique ids, valid elements, kinds, categories
and severities, unique `element + category` pairs, a `data-bh` mark for every element, a `trigger()` call
for every dynamic bug and a `// BUG <ID>` comment for every bug.
