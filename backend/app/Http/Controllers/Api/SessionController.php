<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSessionRequest;
use App\Http\Resources\SessionResource;
use App\Models\CinemaSession;
use App\Models\Group;
use App\Services\PushNotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function index(Request $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $sessions = $group->sessions()
            ->with(['movie.addedBy', 'participants', 'ratings.user'])
            ->latest()
            ->get();

        return response()->json(['data' => SessionResource::collection($sessions)]);
    }

    public function store(CreateSessionRequest $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $movie = $group->movies()->findOrFail($request->movie_id);

        $session = $group->sessions()->create([
            'movie_id' => $movie->id,
            'status' => 'pending',
            'created_by' => $request->user()->id,
        ]);

        $participants = collect($request->participant_ids)->map(fn($uid) => [
            'id' => (string) Str::uuid(),
            'session_id' => $session->id,
            'user_id' => $uid,
        ])->toArray();

        $session->participants()->attach($request->participant_ids);

        $movie->update(['status' => 'in_session']);

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        return response()->json(['data' => new SessionResource($session), 'message' => 'Sesión creada.'], 201);
    }

    public function show(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $session = $group->sessions()
            ->with(['movie.addedBy', 'participants', 'ratings.user'])
            ->findOrFail($id);

        return response()->json(['data' => new SessionResource($session)]);
    }

    public function start(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $session = $group->sessions()->with(['movie', 'participants'])->findOrFail($id);

        abort_if($session->status !== 'pending', 422, 'La sesión no está en estado pendiente.');

        $startedAt = Carbon::now();
        $estimatedEnd = $startedAt->copy()->addMinutes($session->movie->duration_minutes);

        $session->update([
            'status' => 'in_progress',
            'started_at' => $startedAt,
            'estimated_end_at' => $estimatedEnd,
        ]);

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        return response()->json(['data' => new SessionResource($session), 'message' => '¡Que empiece el cine!']);
    }

    public function finish(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $session = $group->sessions()->with(['movie', 'participants'])->findOrFail($id);

        abort_if(!in_array($session->status, ['pending', 'in_progress']), 422, 'La sesión no se puede finalizar.');

        $session->update([
            'status'                   => 'finished',
            'actual_end_at'            => now(),
            'rating_notification_sent' => true,
        ]);

        if ($session->movie) {
            $session->movie->update(['status' => 'watched']);
        }

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        try {
            app(PushNotificationService::class)->notifyRatingReminder($session);
        } catch (\Throwable $e) {
            \Log::warning('Push failed on manual finish: ' . $e->getMessage());
        }

        return response()->json(['data' => new SessionResource($session), 'message' => '¡Película finalizada! ¿Qué os ha parecido?']);
    }

    public function cancel(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $session = $group->sessions()->with('movie')->findOrFail($id);

        $session->update(['status' => 'cancelled']);

        if ($session->movie) {
            $session->movie->update(['status' => 'pending']);
        }

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        return response()->json(['data' => new SessionResource($session), 'message' => 'Sesión cancelada.']);
    }

    public function returnToPending(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $session = $group->sessions()->with('movie')->findOrFail($id);

        $session->update(['status' => 'cancelled']);

        if ($session->movie) {
            $session->movie->update(['status' => 'pending']);
        }

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        return response()->json(['data' => new SessionResource($session), 'message' => 'Película devuelta a pendientes.']);
    }

    private function findGroupForUser($user, string $id): Group
    {
        return $user->groups()->findOrFail($id);
    }
}
