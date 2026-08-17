<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            if (!Schema::hasColumn('project_members', 'member_role')) {
                $table->string('member_role')->default('MEMBER')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_members', function (Blueprint $table) {
            if (Schema::hasColumn('project_members', 'member_role')) {
                $table->dropColumn('member_role');
            }
        });
    }
};
