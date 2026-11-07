"use client";
import { useActionState, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { preparePayment } from "@/app/actions";
const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = key ? loadStripe(key) : null;
function PaymentForm({ id }: { id: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements || busy) return;
        setBusy(true);
        setError("");
        try {
          const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}/confirmacion/${id}`,
            },
          });
          if (result.error)
            setError(result.error.message || "No se pudo confirmar el pago.");
        } catch {
          setError(
            "No se pudo contactar a Stripe. Revisa el estado de tu orden antes de reintentar.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <PaymentElement />
      <button disabled={!stripe || !elements || busy}>
        {busy ? "Procesando pago…" : "Pagar de forma segura"}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
export default function Payment({ id }: { id: number }) {
  const [state, action, pending] = useActionState(
    preparePayment.bind(null, id),
    {},
  );
  if (!stripePromise)
    return (
      <p role="alert">
        Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para habilitar el pago. Tu
        orden está guardada en el historial.
      </p>
    );
  return state.clientSecret ? (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: state.clientSecret,
        locale: "es",
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentForm id={id} />
    </Elements>
  ) : (
    <form action={action} className="stack">
      <p>Los datos de tu tarjeta se introducen directamente en Stripe.</p>
      <button disabled={pending}>
        {pending ? "Preparando…" : "Preparar pago con Stripe"}
      </button>
      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}
    </form>
  );
}
