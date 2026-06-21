<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGroupRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:100',
            'avatar'      => 'sometimes|string|max:20',
            'description' => 'nullable|string|max:500',
        ];
    }
}
