<?php

namespace App\Console\Commands;

use App\Models\CinemaSession;
use App\Services\PushNotificationService;
use Illuminate\Console\Command;

class SendRatingReminders extends Command
{
    protected $signature = 'push:send-rating-reminders';
    protected $description = 'Auto-finish sessions past estimated end and send rating push notifications';

    public function handle(PushNotificationService $push): void
    {
        $sessions = CinemaSession::where('status', 'in_progress')
            ->where('estimated_end_at', '<=', now())
            ->where('rating_notification_sent', false)
            ->with(['movie', 'participants'])
            ->get();

        if ($sessions->isEmpty()) {
            return;
        }

        foreach ($sessions as $session) {
            // Auto-finish the session and mark notification as sent atomically
            $session->update([
                'status'                    => 'finished',
                'actual_end_at'             => now(),
                'rating_notification_sent'  => true,
            ]);

            if ($session->movie) {
                $session->movie->update(['status' => 'watched']);
            }

            try {
                $push->notifySessionFinished($session);
            } catch (\Throwable $e) {
                $this->warn("Push failed for session {$session->id}: {$e->getMessage()}");
            }

            $this->info("Session {$session->id} ({$session->movie?->title}) finished & notified.");
        }
    }
}
