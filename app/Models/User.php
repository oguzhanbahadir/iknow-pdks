<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name',
        'email',
        'password',
        'role',
        'department',
        'phone',
        'avatar',
        'target_company',
        'company_integration_note',
        'is_onboarded',
        'primary_domain',
        'known_skills',
        'preferred_career_path',
        'tools_used',
        'experience_level',
        'telegram_chat_id',
        'telegram_username',
    ];

    protected $casts = [
        'is_onboarded' => 'boolean',
        'known_skills' => 'array',
        'tools_used' => 'array',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function scores()
    {
        return $this->hasMany(InternScore::class, 'user_id')->latest();
    }

    public function cvFiles()
    {
        return $this->hasMany(CvFile::class, 'user_id')->latest();
    }

    public function tasksAssigned()
    {
        return $this->hasMany(Task::class, 'assigned_user_id')->latest();
    }
}
