<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FraudLog;
use Illuminate\Http\Request;

class FraudController extends Controller
{
    public function index(Request $request)
    {
        $query = FraudLog::with(['user', 'order'])
            ->orderByRaw("FIELD(severity, 'high', 'medium', 'low')")
            ->latest();

        if ($request->severity) {
            $query->where('severity', $request->severity);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->reviewed !== null) {
            $query->where('is_reviewed', $request->reviewed === 'true');
        }

        return response()->json($query->paginate(20));
    }

    public function markReviewed(FraudLog $fraudLog)
    {
        $fraudLog->update(['is_reviewed' => true]);
        return response()->json(['message' => 'Marked as reviewed']);
    }

    public function stats()
    {
        return response()->json([
            'total'        => FraudLog::count(),
            'unreviewed'   => FraudLog::where('is_reviewed', false)->count(),
            'high'         => FraudLog::where('severity', 'high')->where('is_reviewed', false)->count(),
            'medium'       => FraudLog::where('severity', 'medium')->where('is_reviewed', false)->count(),
        ]);
    }
}
