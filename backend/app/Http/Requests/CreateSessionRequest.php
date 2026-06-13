<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSessionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'movie_id' => 'required|string|exists:movies,id',
            'participant_ids' => 'required|array|min:1',
            'participant_ids.*' => 'string|exists:users,id',
        ];
    }
}
