<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CvFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_name',
        'file_url',
        'file_size',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
