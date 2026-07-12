# ⚔️ Hunter's Trading Journal

> *"Arise."* — From E-Rank to S-Rank. One trade at a time.

A Solo Leveling-themed PWA trading journal built for disciplined prop firm traders. Log trades, track sessions, monitor your rank progression, import/export data, and sync across devices — all offline-first.

---

## Live

**GitHub Pages:** `https://farman024.github.io/hunters-journal`

---

## Features

### Multi-Account Support
Add unlimited trading accounts — each fully isolated with its own balance, trades, sessions, equity curve, and rank progression. Switch between accounts instantly. **Account Overview** shows all accounts side-by-side with XP, balance, hunts, and clear rate — highlights your strongest hunter and who needs training.

### Rank System (E → S)
Profit target progress maps to Solo Leveling hunter rank. Hit 15% and awaken to D-Rank. Cross 90% and become S-Rank. Animated rank-up notification with system popup.

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
- Risk/Reward Ratio auto-calculated
- Trade screenshots — upload from device, stored as base64, thumbnail in table, full-size lightbox viewer
- Running balance auto-calculated
- Edit/delete any entry

### Session Journal
- Pre-session intent, post-session reflection
- Emotion tagging (Calm / Focused / Disciplined / FOMO / Revenge)
- Per-day journal cards (click-to-expand), table view (daily P&L), and calendar view (monthly grid with navigation)

### Hunt Log Filters & Search
- Search field notes in real-time
- Filter by strategy (auto-populated from your trades)
- Date range filter (from/to)
- Clear all filters with one click

### Deep Analytics — Gate Analysis
- **Mana Drain** (max drawdown %)
- **Hunt Streak** / **Fallen Hunts** (max consecutive wins/losses)
- **Shadow Ratio** (profit factor)
- **XP by Gate** — P&L breakdown per symbol
- **XP by Day** — best/worst trading day of the week
- **Monthly Report** — P&L per month with clear rate

### Pre-Hunt / Post-Hunt Discipline
Custom checklist system. Add discipline items for pre-hunt ritual and post-hunt review. Check off items, track your discipline alongside your trades. Persisted per account.

### Hunter ID Card
Personalised hunter profile with avatar, hunter name, guild, rank badge, total XP, clear rate, and play style. Exportable as PNG.

### Inventory System
Collect and track items with rarity levels (Common → Legendary). Each item has stats (power, defense, speed, luck) and value.

### Cross-Device Sync (Supabase)
All data syncs to Supabase automatically. Save on one device, load on another. Sync indicator dot in the header shows status (syncing/synced/error/offline).

### Export
- **Text** — clean logbook with box-drawing format, rules compliance
- **JSON** — full structured data with account summary, trades, sessions
- **PDF** — print-ready dark-themed report with rank badge, equity progress, trade table, reflections
- **CSV** — clean comma-separated format for Excel/Google Sheets

### Import
- **CSV Import** — upload a CSV file with headers (symbol, direction, outcome, entry, lots, sl, tp, pips, gross, fee, net, rr, strategy, notes, sessionDate). Column auto-mapping.

### PWA — Install on Any Device
- Android Chrome → install banner
- iOS Safari → Share → Add to Home Screen
- macOS/Windows Chrome → install icon in address bar
- Full offline support via Service Worker

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Storage | localStorage + Supabase sync |
| Charts | Chart.js 4.4 (CDN) |
| Icons | Inline SVG (Lucide-style, terminal theme) |
| Fonts | Cinzel · Share Tech Mono · Rajdhani |
| PWA | Service Worker + Web App Manifest |
| Deploy | GitHub Pages / Netlify |

Zero build step. Single HTML file + support files.

---

## File Structure

```
hunters-journal/
├── index.html       ← Full app (single HTML + CSS + JS)
├── sw.js            ← Service Worker (offline cache)
├── manifest.json    ← PWA manifest
├── icon-192.png     ← App icon (Igris Spartan helmet)
├── icon-512.png     ← App icon large
└── README.md        ← This file
```

---

## Deploy

**GitHub Pages**
1. Push all files to your repo root
2. Settings → Pages → main branch / root
3. Done — install prompt appears on visit

**Netlify**
1. Drag the folder into netlify.com/drop
2. Live in seconds

---

## Data & Privacy

Primary storage is **localStorage** — nothing leaves your device unless you enable Supabase sync (optional, configured via keys in the source). No analytics, no tracking.

---

## Roadmap

- [ ] AI Trade Analyst (Claude API backend proxy)
- [ ] ForgeTrader integration
- [ ] Screenshot-to-trade OCR logging
- [ ] Strategy performance comparison (which strategy earns most XP)

---

## Built By

**Farman J · AI Generalist**

GitHub: farman024

---

*Once a Hunter, Always a Hunter.*
