<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'start_date')) {
                $table->timestamp('start_date')->nullable()->after('task_date');
            }
            if (!Schema::hasColumn('tasks', 'due_date')) {
                $table->timestamp('due_date')->nullable()->after('start_date');
            }
        });

        if (!Schema::hasTable('project_logs')) {
            Schema::create('project_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('cascade');
                $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('action'); // e.g. TASK_CREATED, TASK_STATUS_CHANGED, TASK_UPDATED, TASK_ASSIGNED, TASK_DELETED, COMMENT_ADDED, PROJECT_UPDATED, etc.
                $table->string('title');
                $table->json('details')->nullable();
                $table->string('ip_address')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('project_logs');
        Schema::table('tasks', function (Blueprint $table) {
            if (Schema::hasColumn('tasks', 'due_date')) {
                $table->dropColumn('due_date');
            }
            if (Schema::hasColumn('tasks', 'start_date')) {
                $table->dropColumn('start_date');
            }
        });
    }
};
