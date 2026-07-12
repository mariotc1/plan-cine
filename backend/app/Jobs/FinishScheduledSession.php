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

class FinishScheduledSession implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public string $sessionId) {}

    public function handle(PushNotificationService $push): void
    {
        $session = CinemaSession::with(['movie', 'participants', 'ratings'])->find($this->sessionId);

        if (!$session || $session->status !== 'in_progress') {
            return;
        }

        $session->update([
            'status'                   => 'finished',
            'actual_end_at'            => Carbon::now(),
            'rating_notification_sent' => true,
        ]);

        if ($session->movie) {
            $session->movie->update(['status' => 'watched']);
        }

        try {
            $push->notifyRatingReminder($session);
        } catch (\Throwable $e) {
            \Log::warning('Push failed on auto-finish for session ' . $this->sessionId . ': ' . $e->getMessage());
        }
    }
}
