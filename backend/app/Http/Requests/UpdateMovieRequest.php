<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMovieRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $platforms = ['netflix', 'prime', 'disney', 'hbo', 'movistar', 'apple', 'other'];
        $genres = ['action', 'comedy', 'drama', 'thriller', 'horror', 'sci-fi', 'romance', 'animation', 'documentary', 'other'];

        return [
            'title' => 'sometimes|string|max:255',
            'duration_minutes' => 'sometimes|integer|min:1|max:600',
            'platform' => ['sometimes', 'string', Rule::in($platforms)],
            'genre' => ['sometimes', 'string', Rule::in($genres)],
            'notes' => 'nullable|string|max:1000',
        ];
    }
}
