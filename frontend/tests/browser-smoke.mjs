import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.goto("http://localhost:3060/catalogo");
  await page.getByRole("heading", { name: "Explora el catálogo" }).waitFor();
  const count = await page.locator("article.card").count();
  assert(count > 0);
  await page.getByRole("link", { name: "Ver producto →" }).first().click();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Carrito (1)" }).waitFor();
  await page.getByRole("link", { name: "Carrito (1)" }).click();
  await page.waitForURL("**/login");
  await page.screenshot({ path: "reports/login.png", fullPage: true });
  await page.goto("http://localhost:3060/catalogo");
  await page.locator("article.card").first().waitFor();
  await page.screenshot({
    path: "reports/catalogo-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "reports/catalogo-mobile.png",
    fullPage: true,
  });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  console.log(
    `PASS: ${count} productos reales, detalle, carrito, protección y viewport móvil.`,
  );
} finally {
  await browser.close();
}
