import Link from "next/link";
export default function NotFound() {
  return (
    <section className="panel stack">
      <h1>No encontramos esta página</h1>
      <Link href="/catalogo">Volver al catálogo</Link>
    </section>
  );
}
