<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class PaymentController extends Controller
{
    public function store(Order $order, StripePaymentService $payments): JsonResponse
    {
        abort_unless($order->user_id === auth('api')->id(), 404);
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'La orden ya fue procesada.'], 409);
        }
        $intent = $payments->createIntent($order);

        return response()->json(['data' => ['order' => new OrderResource($order->fresh(['items', 'payment'])), 'payment_intent_id' => $intent->id, 'client_secret' => $intent->client_secret, 'status' => $intent->status]]);
    }

    public function webhook(Request $request): JsonResponse
    {
        try {
            $event = Webhook::constructEvent($request->getContent(), (string) $request->header('Stripe-Signature'), (string) config('services.stripe.webhook_secret'));
        } catch (UnexpectedValueException|SignatureVerificationException) {
            return response()->json(['message' => 'Firma de webhook inválida.'], 400);
        }

        if (in_array($event->type, ['payment_intent.succeeded', 'payment_intent.payment_failed', 'payment_intent.canceled'], true)) {
            $intent = $event->data->object;
            $payment = Payment::where('provider_payment_id', $intent->id)->first();
            if ($payment) {
                $payment->update(['status' => $intent->status, 'failure_message' => $intent->last_payment_error?->message]);
                if ($event->type === 'payment_intent.succeeded') {
                    $payment->order()->update(['status' => 'paid']);
                }
                if ($event->type === 'payment_intent.canceled') {
                    $payment->order()->update(['status' => 'cancelled']);
                }
            }
        }

        return response()->json(['received' => true]);
    }
}
