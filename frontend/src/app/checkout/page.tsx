import { requireUser } from "@/lib/api";
import { CartCheckout } from "@/components/cart";
export const metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};
export default async function Checkout() {
  const user = await requireUser();
  return (
    <section className="narrow stack">
      <p className="eyebrow">01 / TU COMPRA</p>
      <h1>Revisa tu carrito</h1>
      <p>Hola, {user.name}. Confirma tus productos antes de pagar.</p>
      <CartCheckout />
    </section>
  );
}
