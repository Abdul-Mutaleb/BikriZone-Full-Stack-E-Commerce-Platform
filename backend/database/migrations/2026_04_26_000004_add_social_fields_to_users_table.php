<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('avatar');
            $table->string('facebook_id')->nullable()->unique()->after('google_id');
            $table->string('social_avatar')->nullable()->after('facebook_id');
            $table->string('password')->nullable()->change(); // social users have no password
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'facebook_id', 'social_avatar']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
