<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('needed_roles')->nullable(); // e.g. ["Frontend", "Backend", "DevOps"]
            $table->longText('documentation')->nullable();
            $table->string('repository_url')->nullable();
            $table->enum('status', ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'])->default('PLANNING');
            $table->foreignId('created_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
