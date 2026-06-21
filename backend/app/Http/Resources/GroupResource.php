<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar ?? '🎬',
            'description' => $this->description,
            'invitation_code' => $this->invitation_code,
            'created_by' => $this->created_by,
            'member_count' => $this->members_count ?? $this->members()->count(),
            'created_at' => $this->created_at,
        ];
    }
}
