<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRoom extends Model
{
    protected $fillable = ['user_id', 'status', 'is_bot_active'];

    protected $casts = ['is_bot_active' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function messages() { return $this->hasMany(ChatMessage::class); }
    public function latestMessage() { return $this->hasOne(ChatMessage::class)->latest(); }
}
