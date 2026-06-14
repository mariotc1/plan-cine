<?php

namespace App\Services;

use App\Models\CinemaSession;
use App\Models\PushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Throwable;

class PushNotificationService
{
    public function notifySessionFinished(CinemaSession $session): void
    {
        $publicKey  = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');
        if (!$publicKey || !$privateKey) return;

        $session->loadMissing(['movie', 'participants']);

        $participantIds = $session->participants->pluck('id');
        if ($participantIds->isEmpty()) return;

        $subs = PushSubscription::whereIn('user_id', $participantIds)->get();
        if ($subs->isEmpty()) return;

        $movieTitle = $session->movie?->title ?? 'la película';

        $webPush = new WebPush([
            'VAPID' => [
                'subject'    => 'mailto:' . config('mail.from.address', 'noreply@plancine.app'),
                'publicKey'  => $publicKey,
                'privateKey' => $privateKey,
            ],
        ]);

        $payload = json_encode([
            'title' => '¿Qué os ha parecido?',
            'body'  => "Puntúa \"{$movieTitle}\" — abre la app para valorarla",
            'url'   => "/groups/{$session->group_id}/sessions/{$session->id}",
            'icon'  => '/icon-192.png',
            'badge' => '/icon-192.png',
        ]);

        foreach ($subs as $sub) {
            try {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys'     => ['p256dh' => $sub->p256dh, 'auth' => $sub->auth],
                ]);
                $webPush->queueNotification($subscription, $payload);
            } catch (Throwable) {
                // Malformed subscription
                $sub->delete();
            }
        }

        foreach ($webPush->flush() as $report) {
            if (!$report->isSuccess()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }
}
