<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateSessionRequest;
use App\Http\Resources\SessionResource;
use App\Jobs\FinishScheduledSession;
use App\Jobs\SendScheduledSessionNotification;
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

        $scheduledAt = $request->scheduled_at ? Carbon::parse($request->scheduled_at) : null;
        $status = $scheduledAt ? 'scheduled' : 'pending';

        $session = $group->sessions()->create([
            'movie_id' => $movie->id,
            'status' => $status,
            'scheduled_at' => $scheduledAt,
            'created_by' => $request->user()->id,
        ]);

        $session->participants()->attach($request->participant_ids);

        $movie->update(['status' => 'in_session']);

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        if ($scheduledAt && config('queue.default') !== 'sync') {
            SendScheduledSessionNotification::dispatch($session->id)->delay($scheduledAt);
        }

        $message = $scheduledAt
            ? 'Sesión programada para el ' . $scheduledAt->format('d/m/Y \a \l\a\s H:i') . '.'
            : 'Sesión creada.';

        return response()->json(['data' => new SessionResource($session), 'message' => $message], 201);
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

        abort_if(!in_array($session->status, ['pending', 'scheduled']), 422, 'La sesión no se puede iniciar.');

        $startedAt    = Carbon::now();
        $durationMins = $session->movie?->duration_minutes ?? 0;
        $estimatedEnd = $durationMins > 0
            ? $startedAt->copy()->addMinutes($durationMins)
            : null;

        $session->update([
            'status'           => 'in_progress',
            'started_at'       => $startedAt,
            'estimated_end_at' => $estimatedEnd,
        ]);

        // Dispatch auto-finish job so the session ends automatically after the movie duration
        if ($estimatedEnd && config('queue.default') !== 'sync') {
            FinishScheduledSession::dispatch($session->id)->delay($estimatedEnd);
        }

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

    public function reschedule(Request $request, string $groupId, string $id): JsonResponse
    {
        $request->validate([
            'scheduled_at'      => 'required|date',
            'participant_ids'   => 'sometimes|array',
            'participant_ids.*' => 'exists:users,id',
        ]);

        $group   = $this->findGroupForUser($request->user(), $groupId);
        $session = $group->sessions()->with(['movie', 'participants'])->findOrFail($id);

        abort_if($session->status !== 'scheduled', 422, 'Solo se pueden reprogramar sesiones programadas.');

        $newScheduledAt = Carbon::parse($request->scheduled_at);
        $session->update(['scheduled_at' => $newScheduledAt]);

        if ($request->has('participant_ids')) {
            $session->participants()->sync($request->participant_ids);
        }

        if (config('queue.default') !== 'sync') {
            SendScheduledSessionNotification::dispatch($session->id)->delay($newScheduledAt);
        }

        $session->load(['movie.addedBy', 'participants', 'ratings.user']);

        return response()->json([
            'data'    => new SessionResource($session),
            'message' => 'Sesión reprogramada para el ' . $newScheduledAt->format('d/m/Y \a \l\a\s H:i') . '.',
        ]);
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
