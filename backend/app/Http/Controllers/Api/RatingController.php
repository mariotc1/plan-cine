<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RatingRequest;
use App\Http\Resources\RatingResource;
use App\Models\CinemaSession;
use App\Models\Rating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RatingController extends Controller
{
    public function store(RatingRequest $request, string $sessionId): JsonResponse
    {
        $session = CinemaSession::with('group')->findOrFail($sessionId);

        // Ensure user is a participant of this session
        abort_unless(
            $session->participants()->where('user_id', $request->user()->id)->exists(),
            403,
            'No participaste en esta sesión.'
        );

        $rating = Rating::updateOrCreate(
            ['session_id' => $sessionId, 'user_id' => $request->user()->id],
            ['score' => $request->score, 'id' => (string) Str::uuid()]
        );

        $rating->load('user');

        return response()->json([
            'data' => new RatingResource($rating),
            'message' => '¡Valoración guardada!',
        ]);
    }
}
