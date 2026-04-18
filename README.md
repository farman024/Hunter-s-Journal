# ⚔️ Hunter's Trading Journal

> *"Arise."* — From E-Rank to S-Rank. One trade at a time.

A Solo Leveling-themed PWA trading journal built for disciplined prop firm traders. Log trades, track sessions, monitor your rank progression, and export your full trading history — all offline, all on-device.

---

## Live

**GitHub Pages:** `https://farman024.github.io/hunters-journal`

---

## Features

### Multi-Account Support
Add unlimited trading accounts — Funding Pips, Cointracts, broker accounts. Each account is fully isolated with its own balance, trades, sessions, equity curve, and rank progression. Switch between accounts instantly.

### Rank System (E → S)
Your profit target progress maps directly to a Solo Leveling hunter rank. Hit 15% of target and you awaken to D-Rank. Cross 90% and you become an S-Rank hunter. The rank badge pulses gold when you reach the summit.

| Rank | Progress |
|------|----------|
| E | 0 – 15% |
| D | 15 – 30% |
| C | 30 – 50% |
| B | 50 – 70% |
| A | 70 – 90% |
| S | 90 – 100% |

### Trade Logging
- 60+ symbols across Forex, Metals, Indices, Crypto, and Commodities
- Direction, Outcome (TP / SL / BE / Manual), Pips, Gross P&L, Fee, Net P&L
- Running balance auto-calculated after every trade
- Edit and Delete any entry

### Session Journal
- Pre-session intent — write your plan before you trade
- Post-session reflection — what went right, what went wrong
- Emotion tag — Calm / Focused / Disciplined / FOMO / Revenge
- Rule breach logging

### Analytics
- Equity curve chart — visualise your balance journey
- Win/Loss streak tracker — dungeon-run style dots
- Rules compliance checklist — 8 core trading rules, tracked daily

### Export
- **Text** — clean logbook format, chronological, includes rules compliance
- **JSON** — full structured data with account summary, all sessions and trades
- **PDF** — print-ready dark-themed report with rank badge, progress bar, trade tables, and reflections

### PWA — Install on Any Device
- Android Chrome → install banner appears automatically
- iOS Safari → Share → Add to Home Screen
- macOS/Windows Chrome → install icon in address bar
- Full offline support via Service Worker

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Storage | localStorage (`hunterJournal_v2`) |
| Charts | Chart.js 4.4 (CDN) |
| Icons | Lucide SVG (inline) |
| Fonts | Cinzel · Share Tech Mono · Rajdhani |
| PWA | Service Worker + Web App Manifest |
| Deploy | GitHub Pages / Netlify |

Zero dependencies. Zero build step. Single HTML file + 4 support files.

---

## File Structure

```
hunters-journal/
├── index.html       ← Full app (single file)
├── sw.js            ← Service Worker (offline cache)
├── manifest.json    ← PWA manifest
├── icon-192.png     ← App icon (Igris Spartan helmet)
└── icon-512.png     ← App icon large
```

---

## Deploy

**GitHub Pages**
1. Push all 5 files to the root of your repo
2. Enable GitHub Pages from Settings → Pages → main branch / root
3. Visit the live URL in Chrome → install prompt appears

**Netlify**
1. Create a folder with all 5 files
2. Drag the folder into netlify.com/drop
3. Done — live in seconds

---

## Data & Privacy

All data is stored locally on your device using `localStorage`. Nothing is sent to any server. No analytics. No tracking. Your trades stay yours.

---

## Roadmap

- [ ] Supabase cross-device sync
- [ ] AI Trade Analyst (Claude API backend proxy)
- [ ] ForgeTrader integration
- [ ] Weekly/monthly performance summary view
- [ ] Screenshot-to-trade OCR logging

---

## Built By

**Farman J · AI Generalist**

[GitHub](https://github.com/farman024) · [Twitter](https://twitter.com/Farman__24__)

---

*Once a Hunter, Always a Hunter.*
