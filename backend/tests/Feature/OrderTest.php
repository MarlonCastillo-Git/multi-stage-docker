<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_uses_database_price_and_decrements_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['price' => 10.50, 'stock' => 5]);
        $this->withToken(auth('api')->login($user))->postJson('/api/v1/orders', ['items' => [['product_id' => $product->id, 'quantity' => 2]]])
            ->assertCreated()->assertJsonPath('data.total', '21.00');
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 3]);
        $this->assertDatabaseHas('order_items', ['product_id' => $product->id, 'quantity' => 2, 'subtotal' => 21]);
    }

    public function test_user_cannot_view_another_users_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = $owner->orders()->create(['status' => 'pending', 'currency' => 'USD', 'total' => 10]);
        $this->withToken(auth('api')->login($other))->getJson("/api/v1/orders/{$order->id}")->assertNotFound();
    }
}
