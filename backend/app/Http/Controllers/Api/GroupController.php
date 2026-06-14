<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Http\Resources\GroupMemberResource;
use App\Http\Resources\GroupResource;
use App\Http\Resources\MovieResource;
use App\Models\Group;
use App\Models\Rating;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroupController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groups = $request->user()->groups()->withCount('members')->get();
        return response()->json(['data' => GroupResource::collection($groups)]);
    }

    public function store(CreateGroupRequest $request): JsonResponse
    {
        $group = Group::create([
            'name' => $request->name,
            'avatar' => $request->avatar ?? '🎬',
            'description' => $request->description,
            'invitation_code' => $this->generateUniqueCode(),
            'created_by' => $request->user()->id,
        ]);

        $group->members()->attach($request->user()->id, [
            'role' => 'admin',
            'joined_at' => now(),
        ]);

        $group->loadCount('members');

        return response()->json(['data' => new GroupResource($group), 'message' => 'Grupo creado correctamente.'], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $group->loadCount('members');
        return response()->json(['data' => new GroupResource($group)]);
    }

    public function update(UpdateGroupRequest $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $this->requireAdmin($request->user(), $group);

        $group->update($request->only(['name', 'avatar', 'description']));
        $group->loadCount('members');

        return response()->json(['data' => new GroupResource($group), 'message' => 'Grupo actualizado.']);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $this->requireAdmin($request->user(), $group);
        $group->delete();

        return response()->json(['message' => 'Grupo eliminado.']);
    }

    public function join(Request $request, string $code): JsonResponse
    {
        $group = Group::where('invitation_code', $code)->firstOrFail();

        if ($group->members()->where('user_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'Ya eres miembro de este grupo.'], 422);
        }

        $group->members()->attach($request->user()->id, [
            'role' => 'member',
            'joined_at' => now(),
        ]);

        $group->loadCount('members');

        return response()->json(['data' => new GroupResource($group), 'message' => "Te has unido a {$group->name}."], 200);
    }

    public function leave(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $pivot = $group->members()->where('user_id', $request->user()->id)->first()?->pivot;

        if ($pivot && $pivot->role === 'admin') {
            return response()->json(['message' => 'El administrador no puede salir del grupo. Elimínalo si ya no lo necesitas.'], 422);
        }

        $group->members()->detach($request->user()->id);

        return response()->json(['message' => 'Has salido del grupo.']);
    }

    public function kickMember(Request $request, string $id, string $userId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $this->requireAdmin($request->user(), $group);

        if ($userId === $request->user()->id) {
            return response()->json(['message' => 'No puedes expulsarte a ti mismo.'], 422);
        }

        if (!$group->members()->where('user_id', $userId)->exists()) {
            return response()->json(['message' => 'El usuario no es miembro de este grupo.'], 404);
        }

        $group->members()->detach($userId);

        return response()->json(['message' => 'Miembro expulsado del grupo.']);
    }

    public function members(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $members = $group->members()->get();

        return response()->json(['data' => GroupMemberResource::collection($members)]);
    }

    public function stats(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);

        $finishedSessions = $group->sessions()
            ->with(['movie', 'participants', 'ratings'])
            ->where('status', 'finished')
            ->get();

        $members = $group->members()->get();

        // Most proposer
        $movieCounts = $group->movies()->selectRaw('added_by, COUNT(*) as count')
            ->groupBy('added_by')->orderByDesc('count')->first();

        $mostProposer = null;
        if ($movieCounts) {
            $proposerUser = $members->firstWhere('id', $movieCounts->added_by);
            if ($proposerUser) {
                $mostProposer = ['user' => $proposerUser, 'count' => $movieCounts->count];
            }
        }

        // Rating stats per member
        $memberRatingStats = [];
        foreach ($members as $member) {
            $memberRatings = Rating::whereIn('session_id', $finishedSessions->pluck('id'))
                ->where('user_id', $member->id)->avg('score');
            if ($memberRatings !== null) {
                $memberRatingStats[] = ['user' => $member, 'avg_score' => round((float)$memberRatings, 1)];
            }
        }

        $mostDemanding = collect($memberRatingStats)->sortBy('avg_score')->first();
        $mostGenerous = collect($memberRatingStats)->sortByDesc('avg_score')->first();

        // Favorite platform
        $platformCounts = $finishedSessions->groupBy(fn($s) => $s->movie?->platform)->map->count();
        $favPlatform = $platformCounts->sortDesc()->keys()->first();

        // Favorite genre
        $genreCounts = $finishedSessions->groupBy(fn($s) => $s->movie?->genre)->map->count();
        $favGenre = $genreCounts->sortDesc()->keys()->first();

        // Best rated movie
        $bestRated = null;
        $bestAvg = 0;
        foreach ($finishedSessions as $session) {
            if ($session->ratings->isNotEmpty()) {
                $avg = $session->ratings->avg('score');
                if ($avg > $bestAvg && $session->movie) {
                    $bestAvg = $avg;
                    $bestRated = $session->movie;
                }
            }
        }

        // Total stats
        $totalWatched = $finishedSessions->count();
        $totalMinutes = $finishedSessions->sum(fn($s) => $s->movie?->duration_minutes ?? 0);

        // Top 10
        $movieRatings = [];
        foreach ($finishedSessions as $session) {
            if ($session->movie && $session->ratings->isNotEmpty()) {
                $movieId = $session->movie->id;
                if (!isset($movieRatings[$movieId])) {
                    $movieRatings[$movieId] = ['movie' => $session->movie, 'scores' => []];
                }
                foreach ($session->ratings as $r) {
                    $movieRatings[$movieId]['scores'][] = $r->score;
                }
            }
        }

        $top10 = collect($movieRatings)
            ->map(fn($m) => ['movie' => new MovieResource($m['movie']), 'avg_rating' => round(array_sum($m['scores']) / count($m['scores']), 1)])
            ->sortByDesc('avg_rating')
            ->take(10)
            ->values();

        return response()->json([
            'data' => [
                'most_proposer' => $mostProposer ? ['user' => $mostProposer['user'], 'count' => $mostProposer['count']] : null,
                'most_demanding' => $mostDemanding,
                'most_generous' => $mostGenerous,
                'favorite_platform' => $favPlatform,
                'favorite_genre' => $favGenre,
                'best_rated_movie' => $bestRated ? new MovieResource($bestRated) : null,
                'total_watched' => $totalWatched,
                'total_hours' => round($totalMinutes / 60, 1),
                'top_10' => $top10,
            ],
        ]);
    }

    public function memories(Request $request, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $id);
        $today = Carbon::today();
        $memories = [];

        foreach ([1, 2, 3] as $yearsAgo) {
            $targetDate = $today->copy()->subYears($yearsAgo);
            $sessions = $group->sessions()
                ->with(['movie', 'participants', 'ratings.user'])
                ->where('status', 'finished')
                ->whereMonth('actual_end_at', $targetDate->month)
                ->whereDay('actual_end_at', $targetDate->day)
                ->whereYear('actual_end_at', $targetDate->year)
                ->get();

            foreach ($sessions as $session) {
                if ($session->movie) {
                    $memories[] = [
                        'years_ago' => $yearsAgo,
                        'date' => $session->actual_end_at,
                        'movie' => new MovieResource($session->movie),
                        'participants' => $session->participants,
                        'ratings' => $session->ratings,
                        'average_rating' => $session->ratings->isNotEmpty()
                            ? round($session->ratings->avg('score'), 1) : null,
                    ];
                }
            }
        }

        return response()->json(['data' => $memories]);
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

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (Group::where('invitation_code', $code)->exists());

        return $code;
    }
}
