import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const product = {
  id: 1,
  name: "Teclado de prueba",
  slug: "teclado",
  description: "Producto del entorno de pruebas",
  price: "25.00",
  stock: 10,
  is_active: true,
};
let orderCount = 0;
let status = "pending";
let failProducts = false;
const order = () => ({
  id: 1,
  status,
  currency: "USD",
  total: "25.00",
  created_at: "2026-10-15T12:00:00Z",
  items: [
    {
      id: 1,
      product_id: 1,
      product_name: product.name,
      unit_price: "25.00",
      quantity: 1,
      subtotal: "25.00",
    },
  ],
});
const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  const path = req.url;
  res.setHeader("Content-Type", "application/json");
  const send = (data, code = 200) => {
    res.statusCode = code;
    res.end(JSON.stringify(data));
  };
  if (path.startsWith("/api/v1/auth/") && req.method === "POST") {
    if (path.endsWith("logout")) return send({ message: "ok" });
    const value = JSON.parse(body || "{}");
    if (value.password !== "Example123")
      return send({ message: "Invalid" }, 401);
    return send({
      data: {
        user: { id: 1, name: "Prueba", email: "test@example.com" },
        access_token: "fixture-token",
        expires_in: 3600,
      },
    });
  }
  if (path.startsWith("/api/v1/products"))
    return failProducts
      ? send({ message: "Unavailable" }, 503)
      : send(
          path.includes("/products/")
            ? { data: product }
            : {
                data: [product],
                meta: { current_page: 1, last_page: 1, total: 1 },
              },
        );
  if (req.headers.authorization !== "Bearer fixture-token")
    return send({ message: "Unauthenticated" }, 401);
  if (path.endsWith("/auth/me"))
    return send({ data: { id: 1, name: "Prueba", email: "test@example.com" } });
  if (path.endsWith("/payment-intent"))
    return send({ message: "Stripe temporarily unavailable" }, 503);
  if (path === "/api/v1/orders" && req.method === "POST") {
    const value = JSON.parse(body);
    assert.deepEqual(value, { items: [{ product_id: 1, quantity: 1 }] });
    orderCount++;
    return send({ data: order() }, 201);
  }
  if (path.startsWith("/api/v1/orders/")) return send({ data: order() });
  if (path.startsWith("/api/v1/orders"))
    return send({
      data: orderCount ? [order()] : [],
      meta: { current_page: 1, last_page: 1, total: orderCount },
    });
  send({}, 404);
});
await new Promise((resolve) => server.listen(8099, "127.0.0.1", resolve));
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", "3061"],
  {
    env: {
      ...process.env,
      API_BASE_URL: "http://127.0.0.1:8099/api/v1",
      APP_URL: "http://localhost:3061",
    },
    stdio: "ignore",
  },
);
let browser;
try {
  for (let i = 0; i < 40; i++) {
    try {
      await fetch("http://localhost:3061/login");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("http://localhost:3061/pedidos");
  await page.waitForURL("**/login");
  await page.getByLabel("Correo electrónico").fill("test@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Incorrect123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Contraseña", { exact: true }).fill("Example123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/checkout");
  const cookie = (await context.cookies()).find(
    (c) => c.name === "ecommerce_session",
  );
  assert(cookie.httpOnly);
  assert.equal(cookie.sameSite, "Lax");
  assert(
    !(await page.evaluate(() => document.cookie)).includes("fixture-token"),
  );
  await page.goto("http://localhost:3061/catalogo/1");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("link", { name: "Carrito (1)" }).click();
  await page.getByRole("button", { name: "Crear orden y continuar" }).click();
  await page.waitForURL("**/checkout/1");
  assert.equal(orderCount, 1);
  await page.getByRole("link", { name: "Carrito (0)" }).waitFor();
  await page.getByRole("button", { name: "Preparar pago con Stripe" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(orderCount, 1);
  await page.goto(
    "http://localhost:3061/confirmacion/1?redirect_status=succeeded",
  );
  await page
    .getByRole("heading", { name: "Esperando confirmación del pago" })
    .waitFor();
  status = "paid";
  await page.getByRole("button", { name: "Actualizar estado" }).click();
  await page
    .getByRole("heading", { name: "¡Gracias por tu compra!" })
    .waitFor();
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await page.waitForURL("**/login");
  assert(
    !(await context.cookies()).find((c) => c.name === "ecommerce_session"),
  );
  await page.goto("http://localhost:3061/registro");
  await page.getByLabel("Nombre", { exact: true }).fill("Prueba");
  await page.getByLabel("Correo electrónico").fill("test@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("Example123");
  await page.getByLabel("Confirmar contraseña").fill("Example123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/checkout");
  failProducts = true;
  await page.goto("http://localhost:3061/catalogo");
  await page
    .getByRole("heading", { name: "No pudimos cargar esta sección" })
    .waitFor();
  failProducts = false;
  await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await page.getByRole("heading", { name: "Teclado de prueba" }).waitFor();
  console.log(
    "PASS: login, registro, cookie httpOnly, protección, orden única, carrito vaciado, error Stripe, confirmación verificada, logout, error y recuperación de catálogo. API simulada; sin cobros.",
  );
} finally {
  if (browser) await browser.close();
  next.kill();
  server.close();
}
