<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->groupBy('group');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate(['settings' => 'required|array']);

        foreach ($request->settings as $key => $value) {
            $group = match (true) {
                str_starts_with($key, 'bkash_') => 'payment',
                str_starts_with($key, 'shipping_') || str_starts_with($key, 'tax_') => 'shipping',
                default => 'general',
            };
            Setting::set($key, $value, $group);
        }

        return response()->json(['message' => 'Settings updated']);
    }
}
