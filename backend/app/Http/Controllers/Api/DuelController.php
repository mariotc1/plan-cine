<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Duel;
use App\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DuelController extends Controller
{
    public function active(Request $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $duel = $group->duels()
            ->with(['movieA.addedBy', 'movieB.addedBy', 'votes.user', 'votes.movie'])
            ->whereIn('status', ['voting', 'tie'])
            ->latest()
            ->first();

        if (!$duel) {
            return response()->json(['message' => 'No hay ningún duelo activo.'], 404);
        }

        return response()->json(['data' => $this->format($duel)]);
    }

    public function create(Request $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        // Cancel any existing active duel first
        $group->duels()->whereIn('status', ['voting', 'tie'])->update(['status' => 'closed']);

        $movies = $group->movies()->where('status', 'pending')->inRandomOrder()->limit(2)->get();

        if ($movies->count() < 2) {
            return response()->json(['message' => 'Necesitas al menos 2 películas pendientes para iniciar un duelo.'], 422);
        }

        $duel = Duel::create([
            'group_id'   => $group->id,
            'movie_a_id' => $movies[0]->id,
            'movie_b_id' => $movies[1]->id,
            'created_by' => $request->user()->id,
            'status'     => 'voting',
        ]);

        $duel->load(['movieA.addedBy', 'movieB.addedBy', 'votes.user', 'votes.movie']);

        return response()->json(['data' => $this->format($duel)], 201);
    }

    public function vote(Request $request, string $groupId, string $duelId): JsonResponse
    {
        $request->validate(['movie_id' => 'required|string']);

        $group = $this->findGroupForUser($request->user(), $groupId);
        $duel  = $group->duels()->where('id', $duelId)->firstOrFail();

        if ($duel->status !== 'voting') {
            return response()->json(['message' => 'La votación ya ha cerrado.'], 422);
        }

        $movieId = $request->movie_id;
        if ($movieId !== $duel->movie_a_id && $movieId !== $duel->movie_b_id) {
            return response()->json(['message' => 'Película no válida para este duelo.'], 422);
        }

        // Upsert: update existing vote or create new one
        $duel->votes()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['movie_id' => $movieId],
        );

        $duel->load(['movieA.addedBy', 'movieB.addedBy', 'votes.user', 'votes.movie']);

        return response()->json(['data' => $this->format($duel)]);
    }

    public function close(Request $request, string $groupId, string $duelId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $this->requireAdmin($request->user(), $group);

        $duel = $group->duels()->where('id', $duelId)->firstOrFail();

        if ($duel->status !== 'voting') {
            return response()->json(['message' => 'El duelo no está en fase de votación.'], 422);
        }

        if ($duel->votes()->count() === 0) {
            return response()->json(['message' => 'No hay votos todavía.'], 422);
        }

        $duel->load('votes');
        $votesA = $duel->votes->where('movie_id', $duel->movie_a_id)->count();
        $votesB = $duel->votes->where('movie_id', $duel->movie_b_id)->count();

        if ($votesA === $votesB) {
            $duel->update(['status' => 'tie']);
        } else {
            $winnerId = $votesA > $votesB ? $duel->movie_a_id : $duel->movie_b_id;
            $duel->update(['status' => 'closed', 'winner_id' => $winnerId]);
        }

        $duel->load(['movieA.addedBy', 'movieB.addedBy', 'votes.user', 'votes.movie']);

        return response()->json(['data' => $this->format($duel)]);
    }

    public function resolve(Request $request, string $groupId, string $duelId): JsonResponse
    {
        $request->validate(['action' => 'required|in:revote,random']);

        $group = $this->findGroupForUser($request->user(), $groupId);
        $this->requireAdmin($request->user(), $group);

        $duel = $group->duels()->where('id', $duelId)->firstOrFail();

        if ($duel->status !== 'tie') {
            return response()->json(['message' => 'El duelo no está en empate.'], 422);
        }

        if ($request->action === 'revote') {
            $duel->votes()->delete();
            $duel->update(['status' => 'voting']);
        } else {
            $winnerId = collect([$duel->movie_a_id, $duel->movie_b_id])->random();
            $duel->update(['status' => 'closed', 'winner_id' => $winnerId]);
        }

        $duel->load(['movieA.addedBy', 'movieB.addedBy', 'votes.user', 'votes.movie']);

        return response()->json(['data' => $this->format($duel)]);
    }

    public function cancel(Request $request, string $groupId, string $duelId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $this->requireAdmin($request->user(), $group);

        $duel = $group->duels()->where('id', $duelId)->firstOrFail();
        $duel->delete();

        return response()->json(['message' => 'Duelo cancelado.']);
    }

    private function format(Duel $duel): array
    {
        return [
            'id'         => $duel->id,
            'group_id'   => $duel->group_id,
            'status'     => $duel->status,
            'movie_a'    => $this->formatMovie($duel->movieA),
            'movie_b'    => $this->formatMovie($duel->movieB),
            'votes'      => $duel->votes->map(fn($v) => [
                'user'     => $this->formatUser($v->user),
                'movie_id' => $v->movie_id,
            ])->values(),
            'winner_id'  => $duel->winner_id,
            'created_by' => $duel->created_by,
            'created_at' => $duel->created_at,
        ];
    }

    private function formatMovie($movie): array
    {
        return [
            'id'                 => $movie->id,
            'group_id'           => $movie->group_id,
            'title'              => $movie->title,
            'duration_minutes'   => $movie->duration_minutes,
            'duration_formatted' => $movie->duration_formatted,
            'platform'           => $movie->platform,
            'genre'              => $movie->genre,
            'poster_path'        => $movie->poster_path,
            'tmdb_id'            => $movie->tmdb_id,
            'status'             => $movie->status,
            'notes'              => $movie->notes,
            'added_by'           => $movie->addedBy ? $this->formatUser($movie->addedBy) : null,
            'created_at'         => $movie->created_at,
        ];
    }

    private function formatUser($user): array
    {
        return [
            'id'     => $user->id,
            'name'   => $user->name,
            'avatar' => $user->avatar,
            'color'  => $user->color,
            'email'  => $user->email,
        ];
    }

    private function findGroupForUser($user, string $id): Group
    {
        return $user->groups()->findOrFail($id);
    }

    private function requireAdmin($user, Group $group): void
    {
        $pivot = $group->members()->where('user_id', $user->id)->first()?->pivot;
        abort_if(!$pivot || $pivot->role !== 'admin', 403, 'Solo los administradores pueden realizar esta acción.');
    }
}
