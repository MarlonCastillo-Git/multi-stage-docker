<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_jwt(): void
    {
        $this->postJson('/api/v1/auth/register', ['name' => 'Ana', 'email' => 'ana@example.com', 'password' => 'password123', 'password_confirmation' => 'password123'])
            ->assertCreated()->assertJsonPath('data.user.email', 'ana@example.com')->assertJsonStructure(['data' => ['access_token', 'token_type', 'expires_in']]);
        $this->assertDatabaseHas('users', ['email' => 'ana@example.com', 'is_admin' => false]);
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'none@example.com', 'password' => 'bad'])->assertUnauthorized();
    }
}
