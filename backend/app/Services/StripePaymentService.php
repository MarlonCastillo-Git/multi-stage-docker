<?php

namespace App\Services;

use App\Models\Order;
use Stripe\PaymentIntent;
use Stripe\StripeClient;

class StripePaymentService
{
    public function __construct(private readonly StripeClient $stripe) {}

    public function createIntent(Order $order): PaymentIntent
    {
        $intent = $this->stripe->paymentIntents->create([
            'amount' => (int) bcmul((string) $order->total, '100', 0),
            'currency' => strtolower($order->currency),
            'automatic_payment_methods' => ['enabled' => true],
            'metadata' => ['order_id' => (string) $order->id, 'user_id' => (string) $order->user_id],
        ], ['idempotency_key' => 'order-'.$order->id]);

        $order->payment()->updateOrCreate([], [
            'provider' => 'stripe', 'provider_payment_id' => $intent->id,
            'status' => $intent->status, 'amount_cents' => $intent->amount,
            'currency' => strtoupper($intent->currency), 'metadata' => ['livemode' => $intent->livemode],
        ]);

        return $intent;
    }
}
