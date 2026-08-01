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

test('ricerca e filtri aggiornano il menu', async ({ page }) => {
  await page.goto('/menu.html');
  await page.getByLabel('Cerca nel menu').fill('margherita');
  await expect(page.locator('#menu-grid .menu-item:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Margherita' })).toBeVisible();
  await page.getByRole('button', { name: 'Azzera filtri' }).click();
  await page.getByRole('button', { name: 'Primi' }).click();
  await expect(page.locator('#menuCategoryCount')).toContainText('8 proposte');
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
