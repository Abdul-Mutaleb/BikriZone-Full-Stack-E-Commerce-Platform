<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function getCart(Request $request): Cart
    {
        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        return $cart;
    }

    public function index(Request $request)
    {
        $cart = $this->getCart($request);
        $items = $cart->items()->with(['product.images', 'variant'])->get();

        $subtotal = $items->sum(function ($item) {
            $price = $item->variant?->price ?? $item->product->sale_price ?? $item->product->price;
            return $price * $item->quantity;
        });

        return response()->json([
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'count' => $items->sum('quantity'),
        ]);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $stock = $validated['variant_id']
            ? ProductVariant::find($validated['variant_id'])->stock
            : $product->stock;

        if ($stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $cart = $this->getCart($request);
        $item = $cart->items()->where('product_id', $validated['product_id'])
            ->where('variant_id', $validated['variant_id'])
            ->first();

        if ($item) {
            $newQty = $item->quantity + $validated['quantity'];
            if ($stock < $newQty) {
                return response()->json(['message' => 'Insufficient stock'], 422);
            }
            $item->update(['quantity' => $newQty]);
        } else {
            $cart->items()->create($validated);
        }

        return response()->json(['message' => 'Added to cart', 'cart_count' => $cart->items()->sum('quantity')]);
    }

    public function update(Request $request, CartItem $item)
    {
        if ($item->cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['quantity' => 'required|integer|min:1']);

        $stock = $item->variant?->stock ?? $item->product->stock;
        if ($stock < $request->quantity) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $item->update(['quantity' => $request->quantity]);

        return response()->json(['message' => 'Cart updated']);
    }

    public function remove(Request $request, CartItem $item)
    {
        if ($item->cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $item->delete();

        return response()->json(['message' => 'Item removed']);
    }

    public function clear(Request $request)
    {
        $cart = $this->getCart($request);
        $cart->items()->delete();

        return response()->json(['message' => 'Cart cleared']);
    }
}
