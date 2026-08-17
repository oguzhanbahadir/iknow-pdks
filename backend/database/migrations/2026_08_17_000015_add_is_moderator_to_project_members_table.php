<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            if (!Schema::hasColumn('project_members', 'is_moderator')) {
                $table->boolean('is_moderator')->default(false)->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            if (Schema::hasColumn('project_members', 'is_moderator')) {
                $table->dropColumn('is_moderator');
            }
        });
    }
};
