<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MovieResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'title' => $this->title,
            'duration_minutes' => $this->duration_minutes,
            'duration_formatted' => $this->duration_formatted,
            'platform' => $this->platform,
            'genre' => $this->genre,
            'added_by' => $this->whenLoaded('addedBy', fn() => new UserResource($this->addedBy)),
            'notes' => $this->notes,
            'status' => $this->status,
            'tmdb_id' => $this->tmdb_id,
            'poster_path' => $this->poster_path,
            'created_at' => $this->created_at,
        ];
    }
}
