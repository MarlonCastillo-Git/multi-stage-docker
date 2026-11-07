import { test } from "node:test";
import assert from "node:assert/strict";
import {
  itemsSchema,
  registerSchema,
  pageNumber,
} from "../src/lib/validation.ts";
test("carrito: impide vacío, cantidades inválidas y productos duplicados", () => {
  for (const input of [
    [],
    [{ product_id: 1, quantity: 0 }],
    [{ product_id: 1, quantity: 101 }],
    [
      { product_id: 1, quantity: 1 },
      { product_id: 1, quantity: 1 },
    ],
  ])
    assert.equal(itemsSchema.safeParse(input).success, false);
  assert.equal(
    itemsSchema.safeParse([{ product_id: 1, quantity: 2 }]).success,
    true,
  );
});
test("registro: requiere confirmación y correo válido", () => {
  const value = {
    name: "Prueba",
    email: "test@example.com",
    password: "Example123",
    password_confirmation: "Example123",
  };
  assert.equal(registerSchema.safeParse(value).success, true);
  assert.equal(
    registerSchema.safeParse({ ...value, password_confirmation: "different" })
      .success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ ...value, email: "invalid" }).success,
    false,
  );
});
test("paginación: normaliza parámetros no válidos", () => {
  assert.equal(pageNumber("-1"), 1);
  assert.equal(pageNumber("abc"), 1);
  assert.equal(pageNumber("2"), 2);
});
