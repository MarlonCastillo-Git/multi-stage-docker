"use client";
import Link from "next/link";
export default function ErrorPanel({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="panel stack" role="alert">
      <h1>No pudimos cargar esta sección</h1>
      <p>
        Comprueba que la API esté disponible e inténtalo de nuevo. Si estabas
        creando una orden, revisa primero el historial.
      </p>
      <button onClick={() => retry()}>Reintentar</button>
      <Link href="/pedidos">Consultar mis compras</Link>
      <Link href="/catalogo">Volver al catálogo</Link>
    </section>
  );
}
