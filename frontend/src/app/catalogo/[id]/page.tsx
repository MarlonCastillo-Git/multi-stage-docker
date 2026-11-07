import { notFound } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { money } from "@/lib/validation";
import { AddToCart } from "@/components/cart";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  let product: Product;
  try {
    product = (await api<{ data: Product }>(`/products/${id}`)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  return (
    <>
      <Link href="/catalogo">← Catálogo</Link>
      <div className="detail">
        <div className="product-art art-1" aria-hidden="true">
          <span>{product.name.slice(0, 1)}</span>
        </div>
        <section className="stack">
          <p className="eyebrow">MARLON / SELECCIÓN</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <p className="price">{money(product.price)}</p>
          <p>{product.stock} unidades disponibles</p>
          <AddToCart product={product} />
          <Link href="/checkout">Ver carrito →</Link>
        </section>
      </div>
    </>
  );
}
