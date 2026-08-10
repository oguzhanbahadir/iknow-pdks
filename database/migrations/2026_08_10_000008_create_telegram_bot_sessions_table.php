<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_bot_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('chat_id')->unique();
            $table->string('step'); // WAITING_EMAIL, WAITING_PASSWORD
            $table->string('pending_email')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_bot_sessions');
    }
};
