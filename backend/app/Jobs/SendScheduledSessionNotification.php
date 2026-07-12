<?php

namespace App\Jobs;

use App\Models\CinemaSession;
use App\Services\PushNotificationService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendScheduledSessionNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $sessionId) {}

    public function handle(PushNotificationService $push): void
    {
        $session = CinemaSession::with(['movie', 'participants'])->find($this->sessionId);

        if (!$session || $session->status !== 'scheduled') {
            return;
        }

        // Guard against stale jobs after a reschedule: if scheduled_at is more than
        // 10 minutes away from now, a newer job will handle it — skip this one.
        if ($session->scheduled_at && $session->scheduled_at->diffInMinutes(Carbon::now(), true) > 10) {
            return;
        }

        $startedAt    = Carbon::now();
        $estimatedEnd = $session->movie
            ? $startedAt->copy()->addMinutes($session->movie->duration_minutes)
            : null;

        $session->update([
            'status'           => 'in_progress',
            'started_at'       => $startedAt,
            'estimated_end_at' => $estimatedEnd,
        ]);

        if ($estimatedEnd && config('queue.default') !== 'sync') {
            FinishScheduledSession::dispatch($session->id)->delay($estimatedEnd);
        }

        try {
            $push->notifyScheduledSession($session);
        } catch (\Throwable $e) {
            \Log::warning('Push failed for scheduled session ' . $this->sessionId . ': ' . $e->getMessage());
        }
    }
}
