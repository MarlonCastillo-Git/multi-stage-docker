import Link from "next/link";
import { notFound } from "next/navigation";
import { api, requireUser, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import { money } from "@/lib/validation";
import { refreshOrder } from "@/app/actions";
export const metadata = {
  title: "Estado de compra",
  robots: { index: false, follow: false },
};
export default async function Confirmation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let o: Order;
  try {
    o = (await api<{ data: Order }>(`/orders/${id}`, { private: true })).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  return (
    <section className="narrow panel stack">
      <p className="eyebrow">ORDEN #{o.id}</p>
      <h1>
        {o.status === "paid"
          ? "¡Gracias por tu compra!"
          : o.status === "cancelled"
            ? "Orden cancelada"
            : "Esperando confirmación del pago"}
      </h1>
      <p>
        {o.status === "paid"
          ? "Tu pago ha sido confirmado por la tienda."
          : o.status === "pending"
            ? "La confirmación de Stripe puede tardar unos segundos. Actualiza el estado antes de volver a pagar."
            : "Esta orden no se completó."}
      </p>
      <p className="price">{money(o.total, o.currency)}</p>
      {o.items.map((i) => (
        <p key={i.id}>
          {i.quantity} × {i.product_name}
        </p>
      ))}
      {o.status === "pending" && (
        <form action={refreshOrder.bind(null, o.id)}>
          <button>Actualizar estado</button>
        </form>
      )}
      <Link href="/pedidos">Ver mis compras</Link>
      <Link href="/catalogo">Seguir explorando</Link>
    </section>
  );
}
