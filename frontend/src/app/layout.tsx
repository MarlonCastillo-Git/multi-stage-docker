import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { CartProvider, CartLink } from "@/components/cart";
import { Vitals } from "@/components/vitals";
import { logout } from "./actions";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Marlon · Tienda", template: "%s | Marlon" },
  description:
    "Tecnología y accesorios para tu día a día. Compra con pago seguro.",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logged = !!(await cookies()).get("ecommerce_session");
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <a className="skip" href="#contenido">
            Saltar al contenido
          </a>
          <header>
            <Link className="brand" href="/catalogo">
              MARLON<span> / STORE</span>
            </Link>
            <nav aria-label="Principal">
              <Link href="/catalogo">Catálogo</Link>
              <CartLink />
              <Link href="/pedidos">Mis compras</Link>
              {logged ? (
                <form action={logout}>
                  <button className="nav-button">Salir</button>
                </form>
              ) : (
                <Link href="/login">Ingresar</Link>
              )}
            </nav>
          </header>
          <main id="contenido">{children}</main>
          <footer>
            MARLON · Tecnología para lo cotidiano.{" "}
            <span>Pagos procesados por Stripe.</span>
          </footer>
          <Vitals />
        </CartProvider>
      </body>
    </html>
  );
}
