<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\ChatMessage;
use App\Models\CannedResponse;
use App\Models\SupportTicket;
use App\Models\User;
use App\Models\UserNotification;
use App\Events\NewChatMessage;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    private array $botReplies = [
        'order' => 'You can track your order from Account > My Orders. Need your Order ID for details!',
        'payment' => 'We accept bKash and Cash on Delivery. For payment issues, please share your Order ID.',
        'delivery' => 'Standard delivery takes 3-5 business days within Dhaka, 5-7 days outside.',
        'return' => 'Returns accepted within 7 days of delivery. Items must be unused with original packaging.',
        'cancel' => 'Orders can be cancelled before they are shipped. Go to My Orders to cancel.',
        'hello' => 'Hello! Welcome to MegaBazar support. How can I help you today?',
        'hi' => 'Hi there! How can I assist you today?',
    ];

    public function getOrCreateRoom(Request $request)
    {
        $room = ChatRoom::firstOrCreate(
            ['user_id' => $request->user()->id, 'status' => 'open'],
            ['is_bot_active' => true]
        );

        $messages = $room->messages()->with('user')->latest()->take(50)->get()->reverse()->values();

        return response()->json(['room' => $room, 'messages' => $messages]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'order_reference' => 'nullable|string',
        ]);

        $room = ChatRoom::where('user_id', $request->user()->id)->where('status', 'open')->firstOrFail();

        $message = $room->messages()->create([
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'sender_type' => 'user',
            'order_reference' => $request->order_reference,
        ]);

        broadcast(new NewChatMessage($message->load('user')))->toOthers();

        // Notify admins of new user message
        $adminUsers = User::whereIn('role', ['admin', 'super_admin'])->get();
        foreach ($adminUsers as $admin) {
            UserNotification::create([
                'user_id' => $admin->id,
                'type'    => 'new_message',
                'title'   => '💬 New Customer Message',
                'body'    => "{$request->user()->name}: " . mb_substr($request->message, 0, 80),
                'link'    => '/admin/chat',
            ]);
        }

        if ($room->is_bot_active) {
            $botReply = $this->getBotReply($request->message);
            if ($botReply) {
                $botMessage = $room->messages()->create([
                    'message' => $botReply,
                    'sender_type' => 'bot',
                ]);
                broadcast(new NewChatMessage($botMessage))->toOthers();
                return response()->json(['message' => $message, 'bot_reply' => $botMessage]);
            }
        }

        return response()->json(['message' => $message->load('user')]);
    }

    private function getBotReply(string $userMessage): ?string
    {
        $lower = strtolower($userMessage);
        foreach ($this->botReplies as $keyword => $reply) {
            if (str_contains($lower, $keyword)) {
                return $reply;
            }
        }
        return null;
    }

    public function createTicket(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'sometimes|in:low,medium,high',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $request->subject,
            'message' => $request->message,
            'priority' => $request->priority ?? 'medium',
        ]);

        $adminUsers = User::whereIn('role', ['admin', 'super_admin'])->get();
        foreach ($adminUsers as $admin) {
            UserNotification::create([
                'user_id' => $admin->id,
                'type'    => 'new_ticket',
                'title'   => '🎫 New Support Ticket',
                'body'    => "{$request->user()->name}: {$request->subject}",
                'link'    => '/admin/chat',
            ]);
        }

        return response()->json(['ticket' => $ticket, 'message' => 'Ticket created'], 201);
    }
}
