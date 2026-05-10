<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewMedia extends Model
{
    protected $fillable = ['review_id', 'file_path', 'type'];

    public function review() { return $this->belongsTo(Review::class); }
}
