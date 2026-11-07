<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Stripe\Exception\ApiErrorException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Los datos proporcionados no son válidos.', 'errors' => $e->errors()], 422);
            }
        });
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'No autenticado.'], 401);
            }
        });
        $exceptions->render(function (JWTException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'El token no es válido o ha expirado.'], 401);
            }
        });
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Recurso no encontrado.'], 404);
            }
        });
        $exceptions->render(function (ApiErrorException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'No se pudo procesar la operación con Stripe.'], 502);
            }
        });
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') && $e instanceof HttpExceptionInterface) {
                return response()->json(['message' => $e->getMessage() ?: 'Error HTTP.'], $e->getStatusCode());
            }
            if ($request->is('api/*') && ! config('app.debug')) {
                return response()->json(['message' => 'Ocurrió un error interno.'], 500);
            }
        });
    })->create();
