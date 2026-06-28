<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\MovieController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\SessionController;
use App\Http\Controllers\Api\TmdbController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// External cron endpoint — called by cron-job.org every minute
// Protected by CRON_SECRET env var (no auth middleware needed)
Route::post('cron/run-reminders', function (\Illuminate\Http\Request $request) {
    $secret = env('CRON_SECRET', '');
    if (!$secret || $request->query('secret') !== $secret) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }
    \Artisan::call('push:send-rating-reminders');
    return response()->json(['ok' => true, 'output' => trim(\Artisan::output())]);
});

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
    Route::middleware('auth:sanctum')->get('me', [AuthController::class, 'me']);
});

Route::middleware('auth:sanctum')->group(function () {
    // User
    Route::put('users/profile', [UserController::class, 'updateProfile']);
    Route::get('users/stats', [UserController::class, 'stats']);
    Route::get('users/badges', [UserController::class, 'badges']);

    // Groups (special routes before apiResource to avoid conflicts)
    Route::post('groups/join/{code}', [GroupController::class, 'join']);
    Route::delete('groups/{id}/leave', [GroupController::class, 'leave']);
    Route::get('groups/{id}/members', [GroupController::class, 'members']);
    Route::delete('groups/{id}/members/{userId}', [GroupController::class, 'kickMember']);
    Route::get('groups/{id}/stats', [GroupController::class, 'stats']);
    Route::get('groups/{id}/memories', [GroupController::class, 'memories']);
    Route::apiResource('groups', GroupController::class);

    // Movies — random must come before apiResource to avoid {id} conflict
    Route::get('groups/{groupId}/movies/random', [MovieController::class, 'random']);
    Route::apiResource('groups/{groupId}/movies', MovieController::class);

    // Sessions
    Route::post('groups/{groupId}/sessions/{id}/start', [SessionController::class, 'start']);
    Route::post('groups/{groupId}/sessions/{id}/finish', [SessionController::class, 'finish']);
    Route::post('groups/{groupId}/sessions/{id}/cancel', [SessionController::class, 'cancel']);
    Route::post('groups/{groupId}/sessions/{id}/return', [SessionController::class, 'returnToPending']);
    Route::apiResource('groups/{groupId}/sessions', SessionController::class);

    // Ratings
    Route::post('sessions/{id}/ratings', [RatingController::class, 'store']);

    // TMDB proxy
    Route::get('tmdb/search', [TmdbController::class, 'search']);
    Route::get('tmdb/movie/{id}', [TmdbController::class, 'movie']);

    // Push Notifications
    Route::post('push/subscribe', [PushController::class, 'subscribe']);
    Route::delete('push/unsubscribe', [PushController::class, 'unsubscribe']);
});
