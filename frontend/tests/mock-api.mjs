import {createServer} from "node:http";
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

console.log("API simulada en 8099; sin persistencia ni cobros.");
