<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TelegramBotSession extends Model
{
    use HasFactory;

    protected $table = 'telegram_bot_sessions';

    protected $fillable = [
        'chat_id',
        'step',
        'pending_email',
    ];
}
