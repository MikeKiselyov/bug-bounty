# bug/hunt

**Everything here is broken. On purpose.**

An open source playground for QA engineers. Every case is a small, realistic app with intentionally planted bugs:
a sign-up form, a cart, a data table, a file upload, a profile API. Explore it like you would at work,
mark a bug in two clicks and get it verified automatically. No accounts, no backend, no forms to fill.

**Play:** https://mikekiselyov.github.io/bug-bounty/

[![Deploy](https://github.com/MikeKiselyov/bug-bounty/actions/workflows/deploy.yml/badge.svg)](https://github.com/MikeKiselyov/bug-bounty/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-c8f542.svg)](LICENSE)

## Who it is for

- **Junior QA** - practise test design on something safer than production: boundaries, negative cases, copy, accessibility.
- **Experienced QA** - warm up on API and security bugs, keep your DevTools skills sharp.
- **Mentors and team leads** - give a case as a take-home task or use it in interviews. The catalog gives you the answer key.
- **Developers** - see your code through a tester's eyes.

## Cases

| Code    | Case               | Level  | Bugs | What you will practise                                             |
| ------- | ------------------ | ------ | ---- | ------------------------------------------------------------------ |
| CASE-01 | Sign-up form       | Junior | 14   | Field validation, boundaries, dates, copy, labels and focus        |
| CASE-02 | Cart and checkout  | Middle | 13   | Money and rounding, quantities, promo codes, state after actions   |
| CASE-03 | Table with filters | Middle | 13   | Search, sorting, pagination, empty states, HTML injection          |
| CASE-04 | File upload        | Senior | 15   | Types and sizes, limits, duplicates, file names as input, progress |
| CASE-05 | API: user profile  | Senior | 14   | DevTools: leaked fields, status codes, IDOR, mass assignment, cache |

Coming next: login and 2FA, search with autocomplete. [Want to build one?](CONTRIBUTING.md)

Every case has a short briefing with the requirements. A bug is anything that breaks them or common sense.

Keep the DevTools **Console** open in every case: some bugs never show up on the page, only as uncaught errors
or as data the app should not log. Mark them on the element you were using when they appeared.

Change the screen size too. Some layout bugs live only on a phone, a tablet, a wide monitor or a phone in landscape.
Resize the window or use the DevTools device toolbar. They count once the page was shown at that size.

- **CASE-04** needs a few files of your own: different formats and sizes, an upper-case extension, the same file twice.
- **CASE-05** runs its backend as a service worker, so requests are real and visible in the DevTools Network tab.
  Open DevTools before you start, the Console works for sending your own requests with `fetch()`.

## How to play

1. **Explore.** Open a case and test it the usual way: boundaries, empty fields, double clicks, keyboard only, DevTools.
2. **Mark.** Press **Mark a bug**, click the element where the bug lives and pick a category. That is the whole report.
3. **Get verified.** The mark is checked instantly against the case catalog. A found bug unlocks in the catalog with an explanation of why it is a bug.

A guided tour runs on the first visit and is always available under **How to play**.

### Categories

| Category      | Examples                                                    |
| ------------- | ----------------------------------------------------------- |
| Validation    | Accepts invalid input, rejects valid input, missing limits  |
| UI            | Broken layout, overflow, misalignment, distorted images     |
| Logic         | Wrong calculations, wrong state, wrong item affected        |
| Accessibility | Missing labels, no keyboard access, invisible to readers    |
| Security      | XSS, leaked data, access to other users' data               |
| Copy          | Typos, contradicting texts, misleading messages             |

### What counts as found

A mark counts when **element + category** match a bug in the catalog. Severity is optional and only used for feedback.

- **Static** bugs (typos, layout, accessibility) are visible as is. Noticing and marking them is enough.
- **Dynamic** bugs (logic, validation, security) count only **after you reproduced them**. Each one has a detector
  in the case code that fires when the bug actually shows up. Marking the right element without reproducing gives
  "Reproduce it first", so guessing or brute-forcing combinations does not work.

Possible results: **Found**, **Reproduce it first**, **Already found**, **Getting warm** (right element, wrong category)
and **Miss**.

### Extras

- Unlimited hints. Each one reveals a nudge towards the next bug you have not found yet.
- **Answers** reveals the whole catalog with explanations.
- **Reset** clears progress for one case and restarts the app.
- **Full report or keyboard only** - a classic report form with steps, for keyboard users and for practising write-ups.
- Progress is saved in your browser (`localStorage`). Nothing is sent anywhere.

Yes, the bugs are in the source code. Reading it first only cheats yourself.

## Run locally

Requires Node.js 20.19+ (22 recommended).

```bash
git clone https://github.com/MikeKiselyov/bug-bounty.git
cd bug-bounty
npm install
npm run dev      # http://localhost:5173
```

| Command         | What it does                                                         |
| --------------- | -------------------------------------------------------------------- |
| `npm run dev`   | Dev server with hot reload                                           |
| `npm test`      | Vitest: the matcher, catalog integrity, pinned planted bugs          |
| `npm run build` | Type check and production build into `dist/`                         |

## How it is built

Vite, React and TypeScript. No backend: hash routing and a relative base path, so `dist/` runs on any static host.

```
src/
  cases/
    <case-id>/
      index.ts          # case definition: briefing, level, elements
      bugs.json         # bug catalog: element, category, kind, hint, explanation
      <Name>App.tsx     # the app under test with planted bugs
    catalog.test.ts     # checks every catalog against the code
  components/           # pin mode, catalog, onboarding tour, report form
  lib/                  # matcher, progress storage, bug triggers, routing
  pages/                # home and case pages
public/
  mock-api-sw.js        # mock backend of CASE-05
```

- Elements of a case app are tagged with `data-bh="<element-id>"`. Pin mode finds the element under the cursor
  by that attribute, so marking never interacts with the app itself.
- Dynamic bugs call `trigger('<BUG-ID>')` from the case code at the moment they become observable.
- `catalog.test.ts` fails the build if a catalog and its app drift apart: a missing `data-bh`, a dynamic bug
  without a trigger, a planted bug without a `// BUG <ID>` comment, duplicated element + category pairs.

## Deploy

`.github/workflows/deploy.yml` tests, builds and publishes to GitHub Pages on every push to `main`.
`.github/workflows/ci.yml` runs tests and the build on every pull request.

To host your own copy: fork the repo, then **Settings → Pages → Build and deployment → Source: GitHub Actions**
and push to `main`. The base path is relative, so the repository name does not matter.

## Contributing

New cases, bug ideas and fixes of accidental bugs are welcome.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the case format and the rules for planted bugs.

Found a bug that is not in the catalog? [Open an issue](https://github.com/MikeKiselyov/bug-bounty/issues):
it is either a new bug for the catalog or a real one to fix.

## License

[MIT](LICENSE)

## Support

bug-bounty is free and open source. If it helped you practise or hire, you can buy me a coffee:

<a href="https://buymeacoffee.com/mike_kiselyov"><img src="https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black" alt="Buy me a coffee"></a>
