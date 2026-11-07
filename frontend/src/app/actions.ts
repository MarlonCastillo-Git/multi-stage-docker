"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, actionError, ApiError, SESSION } from "@/lib/api";
import { loginSchema, registerSchema, itemsSchema } from "@/lib/validation";
import type { Auth, ActionState, Order } from "@/lib/types";

export async function authenticate(
  mode: "login" | "register",
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (mode !== "register" && mode !== "login")
    return { error: "Operación inválida." };
  const parsed = (mode === "register" ? registerSchema : loginSchema).safeParse(
    Object.fromEntries(form),
  );
  if (!parsed.success)
    return {
      error: "Revisa los campos.",
      fields: parsed.error.flatten().fieldErrors,
    };
  try {
    const { data } = await api<Auth>(`/auth/${mode}`, {
      method: "POST",
      body: parsed.data,
    });
    (await cookies()).set(SESSION, data.access_token, {
      httpOnly: true,
      secure:
        new URL(process.env.APP_URL || "http://localhost:3060").protocol ===
        "https:",
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      return { error: "Correo o contraseña incorrectos." };
    return actionError(error);
  }
  revalidatePath("/", "layout");
  redirect("/checkout");
}
export async function logout() {
  try {
    await api("/auth/logout", { method: "POST", private: true });
  } catch {
    /* Always close the local session. */
  }
  (await cookies()).delete(SESSION);
  revalidatePath("/", "layout");
  redirect("/login");
}
export async function createOrder(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("items")));
  } catch {
    return { error: "Carrito inválido." };
  }
  const parsed = itemsSchema.safeParse(raw);
  if (!parsed.success)
    return { error: "Revisa las cantidades y productos del carrito." };
  let id: number;
  try {
    const { data } = await api<{ data: Order }>("/orders", {
      method: "POST",
      private: true,
      body: { items: parsed.data },
    });
    id = data.id;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/catalogo");
  revalidatePath("/pedidos");
  return { orderId: id };
}
export async function preparePayment(id: number): Promise<ActionState> {
  if (!Number.isSafeInteger(id) || id < 1) return { error: "Orden inválida." };
  try {
    const { data } = await api<{ data: { client_secret: string } }>(
      `/orders/${id}/payment-intent`,
      { method: "POST", private: true },
    );
    revalidatePath("/pedidos");
    revalidatePath(`/checkout/${id}`);
    return { clientSecret: data.client_secret, orderId: id };
  } catch (error) {
    return actionError(error);
  }
}
export async function refreshOrder(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) return;
  await api(`/orders/${id}`, { private: true });
  revalidatePath("/pedidos");
  revalidatePath(`/confirmacion/${id}`);
  revalidatePath("/catalogo");
}
