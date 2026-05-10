<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\BkashTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BkashController extends Controller
{
    public function initiate(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'bkash_number' => 'required|string|regex:/^01[3-9][0-9]{8}$/',
        ]);

        $order = Order::where('id', $request->order_id)
            ->where('user_id', $request->user()->id)
            ->where('payment_status', 'pending')
            ->firstOrFail();

        $paymentId = 'BKSH_' . strtoupper(Str::random(12));

        $transaction = BkashTransaction::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'payment_id' => $paymentId,
            'bkash_number' => $request->bkash_number,
            'amount' => $order->total,
            'status' => 'pending',
            'is_sandbox' => true,
        ]);

        return response()->json([
            'payment_id' => $paymentId,
            'amount' => $order->total,
            'message' => 'Payment initiated. Enter OTP to confirm.',
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'payment_id' => 'required|string',
            'otp' => 'required|string',
        ]);

        $transaction = BkashTransaction::where('payment_id', $request->payment_id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        if ($request->otp !== '123456') {
            $transaction->update(['status' => 'failed', 'transaction_status' => 'INVALID_OTP']);
            return response()->json(['message' => 'Invalid OTP. Payment failed.'], 422);
        }

        $trxId = 'TRX' . strtoupper(Str::random(10));

        $transaction->update([
            'trx_id' => $trxId,
            'status' => 'completed',
            'transaction_status' => 'Completed',
            'raw_response' => json_encode([
                'trxID' => $trxId,
                'amount' => $transaction->amount,
                'currency' => 'BDT',
                'transactionStatus' => 'Completed',
                'createTime' => now()->toIso8601String(),
                'updateTime' => now()->toIso8601String(),
                'paymentID' => $transaction->payment_id,
                'payerReference' => $transaction->bkash_number,
                'merchantInvoiceNumber' => $transaction->order->order_number,
            ]),
        ]);

        $transaction->order->update([
            'payment_status' => 'paid',
            'status' => 'processing',
        ]);

        return response()->json([
            'trx_id' => $trxId,
            'amount' => $transaction->amount,
            'message' => 'Payment successful!',
            'order' => $transaction->order,
        ]);
    }

    public function transactions(Request $request)
    {
        $transactions = BkashTransaction::where('user_id', $request->user()->id)
            ->with('order')
            ->latest()
            ->paginate(10);

        return response()->json($transactions);
    }
}
