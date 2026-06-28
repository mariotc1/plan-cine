<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMovieRequest;
use App\Http\Requests\UpdateMovieRequest;
use App\Http\Resources\MovieResource;
use App\Models\Group;
use App\Models\Movie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    public function index(Request $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $query = $group->movies()->with('addedBy');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('platform')) {
            $query->where('platform', $request->platform);
        }
        if ($request->has('genre')) {
            $query->where('genre', $request->genre);
        }
        if ($request->has('max_duration')) {
            $query->where('duration_minutes', '<=', (int) $request->max_duration);
        }

        $movies = $query->latest()->get();

        return response()->json(['data' => MovieResource::collection($movies)]);
    }

    public function store(CreateMovieRequest $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $movie = $group->movies()->create([
            'title' => $request->title,
            'duration_minutes' => $request->duration_minutes,
            'platform' => $request->platform,
            'genre' => $request->genre,
            'added_by' => $request->user()->id,
            'notes' => $request->notes,
            'status' => 'pending',
            'tmdb_id' => $request->tmdb_id,
            'poster_path' => $request->poster_path,
        ]);

        $movie->load('addedBy');

        return response()->json(['data' => new MovieResource($movie), 'message' => 'Película añadida correctamente.'], 201);
    }

    public function show(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $movie = $group->movies()->with('addedBy')->findOrFail($id);

        return response()->json(['data' => new MovieResource($movie)]);
    }

    public function update(UpdateMovieRequest $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $movie = $group->movies()->findOrFail($id);

        $movie->update($request->only([
            'title', 'duration_minutes', 'platform', 'genre', 'notes', 'tmdb_id', 'poster_path',
        ]));

        $movie->load('addedBy');

        return response()->json(['data' => new MovieResource($movie), 'message' => 'Película actualizada.']);
    }

    public function destroy(Request $request, string $groupId, string $id): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);
        $movie = $group->movies()->findOrFail($id);
        $movie->delete();

        return response()->json(['message' => 'Película eliminada.']);
    }

    public function random(Request $request, string $groupId): JsonResponse
    {
        $group = $this->findGroupForUser($request->user(), $groupId);

        $movie = $group->movies()
            ->with('addedBy')
            ->where('status', 'pending')
            ->inRandomOrder()
            ->first();

        if (!$movie) {
            return response()->json(['message' => 'No hay películas pendientes.'], 404);
        }

        return response()->json(['data' => new MovieResource($movie)]);
    }

    private function findGroupForUser($user, string $id): Group
    {
        return $user->groups()->findOrFail($id);
    }
}
