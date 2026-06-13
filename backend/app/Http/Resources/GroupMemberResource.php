<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => new UserResource($this),
            'role' => $this->pivot->role ?? 'member',
            'joined_at' => $this->pivot->joined_at ?? null,
        ];
    }
}
