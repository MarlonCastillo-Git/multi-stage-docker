import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Iniciar sesión" };
export default function Login() {
  return (
    <section className="auth panel stack">
      <p className="eyebrow">BIENVENIDO DE NUEVO</p>
      <h1>Iniciar sesión</h1>
      <AuthForm mode="login" />
      <Link href="/registro">¿Primera visita? Crea tu cuenta</Link>
    </section>
  );
}
