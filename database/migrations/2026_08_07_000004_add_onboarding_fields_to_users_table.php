<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_onboarded')->default(false);
            $table->string('primary_domain')->nullable();
            $table->json('known_skills')->nullable();
            $table->text('preferred_career_path')->nullable();
            $table->json('tools_used')->nullable();
            $table->string('experience_level')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_onboarded',
                'primary_domain',
                'known_skills',
                'preferred_career_path',
                'tools_used',
                'experience_level',
            ]);
        });
    }
};
