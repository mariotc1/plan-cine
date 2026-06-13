<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cinema_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('group_id');
            $table->uuid('movie_id')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('estimated_end_at')->nullable();
            $table->timestamp('actual_end_at')->nullable();
            $table->string('status', 20)->default('pending');
            $table->uuid('created_by')->nullable();
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
            $table->foreign('movie_id')->references('id')->on('movies')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('session_participants', function (Blueprint $table) {
            $table->uuid('session_id');
            $table->uuid('user_id');
            $table->primary(['session_id', 'user_id']);
            $table->foreign('session_id')->references('id')->on('cinema_sessions')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id');
            $table->uuid('user_id');
            $table->tinyInteger('score');
            $table->foreign('session_id')->references('id')->on('cinema_sessions')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['session_id', 'user_id']);
            $table->timestamps();
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->text('endpoint');
            $table->text('p256dh');
            $table->text('auth');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('session_participants');
        Schema::dropIfExists('cinema_sessions');
    }
};
