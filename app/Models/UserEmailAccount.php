<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserEmailAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email_address',
        'display_name',
        'imap_host',
        'imap_port',
        'imap_encryption',
        'smtp_host',
        'smtp_port',
        'smtp_encryption',
        'username',
        'password',
        'is_active',
        'last_synced_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'password' => 'encrypted',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
        'imap_port' => 'integer',
        'smtp_port' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
