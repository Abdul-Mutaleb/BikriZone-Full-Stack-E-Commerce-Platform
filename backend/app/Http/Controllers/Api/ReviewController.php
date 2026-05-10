<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'body' => 'nullable|string',
            'media.*' => 'nullable|file|mimes:jpeg,png,jpg,mp4|max:10240',
        ]);

        $existingReview = Review::where('user_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existingReview) {
            return response()->json(['message' => 'You already reviewed this product'], 422);
        }

        $isVerified = $request->user()->orders()
            ->whereHas('items', fn($q) => $q->where('product_id', $validated['product_id']))
            ->where('status', 'delivered')
            ->exists();

        $review = Review::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'] ?? null,
            'is_verified_buyer' => $isVerified,
            'status' => 'pending',
        ]);

        if ($request->hasFile('media')) {
            foreach ($request->file('media') as $file) {
                $path = $file->store('reviews', 'public');
                $type = str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image';
                $review->media()->create(['file_path' => $path, 'type' => $type]);
            }
        }

        $product = Product::find($validated['product_id']);
        $this->notifyAdmins(
            'new_review',
            'New Review Submitted',
            "{$request->user()->name} submitted a {$validated['rating']}-star review on \"{$product->name}\". Awaiting approval.",
            '/admin/reviews'
        );

        return response()->json(['message' => 'Review submitted for approval', 'review' => $review], 201);
    }

    public function storeComment(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'parent_id' => 'nullable|exists:comments,id',
            'body' => 'required|string|max:1000',
        ]);

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
            'parent_id' => $validated['parent_id'] ?? null,
            'body' => $validated['body'],
            'status' => 'pending',
        ]);

        $product = Product::find($validated['product_id']);
        $isReply  = !empty($validated['parent_id']);

        $this->notifyAdmins(
            'new_question',
            $isReply ? 'New Reply on Q&A' : 'New Customer Question',
            $isReply
                ? "{$request->user()->name} replied on \"{$product->name}\": \"{$this->truncate($validated['body'])}\""
                : "{$request->user()->name} asked a question on \"{$product->name}\": \"{$this->truncate($validated['body'])}\"",
            '/admin/reviews'
        );

        return response()->json(['message' => 'Comment submitted for approval', 'comment' => $comment], 201);
    }

    private function notifyAdmins(string $type, string $title, string $body, string $link): void
    {
        $admins = User::whereIn('role', ['super_admin', 'admin'])->pluck('id');
        $now    = now();
        $rows   = $admins->map(fn($id) => [
            'user_id'    => $id,
            'type'       => $type,
            'title'      => $title,
            'body'       => $body,
            'link'       => $link,
            'is_read'    => false,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        UserNotification::insert($rows);
    }

    private function truncate(string $text, int $len = 80): string
    {
        return mb_strlen($text) <= $len ? $text : mb_substr($text, 0, $len) . '…';
    }

    private function updateProductRating(int $productId): void
    {
        $stats = Review::where('product_id', $productId)
            ->where('status', 'approved')
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        Product::find($productId)->update([
            'average_rating' => round($stats->avg_rating ?? 0, 2),
            'reviews_count' => $stats->total ?? 0,
        ]);
    }
}
