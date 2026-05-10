<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\InventoryLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ERPController extends Controller
{
    // ── Inventory ────────────────────────────────────────────────

    public function inventoryOverview(Request $request)
    {
        $query = Product::with('category')->withoutTrashed();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }

        if ($request->filter === 'low_stock') {
            $query->whereColumn('stock', '<=', 'low_stock_threshold');
        } elseif ($request->filter === 'out_of_stock') {
            $query->where('stock', 0);
        }

        $products = $query->latest()->get();

        $allProducts = Product::withoutTrashed()->get();

        return response()->json([
            'products' => $products,
            'stats' => [
                'total_products'  => $allProducts->count(),
                'low_stock'       => $allProducts->filter(fn($p) => $p->stock > 0 && $p->stock <= $p->low_stock_threshold)->count(),
                'out_of_stock'    => $allProducts->where('stock', 0)->count(),
                'total_stock_value' => round($allProducts->sum(fn($p) => $p->stock * ($p->price ?? 0)), 2),
            ],
        ]);
    }

    public function adjustStock(Request $request, Product $product)
    {
        $request->validate([
            'adjustment' => 'required|integer|not_in:0',
            'notes'      => 'nullable|string|max:500',
        ]);

        $before = $product->stock;
        $after  = max(0, $before + $request->adjustment);

        InventoryLog::create([
            'product_id'      => $product->id,
            'quantity_change' => $request->adjustment,
            'quantity_before' => $before,
            'quantity_after'  => $after,
            'type'            => 'adjustment',
            'notes'           => $request->notes,
            'user_id'         => $request->user()->id,
        ]);

        $product->update(['stock' => $after]);

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'product' => $product->fresh(),
        ]);
    }

    public function inventoryLogs(Product $product)
    {
        return response()->json(
            InventoryLog::with('user:id,name')
                ->where('product_id', $product->id)
                ->latest()
                ->limit(50)
                ->get()
        );
    }

    // ── Suppliers ────────────────────────────────────────────────

    public function suppliers(Request $request)
    {
        $query = Supplier::query();
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        return response()->json($query->latest()->get());
    }

    public function storeSupplier(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:20',
            'address'        => 'nullable|string',
            'is_active'      => 'nullable|boolean',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json(['supplier' => $supplier, 'message' => 'Supplier created'], 201);
    }

    public function updateSupplier(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:20',
            'address'        => 'nullable|string',
            'is_active'      => 'nullable|boolean',
        ]);

        $supplier->update($validated);
        return response()->json(['supplier' => $supplier->fresh(), 'message' => 'Supplier updated']);
    }

    public function deleteSupplier(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted']);
    }

    // ── Purchase Orders ──────────────────────────────────────────

    public function purchaseOrders(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items.product:id,name,sku,thumbnail']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->latest()->get());
    }

    public function storePurchaseOrder(Request $request)
    {
        $validated = $request->validate([
            'supplier_id'          => 'required|exists:suppliers,id',
            'expected_date'        => 'nullable|date',
            'notes'                => 'nullable|string',
            'items'                => 'required|array|min:1',
            'items.*.product_id'   => 'required|exists:products,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'items.*.unit_price'   => 'required|numeric|min:0',
        ]);

        $po = PurchaseOrder::create([
            'po_number'     => 'PO-' . strtoupper(Str::random(8)),
            'supplier_id'   => $validated['supplier_id'],
            'expected_date' => $validated['expected_date'] ?? null,
            'notes'         => $validated['notes'] ?? null,
            'status'        => 'draft',
        ]);

        $total = 0;
        foreach ($validated['items'] as $item) {
            $lineTotal = $item['quantity'] * $item['unit_price'];
            $po->items()->create([
                'product_id' => $item['product_id'],
                'quantity'   => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total'      => $lineTotal,
            ]);
            $total += $lineTotal;
        }

        $po->update(['total_amount' => $total]);

        return response()->json([
            'po'      => $po->load(['supplier', 'items.product']),
            'message' => 'Purchase order created',
        ], 201);
    }

    public function updatePOStatus(Request $request, PurchaseOrder $po)
    {
        $request->validate(['status' => 'required|in:draft,ordered,received,cancelled']);

        if ($po->status === 'received') {
            return response()->json(['message' => 'Cannot change status of a received PO'], 422);
        }

        if ($request->status === 'received') {
            foreach ($po->items as $item) {
                $product = $item->product;
                $before  = $product->stock;
                $after   = $before + $item->quantity;

                InventoryLog::create([
                    'product_id'      => $product->id,
                    'quantity_change' => $item->quantity,
                    'quantity_before' => $before,
                    'quantity_after'  => $after,
                    'type'            => 'purchase',
                    'reference'       => $po->po_number,
                    'user_id'         => $request->user()->id,
                ]);

                $product->update(['stock' => $after]);
            }
        }

        $po->update(['status' => $request->status]);
        return response()->json(['message' => 'Status updated', 'po' => $po->fresh()]);
    }

    public function deletePO(PurchaseOrder $po)
    {
        if ($po->status === 'received') {
            return response()->json(['message' => 'Cannot delete a received purchase order'], 422);
        }
        $po->delete();
        return response()->json(['message' => 'Purchase order deleted']);
    }

    // ── ERP Stats ────────────────────────────────────────────────

    public function stats()
    {
        return response()->json([
            'suppliers'       => Supplier::where('is_active', true)->count(),
            'open_pos'        => PurchaseOrder::whereIn('status', ['draft', 'ordered'])->count(),
            'received_pos'    => PurchaseOrder::where('status', 'received')->count(),
            'low_stock'       => Product::withoutTrashed()->whereColumn('stock', '<=', 'low_stock_threshold')->count(),
            'recent_logs'     => InventoryLog::with(['product:id,name', 'user:id,name'])
                ->latest()->limit(10)->get(),
        ]);
    }
}
