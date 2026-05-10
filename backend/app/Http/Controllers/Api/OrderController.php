<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\FraudLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = $request->user()->orders()
            ->with(['items.product', 'bkashTransaction'])
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($order->load(['items.product', 'items.variant', 'coupon', 'bkashTransaction']));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'shipping_name' => 'required|string',
            'shipping_phone' => 'required|string',
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string',
            'shipping_postal_code' => 'nullable|string',
            'payment_method' => 'required|in:bkash,cod',
            'coupon_code' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $cart = Cart::where('user_id', $request->user()->id)->with('items.product')->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        $subtotal = $cart->items->sum(function ($item) {
            $price = $item->variant?->price ?? $item->product->sale_price ?? $item->product->price;
            return $price * $item->quantity;
        });

        $discount = 0;
        $coupon = null;
        if (!empty($validated['coupon_code'])) {
            $coupon = Coupon::where('code', $validated['coupon_code'])->first();
            if ($coupon && $coupon->isValid()) {
                $discount = $coupon->calculateDiscount($subtotal);
            }
        }

        $shippingCharge = (float) Setting::get('shipping_charge', 60);
        $taxRate = (float) Setting::get('tax_rate', 0);
        $tax = round(($subtotal - $discount) * $taxRate / 100, 2);
        $total = round($subtotal - $discount + $shippingCharge + $tax, 2);

        return DB::transaction(function () use ($request, $validated, $cart, $subtotal, $discount, $shippingCharge, $tax, $total, $coupon) {
            $order = Order::create([
                'user_id' => $request->user()->id,
                'coupon_id' => $coupon?->id,
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_charge' => $shippingCharge,
                'tax' => $tax,
                'total' => $total,
                'shipping_name' => $validated['shipping_name'],
                'shipping_phone' => $validated['shipping_phone'],
                'shipping_address' => $validated['shipping_address'],
                'shipping_city' => $validated['shipping_city'],
                'shipping_postal_code' => $validated['shipping_postal_code'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => 'pending',
                'payment_status' => 'pending',
            ]);

            foreach ($cart->items as $item) {
                $price = $item->variant?->price ?? $item->product->sale_price ?? $item->product->price;
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,
                    'product_name' => $item->product->name,
                    'product_image' => $item->product->thumbnail,
                    'price' => $price,
                    'quantity' => $item->quantity,
                    'total' => $price * $item->quantity,
                ]);

                if ($item->variant) {
                    $item->variant->decrement('stock', $item->quantity);
                } else {
                    $item->product->decrement('stock', $item->quantity);
                }
            }

            if ($coupon) {
                $coupon->increment('used_count');
            }

            $cart->items()->delete();

            // Customer notification
            UserNotification::create([
                'user_id' => $request->user()->id,
                'type'    => 'order_placed',
                'title'   => 'Order Placed Successfully!',
                'body'    => "Your order #{$order->order_number} has been placed. Total: ৳{$order->total}. We will process it shortly.",
                'link'    => "/orders/{$order->id}",
            ]);

            // Admin notifications
            $adminUsers = User::whereIn('role', ['admin', 'super_admin', 'order_manager'])->get();
            foreach ($adminUsers as $admin) {
                UserNotification::create([
                    'user_id' => $admin->id,
                    'type'    => 'new_order',
                    'title'   => '🛒 New Order Received',
                    'body'    => "#{$order->order_number} by {$request->user()->name} — ৳{$order->total}",
                    'link'    => '/admin/orders',
                ]);
            }

            $this->runFraudChecks($request, $order);

            return response()->json([
                'order' => $order->load('items'),
                'message' => 'Order placed successfully',
            ], 201);
        });
    }

    public function guestStore(Request $request)
    {
        $validated = $request->validate([
            'product_id'       => 'required|exists:products,id',
            'quantity'         => 'required|integer|min:1',
            'shipping_name'    => 'required|string',
            'shipping_phone'   => 'required|string',
            'shipping_address' => 'required|string',
            'shipping_city'    => 'required|string',
            'notes'            => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $price   = $product->sale_price ?? $product->price;
        $subtotal = $price * $validated['quantity'];
        $shippingCharge = (float) Setting::get('shipping_charge', 60);
        $total = round($subtotal + $shippingCharge, 2);

        $order = Order::create([
            'user_id'          => null,
            'payment_method'   => 'cod',
            'subtotal'         => $subtotal,
            'discount'         => 0,
            'shipping_charge'  => $shippingCharge,
            'tax'              => 0,
            'total'            => $total,
            'shipping_name'    => $validated['shipping_name'],
            'shipping_phone'   => $validated['shipping_phone'],
            'shipping_address' => $validated['shipping_address'],
            'shipping_city'    => $validated['shipping_city'],
            'notes'            => $validated['notes'] ?? null,
            'status'           => 'pending',
            'payment_status'   => 'pending',
        ]);

        $order->items()->create([
            'product_id'    => $product->id,
            'product_name'  => $product->name,
            'product_image' => $product->thumbnail,
            'price'         => $price,
            'quantity'      => $validated['quantity'],
            'total'         => $price * $validated['quantity'],
        ]);

        $product->decrement('stock', $validated['quantity']);

        $adminUsers = User::whereIn('role', ['admin', 'super_admin', 'order_manager'])->get();
        foreach ($adminUsers as $admin) {
            UserNotification::create([
                'user_id' => $admin->id,
                'type'    => 'new_order',
                'title'   => '🛒 New Guest Order',
                'body'    => "#{$order->order_number} by {$validated['shipping_name']} (Guest) — ৳{$total}",
                'link'    => '/admin/orders',
            ]);
        }

        return response()->json(['order' => $order, 'message' => 'Order placed successfully'], 201);
    }

    public function validateCoupon(Request $request)
    {
        $request->validate(['code' => 'required|string', 'subtotal' => 'required|numeric']);

        $coupon = Coupon::where('code', $request->code)->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json(['message' => 'Invalid or expired coupon'], 422);
        }

        if ($request->subtotal < $coupon->minimum_order) {
            return response()->json([
                'message' => "Minimum order amount is ৳{$coupon->minimum_order}",
            ], 422);
        }

        $discount = $coupon->calculateDiscount($request->subtotal);

        return response()->json([
            'coupon' => $coupon,
            'discount' => $discount,
            'message' => "Coupon applied! You save ৳{$discount}",
        ]);
    }

    private function runFraudChecks(Request $request, Order $order): void
    {
        $userId = $request->user()->id;
        $ip     = $request->ip();

        // 1. Velocity check — more than 3 orders in the last 60 minutes
        $recentCount = Order::where('user_id', $userId)
            ->where('created_at', '>=', now()->subMinutes(60))
            ->count();

        if ($recentCount > 3) {
            FraudLog::create([
                'user_id'    => $userId,
                'order_id'   => $order->id,
                'type'       => 'velocity',
                'reason'     => "{$recentCount} orders placed within the last 60 minutes.",
                'ip_address' => $ip,
                'severity'   => 'high',
            ]);
        }

        // 2. High-value order — over ৳10,000
        if ($order->total > 10000) {
            FraudLog::create([
                'user_id'    => $userId,
                'order_id'   => $order->id,
                'type'       => 'high_value',
                'reason'     => "Order total ৳{$order->total} exceeds the high-value threshold.",
                'ip_address' => $ip,
                'severity'   => 'medium',
            ]);
        }

        // 3. Phone reuse — same shipping phone used by 3+ different accounts
        $phoneUsers = Order::where('shipping_phone', $order->shipping_phone)
            ->distinct('user_id')
            ->count('user_id');

        if ($phoneUsers >= 3) {
            FraudLog::create([
                'user_id'    => $userId,
                'order_id'   => $order->id,
                'type'       => 'phone_reuse',
                'reason'     => "Phone {$order->shipping_phone} used by {$phoneUsers} different accounts.",
                'ip_address' => $ip,
                'severity'   => 'medium',
            ]);
        }
    }
}
