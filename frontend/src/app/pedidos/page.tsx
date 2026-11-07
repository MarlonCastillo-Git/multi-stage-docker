import { Suspense } from "react";
import Link from "next/link";
import { api, requireUser } from "@/lib/api";
import type { Order, Page } from "@/lib/types";
import { money, pageNumber } from "@/lib/validation";
import Skeleton from "@/components/skeleton";
export const metadata = {
  title: "Mis compras",
  robots: { index: false, follow: false },
};
async function Orders({ page }: { page: number }) {
  const result = await api<Page<Order>>(`/orders?page=${page}`, {
    private: true,
  });
  return (
    <div className="stack">
      {result.data.map((o) => (
        <article className="panel row" key={o.id}>
          <div>
            <h2>Orden #{o.id}</h2>
            <p>
              {new Date(o.created_at).toLocaleDateString("es-SV")} ·{" "}
              {o.status === "paid"
                ? "Pagada"
                : o.status === "pending"
                  ? "Pendiente"
                  : "Cancelada"}
            </p>
            <strong>{money(o.total, o.currency)}</strong>
          </div>
          <Link
            href={
              o.status === "pending"
                ? `/checkout/${o.id}`
                : `/confirmacion/${o.id}`
            }
          >
            {o.status === "pending" ? "Continuar pago" : "Ver compra"} →
          </Link>
        </article>
      ))}
      {!result.data.length && (
        <p>
          Aún no tienes compras.{" "}
          <Link href="/catalogo">Explorar productos</Link>
        </p>
      )}
      <nav className="pagination" aria-label="Paginación">
        {page > 1 && <Link href={`/pedidos?page=${page - 1}`}>Anterior</Link>}
        <span>Página {page}</span>
        {page < result.meta.last_page && (
          <Link href={`/pedidos?page=${page + 1}`}>Siguiente</Link>
        )}
      </nav>
    </div>
  );
}
export default async function History({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUser();
  const page = pageNumber((await searchParams).page);
  return (
    <section className="stack">
      <h1>Mis compras</h1>
      <p>Consulta tus pedidos o retoma un pago pendiente.</p>
      <Suspense key={page} fallback={<Skeleton />}>
        <Orders page={page} />
      </Suspense>
    </section>
  );
}
