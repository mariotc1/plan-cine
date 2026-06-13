<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'movie' => $this->whenLoaded('movie', fn() => new MovieResource($this->movie)),
            'started_at' => $this->started_at,
            'estimated_end_at' => $this->estimated_end_at,
            'actual_end_at' => $this->actual_end_at,
            'status' => $this->status,
            'participants' => $this->whenLoaded('participants', fn() => UserResource::collection($this->participants)),
            'ratings' => $this->whenLoaded('ratings', fn() => RatingResource::collection($this->ratings)),
            'average_rating' => $this->when(
                $this->relationLoaded('ratings'),
                fn() => $this->ratings->isNotEmpty() ? round($this->ratings->avg('score'), 1) : null
            ),
            'created_at' => $this->created_at,
        ];
    }
}
