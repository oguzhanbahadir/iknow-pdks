<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'needed_roles',
        'role_requirements',
        'documentation',
        'repository_url',
        'status',
        'created_by_id',
    ];

    protected $casts = [
        'needed_roles' => 'array',
        'role_requirements' => 'array',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function members()
    {
        return $this->hasMany(ProjectMember::class, 'project_id');
    }

    public function approvedMembers()
    {
        return $this->hasMany(ProjectMember::class, 'project_id')->where('status', 'APPROVED');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'project_id');
    }
}
