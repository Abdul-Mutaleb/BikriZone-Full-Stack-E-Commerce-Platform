<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\CannedResponse;
use App\Models\User;
use App\Events\NewChatMessage;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function inbox(Request $request)
    {
        $rooms = ChatRoom::with(['user', 'latestMessage'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->withCount(['messages as unread_count' => fn($q) => $q->where('is_read', false)->where('sender_type', 'user')])
            ->latest()
            ->paginate(20);

        return response()->json($rooms);
    }

    public function roomMessages(ChatRoom $room)
    {
        $messages = $room->messages()->with('user')->latest()->take(100)->get()->reverse()->values();

        $room->messages()->where('sender_type', 'user')->update(['is_read' => true]);

        return response()->json(['room' => $room->load('user'), 'messages' => $messages]);
    }

    public function reply(Request $request, ChatRoom $room)
    {
        $request->validate(['message' => 'required|string|max:2000']);

        $message = $room->messages()->create([
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'sender_type' => 'admin',
        ]);

        if ($room->is_bot_active) {
            $room->update(['is_bot_active' => false]);
        }

        broadcast(new NewChatMessage($message->load('user')))->toOthers();

        return response()->json(['message' => $message]);
    }

    public function closeRoom(ChatRoom $room)
    {
        $room->update(['status' => 'closed']);
        return response()->json(['message' => 'Chat closed']);
    }

    public function reopenRoom(ChatRoom $room)
    {
        $room->update(['status' => 'open']);
        return response()->json(['message' => 'Chat reopened', 'room' => $room]);
    }

    public function userRoom(Request $request, User $user)
    {
        // Find existing open room or create one for admin-initiated conversations
        $room = ChatRoom::firstOrCreate(
            ['user_id' => $user->id, 'status' => 'open'],
            ['is_bot_active' => false]
        );

        $messages = $room->messages()->with('user')->latest()->take(60)->get()->reverse()->values();

        $room->messages()->where('sender_type', 'user')->update(['is_read' => true]);

        return response()->json(['room' => $room->load('user'), 'messages' => $messages]);
    }

    public function cannedResponses()
    {
        return response()->json(CannedResponse::where('is_active', true)->get());
    }

    public function storeCannedResponse(Request $request)
    {
        $validated = $request->validate([
            'shortcut' => 'required|string|unique:canned_responses,shortcut',
            'title' => 'required|string',
            'response' => 'required|string',
        ]);

        $response = CannedResponse::create($validated);

        return response()->json(['response' => $response, 'message' => 'Canned response created'], 201);
    }
}
