import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./types";
export const SESSION = "ecommerce_session";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; private?: boolean } = {},
): Promise<T> {
  const token = options.private
    ? (await cookies()).get(SESSION)?.value
    : undefined;
  if (options.private && !token)
    throw new ApiError(401, "Inicia sesión para continuar.");
  let response: Response;
  try {
    response = await fetch(
      `${process.env.API_BASE_URL || "http://127.0.0.1:8000/api/v1"}${path}`,
      {
        method: options.method || "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(options.body !== undefined
          ? { body: JSON.stringify(options.body) }
          : {}),
      },
    );
  } catch {
    throw new ApiError(
      503,
      "No se pudo contactar con la tienda. Si estabas creando una orden, revisa tu historial antes de volver a intentarlo.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      response.status === 401
        ? "Tu sesión expiró. Inicia sesión nuevamente."
        : response.status === 422
          ? "Revisa los datos: algún producto puede no tener existencias."
          : response.status === 429
            ? "Demasiados intentos. Espera un minuto."
            : "No se pudo completar la operación.",
      response.status === 422 ? data?.errors : undefined,
    );
  if (!data)
    throw new ApiError(502, "La API devolvió una respuesta inesperada.");
  return data as T;
}
export async function requireUser(): Promise<User> {
  try {
    return (await api<{ data: User }>("/auth/me", { private: true })).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }
}
export function actionError(error: unknown) {
  return error instanceof ApiError
    ? { error: error.message, fields: error.fields }
    : { error: "No se pudo completar la operación. Inténtalo más tarde." };
}
