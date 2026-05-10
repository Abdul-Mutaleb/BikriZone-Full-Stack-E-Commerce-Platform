<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = User::where('role', 'customer')
            ->withCount('orders')
            ->withSum(['orders as lifetime_value' => function ($q) {
                $q->where('payment_status', 'paid');
            }], 'total');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function show(User $user)
    {
        return response()->json($user->load(['orders.items', 'addresses', 'reviews']));
    }

    public function toggleStatus(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);
        return response()->json(['message' => 'User status updated', 'is_active' => $user->is_active]);
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate(['role' => 'required|in:customer,admin,order_manager,super_admin']);
        $user->update(['role' => $request->role]);
        return response()->json(['message' => 'Role updated']);
    }
}
