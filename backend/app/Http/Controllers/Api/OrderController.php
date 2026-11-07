<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $orders = auth('api')->user()->orders()->with(['items', 'payment'])->latest()->paginate(15);

        return OrderResource::collection($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = DB::transaction(function () use ($request) {
            $requested = collect($request->validated('items'))->keyBy('product_id');
            $products = Product::query()->whereIn('id', $requested->keys())->lockForUpdate()->get()->keyBy('id');
            $total = '0.00';
            $lines = [];

            foreach ($requested as $productId => $item) {
                $product = $products->get($productId);
                if (! $product || ! $product->is_active || $product->stock < $item['quantity']) {
                    throw ValidationException::withMessages(['items' => ["El producto {$productId} no está disponible en la cantidad solicitada."]]);
                }
                $subtotal = bcmul((string) $product->price, (string) $item['quantity'], 2);
                $total = bcadd($total, $subtotal, 2);
                $lines[] = ['product_id' => $product->id, 'product_name' => $product->name, 'unit_price' => $product->price, 'quantity' => $item['quantity'], 'subtotal' => $subtotal];
                $product->decrement('stock', $item['quantity']);
            }

            $order = auth('api')->user()->orders()->create(['status' => 'pending', 'currency' => 'USD', 'total' => $total]);
            $order->items()->createMany($lines);

            return $order;
        });

        return (new OrderResource($order->load(['items', 'payment'])))->response()->setStatusCode(201);
    }

    public function show(Order $order): OrderResource
    {
        abort_unless($order->user_id === auth('api')->id(), 404);

        return new OrderResource($order->load(['items', 'payment']));
    }
}
