import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Crear cuenta" };
export default function Register() {
  return (
    <section className="auth panel stack">
      <h1>Crear cuenta</h1>
      <AuthForm mode="register" />
      <Link href="/login">Ya tengo una cuenta</Link>
    </section>
  );
}
