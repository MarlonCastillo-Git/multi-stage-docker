import { Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Page, Product } from "@/lib/types";
import { money, pageNumber } from "@/lib/validation";
import Skeleton from "@/components/skeleton";
export const metadata = { title: "Catálogo" };
async function Products({ page }: { page: number }) {
  const result = await api<Page<Product>>(`/products?page=${page}`);
  return (
    <>
      <div className="grid">
        {result.data.map((p, i) => (
          <article className="card" key={p.id}>
            <div className={`product-art art-${i % 3}`} aria-hidden="true">
              <span>{p.name.slice(0, 1)}</span>
              <small>MARLON / {String(p.id).padStart(3, "0")}</small>
            </div>
            <div className="card-body">
              <p className="eyebrow">
                {p.stock > 0 ? "Disponible" : "Agotado"}
              </p>
              <h2>
                <Link href={`/catalogo/${p.id}`}>{p.name}</Link>
              </h2>
              <p className="clamp">{p.description}</p>
              <div className="row">
                <strong className="price">{money(p.price)}</strong>
                <Link className="text-link" href={`/catalogo/${p.id}`}>
                  Ver producto →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!result.data.length && <p>No hay productos disponibles.</p>}
      <nav className="pagination" aria-label="Paginación">
        {page > 1 && (
          <Link href={`/catalogo?page=${page - 1}`}>← Anterior</Link>
        )}
        <span>
          Página {page} de {result.meta.last_page}
        </span>
        {page < result.meta.last_page && (
          <Link href={`/catalogo?page=${page + 1}`}>Siguiente →</Link>
        )}
      </nav>
    </>
  );
}
export default async function Catalog({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = pageNumber((await searchParams).page);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">ESENCIALES BIEN ELEGIDOS</p>
        <h1>
          Tu mejor compra,
          <br />en tienda Marlon
        </h1>
        <p>Descubre tecnología y accesorios para acompañarte cada día.</p>
        <span className="badge">Compra segura · Precios en USD</span>
      </section>
      <section className="stack">
        <div className="row">
          <h2>Explora el catálogo</h2>
          <span className="muted">Selección MARLON</span>
        </div>
        <Suspense key={page} fallback={<Skeleton />}>
          <Products page={page} />
        </Suspense>
      </section>
    </>
  );
}
