# AGENTS.md

## Project Snapshot
- Static/PWA restaurant site for **Al Ponte di Schiavonia**; no build step is required for normal HTML/CSS/JS changes.
- Main pages: `index.html`, `menu.html`, `ordina.html`, `ordina-rapido.html`, `contatti.html`, `offline.html`.
- Shared styling lives in `css/styles.css`; shared behavior/cart/order/menu rendering lives in `js/main.js`.
- Menu data is generated into `js/menu-data.js` and `data/menu.csv`; do not hand-edit generated menu output unless the task explicitly asks for a one-off patch.

## Commands
- Local server on Windows: `py -3 -m http.server 8080`.
- Smoke check: `npm run smoke`.
- Direct smoke script: `py -3 scripts/smoke_check.py`.
- Refresh menu from Dishcovery API: `py -3 tools/refresh_menu.py`.
- Refresh menu from saved JSON: `py -3 tools/refresh_menu.py --from-file`.
- Skip image downloads while refreshing: `py -3 tools/refresh_menu.py --no-images`.

## Verification
- Run `npm run smoke` after edits that affect HTML routes, script loading, service worker app shell, or file paths.
- `scripts/smoke_check.py` starts a temporary local HTTP server on a dynamic port and checks the six main pages for HTTP 200.
- There is no configured lint/typecheck/test suite beyond the smoke script.

## PWA Gotchas
- `service-worker.js` pre-caches the app shell; when adding/removing core pages, CSS/JS, or important shell assets, update `APP_SHELL`.
- Bump `CACHE_NAME` in `service-worker.js` when cached assets change, otherwise users may see stale UI.
- Keep `offline.html` lightweight and self-contained through shared `css/styles.css` assets already in the app shell.

## Menu Pipeline
- `tools/refresh_menu.py` uses Dishcovery API hash `f6c9502ec497bb4731cf5a256bf52d0c` by default.
- Refresh output touches `data/restaurant.json`, `data/menu.csv`, `js/menu-data.js`, and possibly `assets/menu-images/`.
- `js/main.js` expects category keys such as `antipasti`, `primi`, `pizze`, `secondi`, `contorni`, `dessert`, `bevande`, `birre`, `vini_bianchi`, `vini_rossi`.

## Visual Direction
- For graphic/UI tasks, operate as `deserto`: senior immersive graphic designer, direct Italian with useful English design terms, visually specific and implementation-oriented.
- The user wants to see changes, not abstract option lists; prefer creating a branch/prototype and making visible CSS/HTML changes before asking for taste decisions.
- Design feedback should cover composition, hierarchy, palette HEX values, typography, spacing, responsive behavior, micro-interactions, and concrete tool/workflow suggestions when relevant.
- Avoid generic safe layouts; push a modern, premium restaurant identity while preserving usability and WCAG-conscious contrast.

## Current Workflow Notes
- Work on a separate branch for visual experiments; `redesign-ui-visual` already exists and tracks `origin/redesign-ui-visual`.
- Preserve the unified navbar logo pattern: `assets/home/logo.png` plus `Al Ponte di Schiavonia` / `Trattoria e Pizzeria` text.
- Keep inline styles out of HTML; use classes in `css/styles.css`.
- After committing visual changes, push only when the user asks to update the repository.
