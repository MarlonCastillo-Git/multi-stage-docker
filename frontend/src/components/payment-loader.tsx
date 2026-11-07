"use client";
import dynamic from "next/dynamic";
export const PaymentLoader = dynamic(() => import("./payment"), {
  ssr: false,
  loading: () => <p>Cargando pago seguro…</p>,
});
