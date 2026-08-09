const { test, expect } = require('@playwright/test');

test('titoli principali conservano una frase accessibile', async ({ page }) => {
  const pages = [
    ['/index.html', 'Cucina romagnola e pizza dal 1978.'],
    ['/menu.html', 'Scegli il tuo posto a tavola.'],
    ['/ordina.html', 'Il tuo ordine, senza intermediari.'],
    ['/contatti.html', 'Trova il ponte, poi trova il tavolo.'],
    ['/privacy.html', 'Privacy, in modo semplice.'],
    ['/offline.html', 'La connessione si è fermata.']
  ];

  for (const [path, name] of pages) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  }

  await page.goto('/menu.html');
  await expect(page.locator('.menu-hero-note strong')).toHaveText("Dall'antipasto all'ultima fetta.");
});

test('font editoriali sono self-hosted e caricati', async ({ page }) => {
  const externalFontRequests = [];
  page.on('request', request => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) externalFontRequests.push(request.url());
  });

  await page.goto('/offline.html');
  await page.evaluate(() => document.fonts.ready);

  const fontResources = await page.evaluate(() => performance
    .getEntriesByType('resource')
    .map(entry => new URL(entry.name).pathname));

  expect(fontResources).toContain('/assets/fonts/dm-sans-latin.woff2');
  expect(fontResources).toContain('/assets/fonts/italiana-latin.woff2');
  expect(externalFontRequests).toEqual([]);
});

test('menu mobile gestisce stato e tastiera', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Scenario mobile');
  await page.goto('/index.html');
  const trigger = page.locator('.mobile-menu-btn');
  const mobileMenu = page.locator('#mobileMenu');
  await expect(trigger).toHaveAccessibleName('Apri menu');
  await expect(mobileMenu).toHaveCSS('box-shadow', 'none');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(trigger).toHaveAccessibleName('Chiudi menu');
  await expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
  await expect(mobileMenu).not.toHaveCSS('box-shadow', 'none');
  await expect(page.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Prenota su WhatsApp' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toHaveAccessibleName('Apri menu');
  await expect(mobileMenu).toHaveCSS('box-shadow', 'none');
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.locator('main').click({ position: { x: 8, y: 400 } });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  await trigger.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('body')).not.toHaveClass(/mobile-menu-open/);
});

test('filtri aggiornano il menu', async ({ page }) => {
  await page.goto('/menu.html');
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByLabel('Prezzo massimo')).toHaveCount(0);
  await expect(page.getByText('Solo piatti con foto')).toHaveCount(0);
  await page.getByLabel('Nascondi allergene').selectOption('latte');
  await expect(page.getByRole('heading', { name: 'Margherita' })).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Marinara' })).toBeVisible();
  await page.getByRole('button', { name: 'Primi' }).click();
  await expect(page.locator('#menuCategoryCount')).toHaveCount(0);
});

test('allergeni mostrano numero e provenienza', async ({ page }) => {
  await page.goto('/menu.html');
  const inferredDish = page.locator('.menu-item').filter({ has: page.getByRole('heading', { name: 'Aromatica' }) });
  await expect(inferredDish.locator('.allergen-inferred')).toHaveCount(2);
  await expect(inferredDish.locator('.allergens')).toContainText('1 Glutine');
  await expect(inferredDish.locator('.allergens')).toContainText('7 Latte');
  await expect(inferredDish.locator('.allergens')).toContainText('dedotto');

  const confirmedDish = page.locator('.menu-item').filter({ has: page.getByRole('heading', { name: 'Margherita' }) });
  await expect(confirmedDish.locator('.allergen-confirmed')).toHaveCount(2);
  await expect(confirmedDish.locator('.allergens')).toContainText('1 Glutine');
  await expect(confirmedDish.locator('.allergens')).toContainText('7 Latte');
});

test('carrello persiste e personalizza una pizza', async ({ page }) => {
  await page.goto('/ordina.html');
  await page.getByRole('button', { name: 'Pizze' }).click();
  const americana = page.locator('.order-item').filter({ hasText: 'Americana' });
  await expect(americana.locator('.order-pizza-ingredients')).toContainText('Fior di Latte, Pomodoro, Wurstel, Patate Fritte');
  await page.getByRole('button', { name: 'Personalizza Americana' }).click();
  await page.getByText('Mozzarella di Bufala DOP', { exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /Mozzarella di Bufala DOP/ })).toBeChecked();
  await page.getByPlaceholder(/senza cipolla/).fill('ben cotta');
  await page.getByRole('button', { name: /Aggiungi al Carrello/ }).click();
  await expect(page.locator('.cart-count')).toHaveText('1');
  await page.reload();
  await expect(page.locator('.cart-item-name')).toHaveText('Americana');
  await expect(page.locator('.cart-item-custom')).toContainText('ben cotta');
});

