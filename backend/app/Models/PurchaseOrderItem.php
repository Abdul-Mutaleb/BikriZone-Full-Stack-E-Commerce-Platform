<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = ['purchase_order_id', 'product_id', 'quantity', 'unit_price', 'total'];

    protected $casts = ['unit_price' => 'float', 'total' => 'float'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
