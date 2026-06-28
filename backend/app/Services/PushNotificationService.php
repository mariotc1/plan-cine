<?php

namespace App\Services;

use App\Models\CinemaSession;
use App\Models\Group;
use App\Models\Movie;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Throwable;

class PushNotificationService
{
    private function webPush(): ?WebPush
    {
        $publicKey  = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');

        if (!$publicKey || !$privateKey) {
            Log::warning('PushNotificationService: VAPID keys not configured');
            return null;
        }

        return new WebPush([
            'VAPID' => [
                'subject'    => 'mailto:' . config('mail.from.address', 'noreply@plancine.app'),
                'publicKey'  => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);
    }

    private function send(array $userIds, array $payload): void
    {
        if (empty($userIds)) return;

        $webPush = $this->webPush();
        if (!$webPush) return;

        $subs = PushSubscription::whereIn('user_id', $userIds)->get();
        if ($subs->isEmpty()) {
            Log::info('PushNotificationService: no subscriptions found for users', ['user_ids' => $userIds]);
            return;
        }

        $encoded = json_encode(array_merge($payload, [
            'icon'  => $payload['icon']  ?? '/icon-192.png',
            'badge' => $payload['badge'] ?? '/icon-192.png',
        ]));

        foreach ($subs as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys'     => ['p256dh' => $sub->p256dh, 'auth' => $sub->auth],
                ]);
                $webPush->queueNotification($subscription, $encoded);
            } catch (Throwable $e) {
                Log::warning('PushNotificationService: malformed subscription removed', ['id' => $sub->id, 'error' => $e->getMessage()]);
                $sub->delete();
            }
        }

        try {
            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    Log::info('PushNotificationService: sent ok', ['endpoint' => substr($report->getEndpoint(), 0, 40)]);
                } else {
                    Log::warning('PushNotificationService: delivery failed', [
                        'endpoint' => substr($report->getEndpoint(), 0, 40),
                        'reason'   => $report->getReason(),
                    ]);
                    PushSubscription::where('endpoint', $report->getEndpoint())->delete();
                }
            }
        } catch (Throwable $e) {
            Log::error('PushNotificationService: flush error', ['error' => $e->getMessage()]);
        }
    }

    private function frontendUrl(): string
    {
        return rtrim(env('FRONTEND_URL', 'https://plan-cine.vercel.app'), '/');
    }

    // ─── Rating reminder ─────────────────────────────────────────────────────

    public function notifyRatingReminder(CinemaSession $session): void
    {
        $session->loadMissing(['movie', 'participants', 'ratings']);

        $ratedUserIds = $session->ratings->pluck('user_id')->toArray();

        $pendingIds = $session->participants
            ->pluck('id')
            ->reject(fn($id) => in_array($id, $ratedUserIds))
            ->values()
            ->toArray();

        if (empty($pendingIds)) return;

        $movieTitle = $session->movie?->title ?? 'la película';
        $url = $this->frontendUrl() . "/groups/{$session->group_id}/sessions/{$session->id}";

        $this->send($pendingIds, [
            'title' => "¿Qué te ha parecido {$movieTitle}?",
            'body'  => 'Entra a dejar tu reseña ⭐',
            'url'   => $url,
        ]);
    }

    // ─── New member joined ────────────────────────────────────────────────────

    public function notifyMemberJoined(Group $group, User $newMember): void
    {
        $existingIds = $group->members()
            ->where('user_id', '!=', $newMember->id)
            ->pluck('users.id')
            ->toArray();

        if (empty($existingIds)) return;

        $memberCount = $group->members()->count();
        $url = $this->frontendUrl() . "/groups/{$group->id}/members";

        $this->send($existingIds, [
            'title' => "{$newMember->avatar} {$newMember->name} se ha unido a {$group->name}",
            'body'  => "¡Ahora sois {$memberCount} en el grupo! 🎬",
            'url'   => $url,
        ]);
    }

    // ─── New movie added ──────────────────────────────────────────────────────

    public function notifyMovieAdded(Group $group, User $addedBy, Movie $movie): void
    {
        $otherIds = $group->members()
            ->where('user_id', '!=', $addedBy->id)
            ->pluck('users.id')
            ->toArray();

        if (empty($otherIds)) return;

        $url = $this->frontendUrl() . "/groups/{$group->id}";

        $this->send($otherIds, [
            'title' => "{$addedBy->avatar} {$addedBy->name} ha añadido {$movie->title}",
            'body'  => 'Entra a echar un vistazo a la lista 🍿',
            'url'   => $url,
        ]);
    }
}
