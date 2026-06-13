<?php

namespace Database\Seeders;

use App\Models\CinemaSession;
use App\Models\Group;
use App\Models\Movie;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $mario = User::create([
            'name' => 'Mario',
            'email' => 'mario@plancine.app',
            'password' => Hash::make('password'),
            'avatar' => '🦁',
            'color' => '#6366f1',
        ]);

        $papa = User::create([
            'name' => 'Papá',
            'email' => 'papa@plancine.app',
            'password' => Hash::make('password'),
            'avatar' => '🐺',
            'color' => '#3b82f6',
        ]);

        $mama = User::create([
            'name' => 'Mamá',
            'email' => 'mama@plancine.app',
            'password' => Hash::make('password'),
            'avatar' => '🦊',
            'color' => '#ec4899',
        ]);

        $group = Group::create([
            'name' => 'Familia Tibus',
            'description' => 'Las noches de cine en familia 🎬',
            'invitation_code' => 'TIBUS001',
            'created_by' => $mario->id,
        ]);

        $group->members()->attach($mario->id, ['id' => (string) Str::uuid(), 'role' => 'admin', 'joined_at' => now()]);
        $group->members()->attach($papa->id, ['id' => (string) Str::uuid(), 'role' => 'member', 'joined_at' => now()]);
        $group->members()->attach($mama->id, ['id' => (string) Str::uuid(), 'role' => 'member', 'joined_at' => now()]);

        $moviesData = [
            ['title' => 'Dune: Parte Dos', 'duration_minutes' => 166, 'platform' => 'hbo', 'genre' => 'sci-fi', 'added_by' => $mario->id, 'status' => 'watched'],
            ['title' => 'Oppenheimer', 'duration_minutes' => 180, 'platform' => 'prime', 'genre' => 'drama', 'added_by' => $papa->id, 'status' => 'pending'],
            ['title' => 'Interstellar', 'duration_minutes' => 169, 'platform' => 'netflix', 'genre' => 'sci-fi', 'added_by' => $mario->id, 'status' => 'pending'],
            ['title' => 'Parasite', 'duration_minutes' => 132, 'platform' => 'movistar', 'genre' => 'thriller', 'added_by' => $papa->id, 'status' => 'pending'],
            ['title' => 'La La Land', 'duration_minutes' => 128, 'platform' => 'disney', 'genre' => 'romance', 'added_by' => $mama->id, 'status' => 'pending'],
            ['title' => 'Everything Everywhere All at Once', 'duration_minutes' => 139, 'platform' => 'prime', 'genre' => 'comedy', 'added_by' => $mario->id, 'status' => 'pending'],
            ['title' => 'Barbie', 'duration_minutes' => 114, 'platform' => 'hbo', 'genre' => 'comedy', 'added_by' => $mama->id, 'status' => 'pending'],
        ];

        $createdMovies = [];
        foreach ($moviesData as $movieData) {
            $createdMovies[] = $group->movies()->create($movieData);
        }

        $session = $group->sessions()->create([
            'movie_id' => $createdMovies[0]->id,
            'started_at' => now()->subDays(7)->setTime(20, 30),
            'estimated_end_at' => now()->subDays(7)->setTime(23, 16),
            'actual_end_at' => now()->subDays(7)->setTime(23, 20),
            'status' => 'finished',
            'created_by' => $mario->id,
        ]);

        $session->participants()->attach([$mario->id, $papa->id, $mama->id]);

        Rating::create(['session_id' => $session->id, 'user_id' => $mario->id, 'score' => 5]);
        Rating::create(['session_id' => $session->id, 'user_id' => $papa->id, 'score' => 4]);
        Rating::create(['session_id' => $session->id, 'user_id' => $mama->id, 'score' => 5]);
    }
}
