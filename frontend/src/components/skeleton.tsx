export default function Skeleton() {
  return (
    <div role="status" aria-label="Cargando contenido" className="grid">
      {[1, 2, 3].map((n) => (
        <div key={n} className="panel skeleton">
          Cargando…
        </div>
      ))}
    </div>
  );
}
