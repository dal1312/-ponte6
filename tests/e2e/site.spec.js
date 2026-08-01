const { test, expect } = require('@playwright/test');

test('menu mobile gestisce stato e tastiera', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Scenario mobile');
  await page.goto('/index.html');
  const trigger = page.getByRole('button', { name: 'Apri menu' });
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
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

test('ordine crea ID, riepilogo e link WhatsApp', async ({ page, isMobile }) => {
  await page.goto('/ordina.html');
  await page.getByRole('button', { name: /Aggiungi Tartare/ }).click();
  await page.getByLabel('Nome e Cognome *').fill('Mario Rossi');
  await page.getByLabel('Telefono *').fill('+39 333 1234567');
  await page.getByLabel('Giorno *').fill(await page.locator('#orderDate').inputValue());
  const time = page.locator('#orderTime option:not([value=""])').first();
  test.skip(await time.count() === 0, 'Nessuna fascia disponibile oggi');
  await page.getByLabel('Orario *').selectOption(await time.getAttribute('value'));
  if (isMobile) await page.getByRole('button', { name: 'Apri carrello' }).click();
  await page.getByRole('button', { name: 'Rivedi ordine' }).click();
  await expect(page.getByRole('dialog', { name: 'Controlla prima di inviare' })).toBeVisible();
  await expect(page.locator('.receipt-meta strong')).toHaveText(/^AP-\d{8}-[A-Z0-9]{3,}$/);
  await expect(page.getByRole('link', { name: 'Apri WhatsApp' })).toHaveAttribute('href', /wa\.me\/39054329448\?text=/);
});

test('URL ordine legacy converge sulla pagina unica', async ({ page }) => {
  await page.goto('/ordina-rapido.html');
  await expect(page).toHaveURL(/ordina\.html$/);
});
