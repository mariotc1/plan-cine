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

        $existing = Rating::where('session_id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->first();

        abort_if(
            !$existing && !$request->filled('score'),
            422,
            'Debes valorar con estrellas antes de comentar.'
        );

        $data = [];
        if ($request->filled('score')) {
            $data['score'] = $request->score;
        }
        if ($request->has('comment')) {
            $data['comment'] = $request->comment;
        }

        $rating = Rating::updateOrCreate(
            ['session_id' => $sessionId, 'user_id' => $request->user()->id],
            $data + ($existing ? [] : ['id' => (string) Str::uuid()])
        );

        $rating->load('user');

        return response()->json([
            'data' => new RatingResource($rating),
            'message' => '¡Valoración guardada!',
        ]);
    }

    public function destroyComment(Request $request, string $sessionId): JsonResponse
    {
        $rating = Rating::where('session_id', $sessionId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $rating->update(['comment' => null]);
        $rating->load('user');

        return response()->json([
            'data' => new RatingResource($rating),
            'message' => 'Comentario eliminado.',
        ]);
    }
}
