<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isCompanyAdmin = $user instanceof \App\Models\Admin || in_array($user->role, ['admin', 'superadmin']);

        if ($isCompanyAdmin) {
            $userClass = $user instanceof \App\Models\Admin ? \App\Models\Admin::class : \App\Models\User::class;
            return [
                'company_name' => ['required', 'string', 'max:255'],
                'name' => ['nullable', 'string', 'max:255'],
                'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique($userClass)->ignore($user->id)],
                'mobile' => ['required', 'string', 'max:25'],
                'address' => ['required', 'string', 'max:500'],
                'gst_no' => ['nullable', 'string', 'max:50'],
                'thumb' => ['nullable', 'image', 'max:2048'], // 2MB max
            ];
        }

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['required', 'date'],
            'blood_group' => ['nullable', 'string', 'max:10'],
            'mobile' => ['required', 'string', 'max:20'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'address' => ['required', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_number' => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'thumb' => ['nullable', 'image', 'max:2048'], // 2MB max
        ];
    }
}
