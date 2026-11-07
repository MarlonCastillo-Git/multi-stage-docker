<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('product')?->getKey() ?? $this->route('product');

        return ['name' => ['sometimes', 'required', 'string', 'max:150'], 'slug' => ['sometimes', 'required', 'alpha_dash', 'max:160', 'unique:products,slug,'.$id], 'description' => ['nullable', 'string', 'max:5000'], 'price' => ['sometimes', 'required', 'decimal:0,2', 'gt:0'], 'stock' => ['sometimes', 'required', 'integer', 'min:0'], 'is_active' => ['sometimes', 'boolean']];
    }
}
