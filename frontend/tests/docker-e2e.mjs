import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
const base = process.env.FRONTEND_URL || 'http://localhost:3000';
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  headless: true,
});
try {
  const page = await browser.newPage();
  const email = `browser-${randomBytes(6).toString('hex')}@example.test`;
  const password = randomBytes(16).toString('hex');
  await page.goto(`${base}/registro`);
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba navegador');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByLabel('Confirmar contraseña').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/checkout');
  await page.goto(`${base}/catalogo`);
  await page.getByRole('link', { name: 'Ver producto →' }).first().click();
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await page.getByRole('link', { name: 'Carrito (1)' }).click();
  await page.getByRole('button', { name: 'Crear orden y continuar' }).click();
  await page.waitForURL(/\/checkout\/\d+$/);
  const id = Number(page.url().split('/').pop());
  assert(id > 0);
  await page.goto(`${base}/pedidos`);
  await page.getByRole('heading', { name: `Orden #${id}`, exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log(`PASS navegador: registro, catálogo, carrito, orden #${id}, historial y viewport móvil. No se realiza pago Stripe.`);
} finally {
  await browser.close();
}
