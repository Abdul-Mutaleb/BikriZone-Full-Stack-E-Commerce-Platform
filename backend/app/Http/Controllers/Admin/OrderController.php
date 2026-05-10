<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\UserNotification;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'items']);

        if ($request->status) $query->where('status', $request->status);
        if ($request->payment_status) $query->where('payment_status', $request->payment_status);
        if ($request->payment_method) $query->where('payment_method', $request->payment_method);
        if ($request->date_from) $query->where('created_at', '>=', $request->date_from);
        if ($request->date_to) $query->where('created_at', '<=', $request->date_to . ' 23:59:59');
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('order_number', 'like', "%{$request->search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$request->search}%"));
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function show(Order $order)
    {
        return response()->json($order->load(['user', 'items.product', 'items.variant', 'coupon', 'bkashTransaction']));
    }

    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,refunded',
        ]);

        $updates = ['status' => $request->status];

        if ($request->status === 'shipped') {
            $updates['shipped_at'] = now();
        } elseif ($request->status === 'delivered') {
            $updates['delivered_at'] = now();
            if ($order->payment_method === 'cod') {
                $updates['payment_status'] = 'paid';
            }
        }

        $order->update($updates);

        $statusLabels = [
            'processing' => 'is being processed',
            'shipped'    => 'has been shipped',
            'delivered'  => 'has been delivered',
            'cancelled'  => 'has been cancelled',
            'refunded'   => 'has been refunded',
        ];
        $label = $statusLabels[$request->status] ?? "status changed to {$request->status}";

        UserNotification::create([
            'user_id' => $order->user_id,
            'type'    => 'order_status',
            'title'   => 'Order Update',
            'body'    => "Your order #{$order->order_number} {$label}.",
            'link'    => "/orders/{$order->id}",
        ]);

        return response()->json(['message' => 'Order status updated', 'order' => $order->fresh()]);
    }

    public function invoice(Order $order)
    {
        return response()->json($order->load(['user', 'items.product', 'coupon']));
    }
}
