<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateMovieRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $platforms = ['netflix', 'prime', 'disney', 'hbo', 'movistar', 'apple', 'other'];
        $genres = ['action', 'comedy', 'drama', 'thriller', 'horror', 'sci-fi', 'romance', 'animation', 'documentary', 'other'];

        return [
            'title' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'platform' => ['required', 'string', Rule::in($platforms)],
            'genre' => ['required', 'string', Rule::in($genres)],
            'notes' => 'nullable|string|max:1000',
            'tmdb_id' => 'nullable|integer',
            'poster_path' => 'nullable|string|max:255',
        ];
    }
}
