import { z } from "zod";
export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});
export const registerSchema = loginSchema
  .extend({
    name: z.string().trim().min(2).max(120),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });
export const itemsSchema = z
  .array(
    z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().min(1).max(100),
    }),
  )
  .min(1)
  .max(50)
  .refine(
    (items) => new Set(items.map((i) => i.product_id)).size === items.length,
    "Productos repetidos",
  );
export function pageNumber(value: string | string[] | undefined) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 1;
}
export function money(value: string | number, currency = "USD") {
  return new Intl.NumberFormat("es-SV", { style: "currency", currency }).format(
    Number(value),
  );
}
