<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'push:generate-vapid';
    protected $description = 'Generate VAPID public/private key pair for web push notifications';

    public function handle(): void
    {
        $keys = VAPID::createVapidKeys();

        $this->newLine();
        $this->info('✓ VAPID keys generated. Add these to your .env and .env.docker:');
        $this->newLine();
        $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
        $this->newLine();
        $this->comment('Frontend (.env.local):');
        $this->line('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' . $keys['publicKey']);
        $this->newLine();
    }
}
