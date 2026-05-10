<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BkashTransaction extends Model
{
    protected $fillable = [
        'order_id', 'user_id', 'payment_id', 'trx_id', 'bkash_number',
        'amount', 'status', 'transaction_status', 'raw_response', 'is_sandbox',
    ];

    protected $casts = ['amount' => 'decimal:2', 'is_sandbox' => 'boolean'];

    public function order() { return $this->belongsTo(Order::class); }
    public function user() { return $this->belongsTo(User::class); }
}
