<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\BkashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        $stats = [
            'total_orders' => Order::count(),
            'total_revenue' => Order::where('payment_status', 'paid')->sum('total'),
            'today_orders' => Order::whereDate('created_at', $today)->count(),
            'today_revenue' => Order::where('payment_status', 'paid')->whereDate('created_at', $today)->sum('total'),
            'monthly_revenue' => Order::where('payment_status', 'paid')->where('created_at', '>=', $thisMonth)->sum('total'),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'processing_orders' => Order::where('status', 'processing')->count(),
            'total_products' => Product::count(),
            'low_stock_products' => Product::whereColumn('stock', '<=', 'low_stock_threshold')->count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'new_customers_today' => User::where('role', 'customer')->whereDate('created_at', $today)->count(),
        ];

        $salesChart = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recentOrders = Order::with('user')
            ->latest()
            ->take(10)
            ->get();

        $bkashTransactions = BkashTransaction::with(['order', 'user'])
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'stats' => $stats,
            'sales_chart' => $salesChart,
            'recent_orders' => $recentOrders,
            'bkash_transactions' => $bkashTransactions,
        ]);
    }

    public function exportReport(Request $request)
    {
        $request->validate(['type' => 'required|in:daily,weekly,monthly']);

        $from = match ($request->type) {
            'daily' => Carbon::today(),
            'weekly' => Carbon::now()->startOfWeek(),
            'monthly' => Carbon::now()->startOfMonth(),
        };

        $orders = Order::where('created_at', '>=', $from)
            ->with(['user', 'items'])
            ->get();

        $csv = "Order Number,Customer,Status,Payment,Total,Date\n";
        foreach ($orders as $order) {
            $csv .= "{$order->order_number},{$order->user->name},{$order->status},{$order->payment_status},{$order->total},{$order->created_at->format('Y-m-d')}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=report_{$request->type}.csv",
        ]);
    }
}
