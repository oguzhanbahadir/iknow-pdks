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

        // Create Telegram Orientation Document
        $admin = User::where('role', 'ADMIN')->first();
        if ($admin) {
            \App\Models\OrientationDocument::updateOrCreate(
                ['title' => 'IKnowTech (@iknowtech_bot) Telegram Bot Kullanım Rehberi'],
                [
                    'description' => 'IKnowTech Telegram botu üzerinden PDKS hesabınızı eşleştirme, görev takibi ve anlık bildirim alma rehberi.',
                    'content' => "# 🤖 IKnowTech (@iknowtech_bot) Telegram Bot Rehberi\n\n" .
                        "iKnow PDKS sistemine hoş geldiniz! Şirket içi görev takibinizi kolaylaştırmak ve üzerinize atanan yeni işlerden anında haberdar olabilmeniz için **IKnowTech Telegram Botu** kullanıma sunulmuştur.\n\n" .
                        "---\n\n## 📌 1. Telegram Botuna Katılma ve İlk Kurulum\n\n" .
                        "1. Telegram uygulamanızın arama alanına **`@iknowtech_bot`** yazın veya aratın.\n" .
                        "2. Bot sohbet ekranına girdikten sonra mesaj kısmına **`/start`** yazarak gönderin.\n" .
                        "3. Bot sizden **E-Posta** ve **PDKS Giriş Şifrenizi** isteyecektir.\n" .
                        "4. Şifreniz doğrulandığında hesabınız bağlayacaktır.\n\n" .
                        "---\n\n## 💡 2. Komutlar\n\n" .
                        "• `/tasks` veya `görevlerim` - Üzerinize atanan görevleri listeleyin\n" .
                        "• `/profile` - Profil bilgilerinizi görün\n" .
                        "• `/logout` veya `çıkış` - Oturumu sonlandırın\n",
                    'category' => 'Araçlar & Entegrasyonlar',
                    'created_by_id' => $admin->id,
                    'is_public' => true,
                    'assigned_user_ids' => [],
                ]
            );
        }

        $this->command->info('✅ Admin kullanıcıları ve Telegram Oryantasyon Dokümanı kaydedildi.');
    }
}
