<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'user_id', 'product_id', 'order_id', 'rating', 'title', 'body',
        'is_verified_buyer', 'status',
    ];

    protected $casts = ['is_verified_buyer' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function order() { return $this->belongsTo(Order::class); }
    public function media() { return $this->hasMany(ReviewMedia::class); }
}
