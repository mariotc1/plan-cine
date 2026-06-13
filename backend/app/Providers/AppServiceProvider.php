<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Tell Sanctum to use UUID for tokenable_id (our User model uses UUIDs)
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);
    }
}