test('drawer carrello resta fuori schermo al breakpoint tablet', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/ordina.html');
  await expect(page.locator('#cart')).not.toHaveAttribute('aria-hidden', 'true');

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('#cart')).toHaveAttribute('aria-hidden', 'true');
  await expect.poll(async () => {
    const cartBox = await page.locator('#cart').boundingBox();
    return cartBox?.y ?? 0;
  }).toBeGreaterThanOrEqual(1024);

  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator('#cart')).not.toHaveAttribute('aria-hidden', 'true');
});

test('ordine crea ID, riepilogo e link WhatsApp', async ({ page, isMobile }) => {
  await page.goto('/ordina.html');
  await page.getByRole('button', { name: /Aggiungi Tartare/ }).click();
  await page.getByLabel('Nome e Cognome *').fill('Mario Rossi');
  await page.getByLabel('Telefono *').fill('+39 333 1234567');
  const availableDate = await page.evaluate(() => {
    for (let offset = 1; offset <= PONTE_CONFIG.ordering.maxAdvanceDays; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      if (!(PONTE_CONFIG.hours[date.getDay()] || []).length) continue;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  });
  expect(availableDate).not.toBe('');
  await page.getByLabel('Giorno *').fill(availableDate);
  const time = page.locator('#orderTime option:not([value=""])').first();
  await expect(time).toHaveCount(1);
  await page.getByLabel('Orario *').selectOption(await time.getAttribute('value'));
  if (isMobile) await page.getByRole('button', { name: 'Apri carrello' }).click();
  await page.getByRole('button', { name: 'Rivedi ordine' }).click();
  await expect(page.getByRole('dialog', { name: 'Controlla prima di inviare' })).toBeVisible();
  await expect(page.locator('.receipt-meta strong')).toHaveText(/^AP-\d{8}-[A-Z0-9]{3,}$/);
  await expect(page.getByRole('link', { name: 'Apri WhatsApp' })).toHaveAttribute('href', /wa\.me\/39054329448\?text=/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ponte-order-drafts'))).toBeNull();
});

test('contatti non mostra il carrello', async ({ page }) => {
  await page.goto('/contatti.html');
  await expect(page.getByRole('button', { name: 'Apri carrello' })).toHaveCount(0);
});

test('le vecchie bozze con dati personali vengono eliminate', async ({ page }) => {
  await page.goto('/ordina.html');
  await page.evaluate(() => localStorage.setItem('ponte-order-drafts', JSON.stringify([
    { customer: { name: 'Mario Rossi', phone: '3331234567' }, fulfillment: { address: 'Forlì' } }
  ])));
  await page.reload();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ponte-order-drafts'))).toBeNull();
});

test('route principali non hanno overflow, errori console o immagini rotte', async ({ page }) => {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/index.html', '/menu.html', '/ordina.html', '/contatti.html']) {
      await page.goto(path);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const brokenImages = await page.locator('img').evaluateAll(images => images
        .filter(image => image.getAttribute('src') && image.complete && image.naturalWidth === 0)
        .map(image => image.currentSrc || image.src));
      expect(brokenImages).toEqual([]);
    }
  }

  expect(errors).toEqual([]);
});

test('URL ordine legacy converge sulla pagina unica', async ({ page }) => {
  await page.goto('/ordina-rapido.html');
  await expect(page).toHaveURL(/ordina\.html$/);
});

test('privacy mostra una sola azione coerente con lo stato', async ({ page }) => {
  await page.goto('/privacy.html');
  const optOut = page.getByRole('button', { name: /Disattiva misurazioni locali/ });
  const optIn = page.getByRole('button', { name: /Riattiva misurazioni locali/ });

  await expect(page.getByRole('status')).toHaveText('Misurazioni locali attive.');
  await expect(optOut).toBeVisible();
  await expect(optIn).toBeHidden();

  await page.evaluate(() => localStorage.setItem(PONTE_CONFIG.analytics.storageKey, '[{"event":"test"}]'));
  await optOut.click();
  await expect(page.getByRole('status')).toHaveText('Misurazioni locali disattivate.');
  await expect(optOut).toBeHidden();
  await expect(optIn).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem(PONTE_CONFIG.analytics.storageKey))).toBeNull();

  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Misurazioni locali disattivate.');
  await optIn.click();
  await expect(page.getByRole('status')).toHaveText('Misurazioni locali riattivate.');
});
