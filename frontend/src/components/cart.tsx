"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useActionState,
  useRef,
  useSyncExternalStore,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions";
import type { Product } from "@/lib/types";
import { money } from "@/lib/validation";
type Line = { product: Product; quantity: number };
const CartContext = createContext<{
  lines: Line[];
  ready: boolean;
  add: (p: Product) => void;
  remove: (id: number) => void;
  clear: () => void;
} | null>(null);
const listeners = new Set<() => void>();
let memory = "[]";
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function snapshot() {
  try {
    return localStorage.getItem("ecommerce-cart") || memory;
  } catch {
    return memory;
  }
}
function write(lines: Line[]) {
  memory = JSON.stringify(lines);
  try {
    localStorage.setItem("ecommerce-cart", memory);
  } catch {}
  listeners.forEach((fn) => fn());
}
export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const lines = useMemo<Line[]>(() => {
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data)
        ? data
            .filter(
              (l) =>
                l?.product &&
                Number.isSafeInteger(l.product.id) &&
                typeof l.product.name === "string" &&
                Number.isFinite(Number(l.product.price)) &&
                Number.isSafeInteger(l.quantity) &&
                l.quantity > 0 &&
                l.quantity <= 100,
            )
            .slice(0, 50)
        : [];
    } catch {
      return [];
    }
  }, [raw]);
  function add(product: Product) {
    const line = lines.find((l) => l.product.id === product.id);
    if (line)
      write(
        lines.map((l) =>
          l === line
            ? {
                product,
                quantity: Math.min(l.quantity + 1, product.stock, 100),
              }
            : l,
        ),
      );
    else if (lines.length < 50) write([...lines, { product, quantity: 1 }]);
  }
  return (
    <CartContext.Provider
      value={{
        lines,
        ready,
        add,
        remove: (id) => write(lines.filter((l) => l.product.id !== id)),
        clear: () => write([]),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw Error("Falta CartProvider");
  return value;
}
export function CartLink() {
  const { lines } = useCart();
  return (
    <Link href="/checkout">
      Carrito ({lines.reduce((n, l) => n + l.quantity, 0)})
    </Link>
  );
}
export function AddToCart({ product }: { product: Product }) {
  const { add, ready } = useCart();
  const [message, setMessage] = useState("");
  return (
    <>
      <button
        disabled={!ready || product.stock < 1}
        onClick={() => {
          add(product);
          setMessage("Carrito actualizado");
        }}
      >
        {product.stock ? "Agregar al carrito" : "Agotado"}
      </button>
      <span role="status" className="small">
        {message}
      </span>
    </>
  );
}
export function CartCheckout() {
  const { lines, ready, remove } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(createOrder, {});
  const locked = useRef(false);
  useEffect(() => {
    if (state.orderId) {
      write([]);
      router.push(`/checkout/${state.orderId}`);
    }
  }, [state.orderId, router]);
  if (!ready) return <p>Cargando carrito…</p>;
  if (!lines.length)
    return (
      <div className="panel">
        <h2>Tu carrito está vacío</h2>
        <Link href="/catalogo">Explorar catálogo</Link>
      </div>
    );
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (locked.current) e.preventDefault();
        else locked.current = true;
      }}
      className="stack"
    >
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          lines.map((l) => ({
            product_id: l.product.id,
            quantity: l.quantity,
          })),
        )}
      />
      {lines.map((l) => (
        <div className="row panel" key={l.product.id}>
          <div>
            <strong>{l.product.name}</strong>
            <p>
              {l.quantity} × {money(l.product.price)}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            className="secondary"
            onClick={() => remove(l.product.id)}
          >
            Quitar
          </button>
        </div>
      ))}
      <p className="price">
        Total estimado:{" "}
        {money(
          lines.reduce((n, l) => n + Number(l.product.price) * l.quantity, 0),
        )}
      </p>
      <p>
        El servidor verificará existencias y calculará el total definitivo.
        Crear la orden reserva los productos.
      </p>
      <button disabled={pending || !!state.error}>
        {pending ? "Creando orden…" : "Crear orden y continuar"}
      </button>
      {state.error && (
        <div role="alert" className="error">
          <p>{state.error}</p>
          <p>
            {Object.values(state.fields || {})
              .flat()
              .join(" ")}
          </p>
          <Link href="/pedidos">Revisar mis órdenes antes de reintentar</Link>
          <button
            type="button"
            className="secondary"
            onClick={() => window.location.reload()}
          >
            Volver a cargar el carrito
          </button>
        </div>
      )}
    </form>
  );
}
