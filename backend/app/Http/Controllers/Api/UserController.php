<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->only(['name', 'avatar', 'color']));

        return response()->json([
            'data' => new UserResource($request->user()->fresh()),
            'message' => 'Perfil actualizado.',
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Sessions where user participated and finished
        $participatedSessionIds = \DB::table('session_participants')
            ->where('user_id', $user->id)
            ->pluck('session_id');

        $finishedSessions = \App\Models\CinemaSession::with('movie')
            ->whereIn('id', $participatedSessionIds)
            ->where('status', 'finished')
            ->get();

        $moviesWatched = $finishedSessions->count();
        $moviesAdded = \App\Models\Movie::where('added_by', $user->id)->count();

        $userRatings = Rating::where('user_id', $user->id)->get();
        $avgScore = $userRatings->isNotEmpty() ? round($userRatings->avg('score'), 1) : null;

        // Favorite genre
        $genreCounts = $finishedSessions->groupBy(fn($s) => $s->movie?->genre)->map->count();
        $favGenre = $genreCounts->sortDesc()->keys()->first();

        // Favorite platform
        $platformCounts = $finishedSessions->groupBy(fn($s) => $s->movie?->platform)->map->count();
        $favPlatform = $platformCounts->sortDesc()->keys()->first();

        $totalMinutes = $finishedSessions->sum(fn($s) => $s->movie?->duration_minutes ?? 0);
        $hoursAccumulated = round($totalMinutes / 60, 1);

        return response()->json([
            'data' => [
                'movies_watched' => $moviesWatched,
                'movies_added' => $moviesAdded,
                'average_score' => $avgScore,
                'favorite_genre' => $favGenre,
                'favorite_platform' => $favPlatform,
                'hours_accumulated' => $hoursAccumulated,
            ],
        ]);
    }

    public function badges(Request $request): JsonResponse
    {
        $user = $request->user();

        $participatedSessionIds = \DB::table('session_participants')
            ->where('user_id', $user->id)
            ->pluck('session_id');

        $watchedCount = \App\Models\CinemaSession::whereIn('id', $participatedSessionIds)
            ->where('status', 'finished')->count();

        $ratingsCount = Rating::where('user_id', $user->id)->count();

        $moviesAdded = \App\Models\Movie::where('added_by', $user->id)->count();

        $badges = [];

        if ($watchedCount >= 10) {
            $badges[] = ['id' => 'cinema_fan', 'name' => 'Cinéfilo', 'icon' => '🎬', 'description' => '10 películas vistas', 'earned' => true];
        }
        if ($watchedCount >= 50) {
            $badges[] = ['id' => 'cinema_addict', 'name' => 'Adicto al cine', 'icon' => '🏆', 'description' => '50 películas vistas', 'earned' => true];
        }
        if ($watchedCount >= 100) {
            $badges[] = ['id' => 'cinema_legend', 'name' => 'Leyenda', 'icon' => '👑', 'description' => '100 películas vistas', 'earned' => true];
        }
        if ($ratingsCount >= 50) {
            $badges[] = ['id' => 'critic', 'name' => 'Crítico', 'icon' => '⭐', 'description' => '50 valoraciones', 'earned' => true];
        }
        if ($moviesAdded >= 20) {
            $badges[] = ['id' => 'proposer', 'name' => 'Iniciativa', 'icon' => '💡', 'description' => '20 películas propuestas', 'earned' => true];
        }

        return response()->json(['data' => $badges]);
    }
}
