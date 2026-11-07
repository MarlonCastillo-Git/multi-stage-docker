import Link from "next/link";
import { notFound } from "next/navigation";
import { api, requireUser, ApiError } from "@/lib/api";
import type { Order } from "@/lib/types";
import { money } from "@/lib/validation";
import { PaymentLoader } from "@/components/payment-loader";

export default async function CheckoutOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let order: Order;
  try {
    order = (await api<{ data: Order }>(`/orders/${id}`, { private: true }))
      .data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  return (
    <section className="narrow stack">
      <p className="eyebrow">02 / PAGO SEGURO</p>
      <h1>Orden #{order.id}</h1>
      {order.items.map((i) => (
        <div className="row" key={i.id}>
          <span>
            {i.quantity} × {i.product_name}
          </span>
          <strong>{money(i.subtotal, order.currency)}</strong>
        </div>
      ))}
      <p className="price">Total: {money(order.total, order.currency)}</p>
      {order.status === "pending" ? (
        <>
          <PaymentLoader id={order.id} />
        </>
      ) : (
        <Link href={`/confirmacion/${id}`}>Ver estado de la compra</Link>
      )}
      <Link href="/pedidos">Mis compras</Link>
    </section>
  );
}
