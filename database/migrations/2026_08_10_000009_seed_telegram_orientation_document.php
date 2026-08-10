<?php

use App\Models\OrientationDocument;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $adminUser = User::where('role', 'ADMIN')->first();
        $adminId = $adminUser ? $adminUser->id : 1;

        $content = <<<MARKDOWN
# 🤖 IKnowTech (@iknowtech_bot) Telegram Bot Rehberi

iKnow PDKS sistemine hoş geldiniz! Şirket içi görev takibinizi kolaylaştırmak ve üzerinize atanan yeni işlerden anında haberdar olabilmeniz için **IKnowTech Telegram Botu** kullanıma sunulmuştur.

---

## 📌 1. Telegram Botuna Katılma ve İlk Kurulum

1. Telegram uygulamanızın arama alanına **`@iknowtech_bot`** yazın veya aratın.
2. Bot sohbet ekranına girdikten sonra alt taraftaki **"Başlat"** düğmesine tıklayın veya mesaj kısmına **`/start`** yazarak gönderin.
3. Bot sizden sırasıyla aşağıdaki adımları izlemenizi isteyecektir:
   - **Adım A (E-Posta Doğrulama):** PDKS sistemine kayıtlı e-posta adresinizi (Örn: `personel@iknow.com`) yazıp gönderin.
   - **Adım B (Şifre Doğrulama):** E-postanız onaylandıktan sonra PDKS giriş şifrenizi yazıp gönderin.
4. Şifreniz doğrulandığında bot Telegram hesabınızı otomatik olarak PDKS profilinizle bağlayacaktır.

---

## 💡 2. Bot Üzerinde Kullanabileceğiniz Komutlar

Hesabınızı başarıyla bağladıktan sonra Telegram üzerinden şu komutları kullanabilirsiniz:

### 📋 `/tasks` veya `görevlerim`
- Üzerinize atanmış tüm **aktif görevleri** detaylarıyla birlikte listeler.
- Görevin başlığı, durumu (*Yapılacak, Devam Ediyor, İncelemede, Tamamlandı*), önceliği (*Düşük, Orta, Yüksek*) ve harcanan çalışma saatlerini anında gösterir.

### 👤 `/profile`
- PDKS sistemindeki ad soyad, e-posta, departman ve rol bilgilerinizi özetler.

### 🔒 `/logout` veya `çıkış`
- Telegram hesabınızın PDKS eşleştirmesini güvenli şekilde sonlandırır.

---

## 🔔 3. Anlık Otomatik Bildirimler

IKnowTech botuna bağlandığınızda aşağıdaki durumlarda cebinize anlık bildirim düşecektir:
- **Yeni Görev Atandığında:** Yöneticiniz veya ekip arkadaşınız size yeni bir görev tanımladığında, görevin detayları Telegram bildirimi olarak iletilir.
- **Görev Statüsü Değiştiğinde:** Üzerinizdeki bir görevin durumu başkası tarafından güncellendiğinde bilgi mesajı alırsınız.

> **Not:** Kendi oluşturduğunuz veya kendi değiştirdiğiniz görevlerde gereksiz bildirim kirliliği olmaması için mesaj gönderilmez; yalnızca başkası sizin görevinizde değişiklik yaptığında bilgilendirilirsiniz.
MARKDOWN;

        OrientationDocument::updateOrCreate(
            ['title' => 'IKnowTech (@iknowtech_bot) Telegram Bot Kullanım Rehberi'],
            [
                'description' => 'IKnowTech Telegram botu üzerinden PDKS hesabınızı eşleştirme, görev takibi ve anlık bildirim alma rehberi.',
                'content' => $content,
                'category' => 'Araçlar & Entegrasyonlar',
                'created_by_id' => $adminId,
                'is_public' => true,
                'assigned_user_ids' => [],
            ]
        );
    }

    public function down(): void
    {
        OrientationDocument::where('title', 'IKnowTech (@iknowtech_bot) Telegram Bot Kullanım Rehberi')->delete();
    }
};
