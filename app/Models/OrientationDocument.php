<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrientationDocument extends Model
{
    use HasFactory;

    protected $table = 'orientation_documents';

    protected $fillable = [
        'title',
        'description',
        'content',
        'category',
        'created_by_id',
        'is_public',
        'assigned_user_ids',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'assigned_user_ids' => 'array',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }
}
