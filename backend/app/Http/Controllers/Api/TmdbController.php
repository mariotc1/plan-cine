<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TmdbController extends Controller
{
    private const BASE = 'https://api.themoviedb.org/3';

    private array $genreMap = [
        28    => 'action',
        12    => 'action',
        35    => 'comedy',
        18    => 'drama',
        53    => 'thriller',
        80    => 'thriller',
        9648  => 'thriller',
        27    => 'horror',
        878   => 'sci-fi',
        14    => 'sci-fi',
        10749 => 'romance',
        16    => 'animation',
        99    => 'documentary',
        36    => 'drama',
        10402 => 'other',
        37    => 'other',
        10751 => 'other',
    ];

    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('query', ''));

        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $key = env('TMDB_API_KEY');
        if (!$key) {
            return response()->json(['results' => []]);
        }

        $results = Cache::remember('tmdb_s_' . md5($query), 86400, function () use ($query, $key) {
            $response = Http::timeout(8)->get(self::BASE . '/search/movie', [
                'api_key'        => $key,
                'query'          => $query,
                'language'       => 'es-ES',
                'page'           => 1,
                'include_adult'  => false,
            ]);

            if (!$response->successful()) {
                return [];
            }

            return collect($response->json('results', []))
                ->filter(fn($m) => !empty($m['title']))
                ->take(7)
                ->map(fn($m) => [
                    'tmdb_id'     => $m['id'],
                    'title'       => $m['title'],
                    'year'        => isset($m['release_date']) && strlen($m['release_date']) >= 4
                        ? substr($m['release_date'], 0, 4)
                        : null,
                    'poster_path' => $m['poster_path'] ?? null,
                ])
                ->values()
                ->toArray();
        });

        return response()->json(['results' => $results]);
    }

    public function enrich(Request $request, string $groupId): JsonResponse
    {
        $group = $request->user()->groups()->findOrFail($groupId);
        $key   = env('TMDB_API_KEY');

        if (!$key) {
            return response()->json(['error' => 'TMDB not configured'], 503);
        }

        $movies  = $group->movies()->whereNull('tmdb_id')->get();
        $updated = 0;

        foreach ($movies as $movie) {
            $response = Http::timeout(8)->get(self::BASE . '/search/movie', [
                'api_key'       => $key,
                'query'         => $movie->title,
                'language'      => 'es-ES',
                'page'          => 1,
                'include_adult' => false,
            ]);

            if (!$response->successful()) {
                continue;
            }

            $results = $response->json('results', []);
            if (empty($results)) {
                continue;
            }

            $first = $results[0];
            $movie->update([
                'tmdb_id'     => $first['id'],
                'poster_path' => $first['poster_path'] ?? null,
            ]);
            $updated++;
        }

        return response()->json([
            'updated' => $updated,
            'total'   => $movies->count(),
        ]);
    }

    public function movie(Request $request, int $id): JsonResponse
    {
        $key = env('TMDB_API_KEY');
        if (!$key) {
            return response()->json(['error' => 'Not configured'], 503);
        }

        $genreMap = $this->genreMap;

        $data = Cache::remember('tmdb_m_' . $id, 604800, function () use ($id, $key, $genreMap) {
            $response = Http::timeout(8)->get(self::BASE . '/movie/' . $id, [
                'api_key'  => $key,
                'language' => 'es-ES',
            ]);

            if (!$response->successful()) {
                return null;
            }

            $m       = $response->json();
            $genreId = $m['genres'][0]['id'] ?? null;

            return [
                'tmdb_id'     => $m['id'],
                'title'       => $m['title'],
                'year'        => isset($m['release_date']) && strlen($m['release_date']) >= 4
                    ? substr($m['release_date'], 0, 4)
                    : null,
                'runtime'     => isset($m['runtime']) && $m['runtime'] > 0 ? $m['runtime'] : null,
                'genre'       => $genreId ? ($genreMap[$genreId] ?? 'other') : 'other',
                'poster_path' => $m['poster_path'] ?? null,
            ];
        });

        if (!$data) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($data);
    }
}
