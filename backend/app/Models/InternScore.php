<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InternScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'evaluator_id',
        'tech_score',
        'soft_skill_score',
        'punctuality_score',
        'overall_score',
        'feedback_note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
