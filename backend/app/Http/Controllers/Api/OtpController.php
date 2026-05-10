<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PhoneOtp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OtpController extends Controller
{
    public function send(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|min:11|max:15|regex:/^01[3-9]\d{8}$/',
        ], [
            'phone.regex' => 'Phone must be a valid Bangladeshi number (e.g. 01XXXXXXXXX).',
        ]);

        $phone = $request->phone;

        // Delete previous OTPs for this phone
        PhoneOtp::where('phone', $phone)->delete();

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        PhoneOtp::create([
            'phone'      => $phone,
            'otp'        => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        // TODO: Replace with real SMS gateway (e.g. SSL Wireless, Infobip, Twilio)
        Log::info("OTP for {$phone}: {$otp}");

        $response = ['message' => 'OTP sent to ' . $this->maskPhone($phone)];

        // Expose OTP only in local dev environment
        if (app()->environment('local')) {
            $response['dev_otp'] = $otp;
        }

        return response()->json($response);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'otp'   => 'required|string|size:6',
        ]);

        $record = PhoneOtp::where('phone', $request->phone)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 422);
        }

        $record->update(['used' => true]);

        return response()->json(['message' => 'Phone verified successfully.', 'verified' => true]);
    }

    private function maskPhone(string $phone): string
    {
        return substr($phone, 0, 4) . '****' . substr($phone, -3);
    }
}
