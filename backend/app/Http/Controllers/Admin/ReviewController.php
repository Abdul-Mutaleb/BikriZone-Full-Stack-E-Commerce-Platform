<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Comment;
use App\Models\Product;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::with(['user', 'product', 'media']);
        if ($request->status) $query->where('status', $request->status);

        return response()->json($query->latest()->paginate(20));
    }

    public function updateStatus(Request $request, Review $review)
    {
        $request->validate(['status' => 'required|in:approved,rejected,pending']);
        $review->update(['status' => $request->status]);

        $this->updateProductRating($review->product_id);

        return response()->json(['message' => 'Review status updated']);
    }

    public function comments(Request $request)
    {
        $query = Comment::with(['user', 'product']);
        if ($request->status) $query->where('status', $request->status);

        return response()->json($query->latest()->paginate(20));
    }

    public function updateCommentStatus(Request $request, Comment $comment)
    {
        $request->validate(['status' => 'required|in:approved,rejected,pending']);
        $comment->update(['status' => $request->status]);

        return response()->json(['message' => 'Comment status updated']);
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
