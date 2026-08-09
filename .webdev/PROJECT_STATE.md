# Stato progetto — Al Ponte di Schiavonia

## Scopo
Sito statico/PWA del ristorante con presentazione, carta, ordine via WhatsApp, contatti e uso offline essenziale.

## Stack
- HTML, CSS e JavaScript senza build
- Dati menu generati in `js/menu-data.js`
- Service worker nativo
- Playwright per i test end-to-end

## Comandi
- Server locale: `npm run serve`
- Smoke check: `npm run smoke`
- Test browser: `npm run test:e2e`
- Aggiornamento menu: `py -3 tools/refresh_menu.py`

## Architettura
- `js/site-config.js`: configurazione del ristorante
- `js/site.js`: orari, contatti e misurazioni locali
- `js/core.js`: utility condivise
- `js/site-ui.js`: navigazione, animazioni e registrazione PWA
- `js/main.js`: carta, allergeni, foto, carrello e personalizzazione
- `js/order.js`: validazione e riepilogo dell’ordine
- `css/styles.css`: sistema visivo condiviso

## Decisioni
- I dati personali dell’ordine non vengono conservati in localStorage.
- Le immagini della carta sono servite in WebP; gli originali pesanti restano recuperabili dalla cronologia Git.
- JavaScript e CSS usano una strategia network-first nel service worker; navigazione con fallback offline.
- Il carrello compare soltanto nel flusso Ordina.
- L’invio WhatsApp è una richiesta da confermare dal ristorante, non un checkout con pagamento.

## Ultimo stato verificato
- Smoke check e sintassi JavaScript superati.
- Suite Playwright: 25 scenari superati, 1 scenario desktop escluso perché specifico del menu mobile.

## Prossimi passi
- Eseguire sempre smoke ed end-to-end dopo modifiche a rotte, asset, carrello o service worker.
- Aggiornare la versione cache quando cambia l’app shell.
- Non modificare manualmente gli output del menu generato.
