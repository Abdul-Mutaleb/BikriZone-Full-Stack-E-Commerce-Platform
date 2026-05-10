<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneOtp;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'nullable|email|unique:users|required_without:phone',
            'phone'    => 'nullable|string|min:11|max:15|unique:users|required_without:email',
            'otp'      => 'nullable|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // If phone provided, OTP must be verified
        if ($request->filled('phone')) {
            $otpRecord = PhoneOtp::where('phone', $request->phone)
                ->where('otp', $request->otp)
                ->where('used', true)
                ->where('updated_at', '>=', now()->subMinutes(15))
                ->first();

            if (!$otpRecord) {
                return response()->json([
                    'message' => 'Phone verification failed. Please verify your phone number again.',
                    'errors'  => ['otp' => ['Invalid or expired OTP.']],
                ], 422);
            }
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email ?: null,
            'phone'    => $request->phone ?: null,
            'password' => $request->password,
            'role'     => 'customer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Registration successful',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string',
            'password'   => 'required',
        ]);

        $identifier = $request->input('identifier');

        // Find user by email or phone
        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user || !\Hash::check($request->password, $user->password ?? '')) {
            throw ValidationException::withMessages([
                'identifier' => ['Invalid credentials.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        return response()->json($request->user()->load('addresses'));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $path;
        }

        $user->update($validated);

        return response()->json(['user' => $user, 'message' => 'Profile updated']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $request->user()->update(['password' => $request->password]);

        return response()->json(['message' => 'Password changed successfully']);
    }
}
