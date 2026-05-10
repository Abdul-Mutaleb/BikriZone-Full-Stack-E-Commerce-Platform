<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = ['chat_room_id', 'user_id', 'message', 'sender_type', 'order_reference', 'is_read'];

    protected $casts = ['is_read' => 'boolean'];

    public function chatRoom() { return $this->belongsTo(ChatRoom::class); }
    public function user() { return $this->belongsTo(User::class); }
}
