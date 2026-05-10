<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FraudLog extends Model
{
    protected $fillable = ['user_id', 'order_id', 'type', 'reason', 'ip_address', 'severity', 'is_reviewed'];

    protected $casts = ['is_reviewed' => 'boolean'];

    public function user()  { return $this->belongsTo(User::class); }
    public function order() { return $this->belongsTo(Order::class); }
}
