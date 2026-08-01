# Ponte Unified App

Sito statico/PWA unificato per **Al Ponte di Schiavonia**.

Il progetto combina:

- frontend statico derivato da `PONTE-quattro`;
- menu reale esportato da Dishcovery;
- pipeline di aggiornamento dati con `tools/refresh_menu.py`;
- app ordine via WhatsApp con carrello locale.

## Struttura

```text
.
├── index.html
├── menu.html
├── ordina.html
├── contatti.html
├── css/styles.css
├── js/site-config.js
├── js/site.js
├── js/main.js
├── js/order.js
├── js/menu-data.js
├── data/restaurant.json
├── data/beverages.json
├── data/menu.csv
├── assets/menu-images/
├── tools/refresh_menu.py
└── manifest.json
```

## Uso locale

```bash
py -3 -m http.server 8080
```

Apri:

```text
http://localhost:8080/
```

Smoke check e test browser:

```bash
npm run smoke
npm run test:e2e
```

Lo smoke check verifica pagine, script, stile, manifest e service worker. La suite Playwright copre i flussi principali su Chromium desktop e mobile. Al primo utilizzo installa il browser con `npx playwright install chromium`.

La configurazione operativa centralizzata (contatti, orari, consegna, disponibilita, extra pizza e analytics) si trova in `js/site-config.js`.

## Aggiornare il menu da Dishcovery

Setup:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Aggiornamento da API:

```bash
py -3 tools/refresh_menu.py
```

Aggiornamento dal JSON locale:

```bash
py -3 tools/refresh_menu.py --from-file
```

Output aggiornati:

- `data/restaurant.json`
- `data/menu.csv`
- `js/menu-data.js`
- `assets/menu-images/`

Bevande, birre e vini sono mantenuti in `data/beverages.json` e vengono uniti automaticamente al menu durante il refresh. Le immagini Dishcovery vengono convertite in WebP quando Pillow e' disponibile.

Per ottimizzare le fotografie della home:

```bash
py -3 tools/optimize_images.py
```

## Ordini e privacy

Il sito prepara un riepilogo con ID ordine e apre WhatsApp. L'ordine resta da confermare esplicitamente dal ristorante: su hosting statico non esiste conferma server-side. Un eventuale endpoint ordini puo' essere configurato in `js/site-config.js`.

Le metriche locali rispettano Do Not Track e non inviano dati finche' non viene configurato un endpoint. La pagina `privacy.html` permette di disattivarle o riattivarle.

## Deploy

La cartella e' statica: puo' essere pubblicata su GitHub Pages, Netlify, Vercel o qualsiasi hosting HTTP.
