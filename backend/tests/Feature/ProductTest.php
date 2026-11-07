<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_is_public(): void
    {
        Product::factory()->count(2)->create();
        $this->getJson('/api/v1/products')->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_only_admin_can_create_product(): void
    {
        $payload = ['name' => 'Teclado', 'slug' => 'teclado', 'price' => 49.99, 'stock' => 5];
        $user = User::factory()->create();
        $this->withToken(auth('api')->login($user))->postJson('/api/v1/products', $payload)->assertForbidden();
        $admin = User::factory()->create(['is_admin' => true]);
        $this->withToken(auth('api')->login($admin))->postJson('/api/v1/products', $payload)->assertCreated()->assertJsonPath('data.slug', 'teclado');
    }
}
