<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\StripePaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Stripe\PaymentIntent;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_create_payment_intent_for_own_order(): void
    {
        $user = User::factory()->create();
        $order = $user->orders()->create(['status' => 'pending', 'currency' => 'USD', 'total' => 25]);
        $intent = PaymentIntent::constructFrom(['id' => 'pi_test_123', 'client_secret' => 'pi_test_secret', 'status' => 'requires_payment_method']);
        $this->mock(StripePaymentService::class, function (MockInterface $mock) use ($order, $intent) {
            $mock->shouldReceive('createIntent')->once()->withArgs(fn ($value) => $value->is($order))->andReturn($intent);
        });
        $this->withToken(auth('api')->login($user))->postJson("/api/v1/orders/{$order->id}/payment-intent")
            ->assertOk()->assertJsonPath('data.payment_intent_id', 'pi_test_123');
    }
}
