<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create or Update Admin user: admin@iknow.com.tr
        User::updateOrCreate(
            ['email' => 'admin@iknow.com.tr'],
            [
                'full_name' => 'Oğuzhan Bahadır',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'department' => 'Yönetim / IK',
                'phone' => '+90 532 100 2030',
                'avatar' => 'https://ui-avatars.com/api/?name=Oguzhan+Bahadir&background=3F3C67&color=fff',
            ]
        );

        // Create or Update Admin user: admin@iknow.com
        User::updateOrCreate(
            ['email' => 'admin@iknow.com'],
            [
                'full_name' => 'Oğuzhan Bahadır',
                'password' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'department' => 'Yönetim / IK',
                'phone' => '+90 532 100 2030',
                'avatar' => 'https://ui-avatars.com/api/?name=Oguzhan+Bahadir&background=3F3C67&color=fff',
            ]
        );

        $this->command->info('✅ Admin kullanıcıları (admin@iknow.com.tr & admin@iknow.com / admin123) kaydedildi.');
    }
}
