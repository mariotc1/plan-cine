<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RatingRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'score' => 'sometimes|integer|between:1,5',
            'comment' => 'sometimes|nullable|string|max:280',
        ];
    }
}
