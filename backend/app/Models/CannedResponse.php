<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CannedResponse extends Model
{
    protected $fillable = ['shortcut', 'title', 'response', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
}
