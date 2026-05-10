<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    public function redirect(string $provider)
    {
        $this->validateProvider($provider);

        $clientId = config("services.{$provider}.client_id");
        if (empty($clientId)) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/social-callback?error=not_configured");
        }

        return Socialite::driver($provider)
            ->stateless()
            ->redirect();
    }

    public function callback(string $provider)
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
            return redirect("{$frontendUrl}/social-callback?error=oauth_failed");
        }

        $field = "{$provider}_id";

        $user = User::where($field, $socialUser->getId())
            ->orWhere('email', $socialUser->getEmail())
            ->first();

        if ($user) {
            // update social id if logging in by email match
            if (!$user->$field) {
                $user->update([$field => $socialUser->getId()]);
            }
        } else {
            $user = User::create([
                'name'          => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                'email'         => $socialUser->getEmail(),
                $field          => $socialUser->getId(),
                'social_avatar' => $socialUser->getAvatar(),
                'role'          => 'customer',
                'is_active'     => true,
                'password'      => null,
            ]);
        }

        $token = $user->createToken('social_auth')->plainTextToken;
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        return redirect("{$frontendUrl}/social-callback?token={$token}&user=" . urlencode(json_encode([
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
            'avatar'=> $user->social_avatar ?? $user->avatar,
        ])));
    }

    private function validateProvider(string $provider): void
    {
        if (!in_array($provider, ['google', 'facebook'])) {
            abort(404, 'Provider not supported');
        }
    }
}
