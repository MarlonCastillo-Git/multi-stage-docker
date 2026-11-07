"use client";
import { useActionState } from "react";
import { authenticate } from "@/app/actions";
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState(
    authenticate.bind(null, mode),
    {},
  );
  const fields =
    mode === "register"
      ? ["name", "email", "password", "password_confirmation"]
      : ["email", "password"];
  const labels: Record<string, string> = {
    name: "Nombre",
    email: "Correo electrónico",
    password: "Contraseña",
    password_confirmation: "Confirmar contraseña",
  };
  return (
    <form action={action} className="stack">
      <fieldset disabled={pending} className="stack">
        {fields.map((name) => (
          <label key={name}>
            {labels[name]}
            <input
              name={name}
              required
              type={
                name.includes("password")
                  ? "password"
                  : name === "email"
                    ? "email"
                    : "text"
              }
              minLength={name.includes("password") ? 8 : undefined}
              maxLength={name === "email" ? 255 : name === "name" ? 120 : 128}
              autoComplete={
                name === "password"
                  ? mode === "login"
                    ? "current-password"
                    : "new-password"
                  : name === "password_confirmation"
                    ? "new-password"
                    : name
              }
              aria-invalid={!!state.fields?.[name]}
            />
            {state.fields?.[name] && (
              <span className="error">{state.fields[name].join(" ")}</span>
            )}
          </label>
        ))}
        <button>
          {pending
            ? "Procesando…"
            : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>
      </fieldset>
      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
    </form>
  );
}
