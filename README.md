# Hunter's Trading Journal

A Solo Leveling-themed trading journal for recording trades, sessions, goals, and account progress. This owner-private release uses Google sign-in and authenticated, owner-scoped cloud sync; it is not the earlier phone/synthetic test build.

## Release status

Production application: `https://farman024.github.io/Hunter-s-Journal/index.html`. The coordinated owner-private backend migration preserves the original current and backup versions, including both trading profiles, under the verified legacy owner's Auth UUID. The original legacy records remain restricted and unchanged. This repository supplies the matching authenticated client; publication and device acceptance are verified separately.

## Privacy and data behavior

- Google sign-in is required before the journal UI is opened. A verified session and successful owner-scoped cloud read are required; the app does not show a new empty journal after a failed read.
- Journal data is associated with the authenticated Supabase user UUID. Reads rely on row-level security; application writes use owner-only database functions. The browser uses the project's public **anon** key, never a service-role key. Server-side policies, functions, migration, and Auth configuration are separate release requirements and are not changed by this repository branch.
- The reserved legacy owner UUID is configured for the separately controlled migration. Other authenticated accounts are intended to receive separate private journals; legacy records must not be claimed or exposed to them.
- Saves preserve a separate rolling backup and detect revision conflicts instead of silently overwriting newer data. When sync fails, an unsynced recovery draft is kept in this tab's session storage and can be exported. Export before closing the tab after a failed save; unsynced recovery is not durable across tab closure.
- Browser storage and Auth tokens are not end-to-end encrypted. Database administrators with privileged access can read stored journal data. Old unscoped browser keys are not imported, rendered, or uploaded by this app.

## Features

- Multiple in-app trading profiles, trade and session logging, filters, analytics, and rank progression.
- JSON, CSV, text, and print/PDF export; CSV import.
- Owner-private authenticated sync with separate current and backup records.
- Installable PWA shell. The shell and allowlisted local assets are cached; Supabase/Auth, API, OAuth callback, and third-party CDN responses are not. Offline shell availability does not mean offline journal editing or fully offline third-party libraries.
- Context-aware safe rendering for journal text and restricted raster image handling.

## Runtime files

`index.html` contains the original app UI. `config.js` holds the enabled production endpoint, redirect URL, public anon key, and reserved legacy owner UUID. `app-auth.js`, `private-sync.js`, and `render-safe.js` implement the authentication gate, owner-scoped sync controller, and safe display helpers. `sw.js` is the v9-private scoped-cache worker. The original manifest, icons, and other repository assets are preserved.

## Release checks and remaining limits

The source implements client-side protections, but this is not a complete security certification. Production access requires the coordinated server-side rollout and verification of RLS/RPC ownership, legacy migration, Google provider settings and the exact redirect allowlist. Installed-PWA upgrade, real OAuth callback, offline behavior, real legacy-payload compatibility, and actual device acceptance remain distinct checks. The worker cannot remotely erase caches on devices that never receive its update. Third-party scripts/fonts are not pinned or cached; dependency hardening is outside this reviewed change.

The dependency-free JavaScript test suite and database checks are retained in the private release workspace, not published as app assets. Runtime syntax checks:

```sh
node --check app-auth.js
node --check private-sync.js
node --check render-safe.js
node --check sw.js
node --check config.js
```

Never place a service-role key in browser code.
