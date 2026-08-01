<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('duels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('group_id');
            $table->uuid('movie_a_id');
            $table->uuid('movie_b_id');
            $table->uuid('winner_id')->nullable();
            $table->uuid('created_by');
            $table->enum('status', ['voting', 'tie', 'closed'])->default('voting');
            $table->foreign('group_id')->references('id')->on('groups')->cascadeOnDelete();
            $table->foreign('movie_a_id')->references('id')->on('movies')->cascadeOnDelete();
            $table->foreign('movie_b_id')->references('id')->on('movies')->cascadeOnDelete();
            $table->foreign('winner_id')->references('id')->on('movies')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('duel_votes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('duel_id');
            $table->uuid('user_id');
            $table->uuid('movie_id');
            $table->foreign('duel_id')->references('id')->on('duels')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('movie_id')->references('id')->on('movies')->cascadeOnDelete();
            $table->unique(['duel_id', 'user_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('duel_votes');
        Schema::dropIfExists('duels');
    }
};
