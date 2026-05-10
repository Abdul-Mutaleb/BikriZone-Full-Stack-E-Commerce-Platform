<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images'])->withTrashed();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%");
        }
        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->status === 'low_stock') {
            $query->whereColumn('stock', '<=', 'low_stock_threshold');
        }
        if ($request->is_featured) {
            $query->where('is_featured', true);
        }

        return response()->json($query->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|unique:products,sku',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'sometimes|integer|min:0',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'thumbnail' => 'nullable|image|max:2048',
            'images.*' => 'nullable|image|max:2048',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);

        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail'] = $request->file('thumbnail')->store('products', 'public');
        }

        $product = Product::create($validated);

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $i => $image) {
                $path = $image->store('products', 'public');
                $product->images()->create(['image' => $path, 'sort_order' => $i]);
            }
        }

        return response()->json(['product' => $product->load('images'), 'message' => 'Product created'], 201);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name'               => 'sometimes|string|max:255',
            'category_id'        => 'sometimes|exists:categories,id',
            'description'        => 'nullable|string',
            'short_description'  => 'nullable|string',
            'price'              => 'sometimes|numeric|min:0',
            'sale_price'         => 'nullable|numeric|min:0',
            'sku'                => "nullable|string|unique:products,sku,{$product->id}",
            'stock'              => 'sometimes|integer|min:0',
            'low_stock_threshold'=> 'sometimes|integer|min:0',
            'is_active'          => 'boolean',
            'is_featured'        => 'boolean',
            'thumbnail'          => 'nullable|image|max:2048',
            'images.*'           => 'nullable|image|max:4096',
        ]);

        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail'] = $request->file('thumbnail')->store('products', 'public');
        }

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        }

        $product->update($validated);

        if ($request->hasFile('images')) {
            $existingCount = $product->images()->count();
            foreach ($request->file('images') as $i => $image) {
                $path = $image->store('products', 'public');
                $product->images()->create(['image' => $path, 'sort_order' => $existingCount + $i]);
            }
        }

        return response()->json(['product' => $product->fresh()->load('category', 'images'), 'message' => 'Product updated']);
    }

    public function deleteImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['message' => 'Image not found'], 404);
        }
        $image->delete();
        return response()->json(['message' => 'Image deleted']);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Product deleted']);
    }

    public function restore(int $id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();
        return response()->json(['message' => 'Product restored']);
    }

    public function addVariant(Request $request, Product $product)
    {
        $validated = $request->validate([
            'size' => 'nullable|string',
            'color' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'sku' => 'nullable|string|unique:product_variants,sku',
        ]);

        $variant = $product->variants()->create($validated);

        return response()->json(['variant' => $variant, 'message' => 'Variant added'], 201);
    }
}
