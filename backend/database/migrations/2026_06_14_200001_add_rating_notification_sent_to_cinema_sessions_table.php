<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cinema_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('cinema_sessions', 'rating_notification_sent')) {
                $table->boolean('rating_notification_sent')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cinema_sessions', function (Blueprint $table) {
            $table->dropColumn('rating_notification_sent');
        });
    }
};
