<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('stripe/webhook', [PaymentController::class, 'webhook'])->middleware('throttle:120,1');
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{product}', [ProductController::class, 'show']);

    Route::middleware('auth:api')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/refresh', [AuthController::class, 'refresh']);
        Route::get('orders', [OrderController::class, 'index']);
        Route::post('orders', [OrderController::class, 'store'])->middleware('throttle:20,1');
        Route::get('orders/{order}', [OrderController::class, 'show']);
        Route::post('orders/{order}/payment-intent', [PaymentController::class, 'store'])->middleware('throttle:10,1');

        Route::middleware('admin')->group(function () {
            Route::post('products', [ProductController::class, 'store']);
            Route::put('products/{product}', [ProductController::class, 'update']);
            Route::patch('products/{product}', [ProductController::class, 'update']);
            Route::delete('products/{product}', [ProductController::class, 'destroy']);
        });
    });
});
