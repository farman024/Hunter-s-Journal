<p align="center">
  <img src="./logo.png" width="100" alt="Hunter's Journal emblem">
</p>

# Hunter's Journal

**Plan the trade. Record the result. Review the process.**

## Overview

A Solo Leveling-inspired trading journal that brings trade records, session reflections and daily discipline into one responsive web app. Google sign-in opens a private journal for each signed-in account, with multiple trading accounts inside it.

[Open Hunter's Journal](https://farman024.github.io/Hunter-s-Journal/index.html) · [Get started locally](#getting-started--development) · [Understand privacy](#privacy--security-model)

> **Offline shell, not offline journal access.** After a successful online cache installation, the public app shell can open without a connection. Authentication and private journal data still require the internet; the journal stays locked offline.

## Highlights

| Feature | What it offers |
| --- | --- |
| Private workspace | Google sign-in and a separate journal for each authenticated user. New users start empty, not with someone else's records. |
| Multiple trading accounts | Keep trades, sessions, targets and account progress organized within one journal. |
| Reflective journaling | Record trade details and notes, session intentions, emotions, rule compliance and post-session reflections. |
| Discipline and progress | Custom pre-hunt rituals, post-hunt reviews, analytics and profit-target-based E-to-S rank progression. |
| Responsive interface | A dedicated login screen, compact mobile account actions, a wider account selector and stacked discipline controls on small screens. Desktop keeps its own layout. |
| Import and export | CSV and MT5 trade imports; CSV, JSON and text exports; and a print view for printing or browser PDF output. Export formats are not all interchangeable backups. |

## Privacy & security model

Google sign-in is handled by Supabase Auth. Before showing the journal, the client verifies the signed-in user with the server and loads that user's cloud state. A failed read is not treated as permission to create or upload an empty replacement.

Access isolation depends on **server-side Row Level Security and owner-checking database functions**, not just hidden UI. The browser uses a public Supabase `anon` key; that key is not a user identity or a substitute for access policies. Privileged keys and Google client secrets must never be placed in client files. See [Supabase's API key guidance](https://supabase.com/docs/guides/api/api-keys).

This is account-restricted storage, **not end-to-end encryption**. Administrators with sufficient backend privileges can read stored data. Authentication sessions persist in browser storage; unsynced recovery drafts use tab-scoped session storage. Downloaded exports contain private information and need to be handled accordingly.

### Current, backup and recovery are different

**Current** is the working cloud journal. Successful updates preserve the preceding current state as a separate **rolling backup**. Restore backup swaps those versions after revision checks, so the former current state becomes the backup. This is one backup slot, not an unlimited version history.

**Recovery drafts** protect unsynced edits in the current tab. If a save fails or another revision exists, the app stops further writes rather than silently replacing newer cloud data. Use **Export draft** before discarding changes, signing out or closing the tab. A session-storage draft is not a durable offline backup, and its presence does not unlock the journal offline.

Regular account exports are readable reports of the selected trading account; they should not be mistaken for a complete, restorable journal snapshot.

## Getting started & development

To use the hosted app, open the link above while online and choose **Continue with Google**. Account actions include backup restore, recovery-draft export and sign-out; on mobile they are available through the profile control.

The frontend is plain HTML, CSS and JavaScript. Browser dependencies and fonts are checked into the repository; there is no package-install or frontend-build step.

```sh
git clone https://github.com/farman024/Hunter-s-Journal.git
cd Hunter-s-Journal
```

**Before opening a local copy, disable its shipped production configuration.** For a shell-only review, replace that copy's `config.js` with:

```js
window.HJ_CONFIG = Object.freeze({ enabled: false });
```

Then serve the folder over HTTP, rather than opening `index.html` as a file:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/index.html`. This disabled configuration shows the public shell with sign-in disabled; it is not a synthetic signed-in demo. Real sign-in and journal testing require a separately prepared development backend and redirect configuration.

Node.js can check the standalone runtime scripts without installing packages:

```sh
node --check config.js
node --check app-auth.js
node --check private-sync.js
node --check render-safe.js
node --check offline-shell.js
node --check sw.js
```

These are syntax checks, not a full regression or security test suite. The public repository does not include the private release-verification harness.

## Configuration & deployment

The existing site is served by GitHub Pages. The frontend can be served as static files, but a working private deployment also needs its matching Supabase backend. **This repository is not a turnkey database installer:** the server-side schema, ownership policies, migration safeguards and RPC provisioning are separate requirements.

The client expects a `journal_states` table with `current` and `backup` slots, plus the `save_journal_state` and `restore_journal_backup` functions. Their ownership checks, revision checks and grants must be configured before enabling cloud access. Do not use a production backend for experiments.

`config.js` supplies the runtime settings:

| Setting | Purpose |
| --- | --- |
| `enabled` | Enables cloud startup; leave false for a shell-only local review. |
| `supabaseUrl` | The prepared project's HTTPS endpoint. |
| `supabaseAnonKey` | The public browser key expected by this client. Never substitute a privileged server key. |
| `redirectTo` | The exact app return URL, on the same origin as the page and without a query string or fragment. |
| `legacyOwnerId` | Migration-safety setting required by the current client. Coordinate it with the prepared backend; it does not grant access. |

Enable Google's provider in the development project's Supabase Auth settings. Configure Google's authorized redirect URI with the **Supabase callback URL**, and Supabase's redirect allowlist with the **app return URL**. These are different destinations; follow the [official Google sign-in setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

For deployment, retain relative asset paths and publish the frontend files, including `vendor/`, font assets, icons, manifest and service worker, over HTTPS. Test redirects against the actual deployed path, including any repository subdirectory.

`sw.js` uses an integrity-pinned public-asset manifest and a versioned cache. Changing a cached file requires updating its integrity entry and the cache identity together. Failed precaching must not replace the working version. A README-only edit does not require a worker update because the README is not in that manifest.

### Runtime map

| File | Responsibility |
| --- | --- |
| `index.html` | Journal UI, forms, analytics and account interactions. |
| `app-auth.js` | Sign-in gate, authenticated startup and account actions. |
| `private-sync.js` | Owner-scoped reads, revision-aware writes, restore and recovery drafts. |
| `render-safe.js` | Context-aware rendering helpers. |
| `offline-shell.js` | Offline messaging and locked-shell startup. |
| `sw.js` / `manifest.json` | Public-shell caching and PWA metadata. |

## Limitations

Internet access is required to authenticate, open or edit the private journal. The service worker caches only allowlisted public UI assets—not Auth tokens, Supabase API responses or journal contents. Browser-stored sessions and recovery drafts are separate from that public cache.

A first visit needs a connection, and offline availability depends on a successfully installed cache. Installation options and standalone behavior vary by browser and device; a home-screen shortcut is not proof of a standalone PWA installation. Worker updates follow the browser's normal lifecycle and may wait for older app windows to close.

Imports depend on supported trade-file formats; XLS/XLSX spreadsheets are not accepted by the local MT5 parser. The rolling backup is not archival storage, sync conflicts need explicit reconciliation, and exports are not a promised round-trip restore format. This repository is a trading journal, not a broker connection or order-execution service. Its metrics and ranks are review aids, not investment advice or performance guarantees.

## Attribution

The visual theme draws inspiration from **Solo Leveling**; that reference does not imply affiliation or endorsement.

Bundled libraries include Supabase JS, Chart.js and html2canvas. Their license notices are in [`vendor/licenses/`](./vendor/licenses/). Cinzel, Rajdhani and Share Tech Mono font notices are in [`ui-assets/licenses/`](./ui-assets/licenses/). Preserve the applicable notices when redistributing those assets.

The repository currently has no top-level project license file. Third-party license notices do not, by themselves, establish a license for the application, branding or artwork.
