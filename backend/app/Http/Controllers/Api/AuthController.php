<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return $this->tokenResponse(auth('api')->login($user), $user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        if (! $token = auth('api')->attempt($request->validated())) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        return $this->tokenResponse($token, auth('api')->user());
    }

    public function me(): JsonResponse
    {
        return response()->json(['data' => auth('api')->user()]);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    public function refresh(): JsonResponse
    {
        return $this->tokenResponse(auth('api')->refresh(), auth('api')->user());
    }

    private function tokenResponse(string $token, User $user, int $status = 200): JsonResponse
    {
        return response()->json(['data' => ['user' => $user, 'access_token' => $token, 'token_type' => 'Bearer', 'expires_in' => auth('api')->factory()->getTTL() * 60]], $status);
    }
}
