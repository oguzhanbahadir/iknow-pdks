<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    protected ?string $botToken;

    public function __construct()
    {
        $this->botToken = config('services.telegram.bot_token');
    }

    /**
     * Send raw message via Telegram API
     */
    public function sendMessage(string $chatId, string $text, string $parseMode = 'Markdown'): bool
    {
        if (empty($this->botToken)) {
            Log::warning('Telegram bot token missing in configuration.');
            return false;
        }

        try {
            $response = Http::post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => $parseMode,
            ]);

            if (!$response->successful()) {
                Log::error('Telegram API error:', ['body' => $response->body()]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send Telegram message: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Fetch updates (for polling)
     */
    public function getUpdates(int $offset = 0, int $timeout = 30): array
    {
        if (empty($this->botToken)) {
            return [];
        }

        try {
            $response = Http::get("https://api.telegram.org/bot{$this->botToken}/getUpdates", [
                'offset' => $offset,
                'timeout' => $timeout,
            ]);

            if ($response->successful()) {
                return $response->json('result') ?? [];
            }
        } catch (\Exception $e) {
            Log::error('Telegram getUpdates failed: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Process an incoming update from Webhook or Polling
     */
    public function handleUpdate(array $update): void
    {
        $message = $update['message'] ?? null;
        if (!$message || !isset($message['chat']['id'])) {
            return;
        }

        $chatId = (string) $message['chat']['id'];
        $text = trim($message['text'] ?? '');
        $username = $message['from']['username'] ?? null;

        if (empty($text)) {
            return;
        }

        // Check if user is already linked
        $linkedUser = User::where('telegram_chat_id', $chatId)->first();

        // Commands
        if ($text === '/start' || $text === '/login') {
            if ($linkedUser) {
                $this->sendMessage(
                    $chatId,
                    "👋 Merhaba *{$linkedUser->full_name}*!\n\nTelegram hesabınız zaten sistemle eşleştirilmiş durumda.\n\nYeni bir hesaba geçmek isterseniz `/unlink` yazarak mevcut bağlantıyı kesebilirsiniz."
                );
                return;
            }

            Cache::forget("telegram_state_{$chatId}");
            Cache::forget("telegram_email_{$chatId}");
            Cache::put("telegram_state_{$chatId}", 'awaiting_email', now()->addMinutes(15));

            $this->sendMessage(
                $chatId,
                "👋 *iKnow PDKS Telegram Botuna Hoş Geldiniz!*\n\nGörev bildirimlerini alabilmek için iKnow PDKS hesabınızı eşleştirmeniz gerekmektedir.\n\nLütfen sistemdeki kayıtlı **E-posta adresinizi** giriniz:"
            );
            return;
        }

        if ($text === '/unlink' || $text === '/logout') {
            if ($linkedUser) {
                $linkedUser->update([
                    'telegram_chat_id' => null,
                    'telegram_username' => null,
                ]);

                Cache::forget("telegram_state_{$chatId}");
                Cache::forget("telegram_email_{$chatId}");

                $this->sendMessage($chatId, "🔒 *Bağlantı Kesildi.*\n\nTelegram hesabınız iKnow PDKS sisteminden başarıyla kaldırıldı. Yeni bir hesap eşlemek için e-posta adresinizi yazabilirsiniz.");
            } else {
                $this->sendMessage($chatId, "⚠️ Zaten bağlı bir iKnow PDKS hesabınız bulunmamaktadır.");
            }
            return;
        }

        // If user is already linked and sends non-command text
        if ($linkedUser) {
            $this->sendMessage(
                $chatId,
                "ℹ️ Hesabınız (*{$linkedUser->full_name}*) aktif durumda.\n\nSistemde size atanan yeni görevler otomatik olarak bu sohbet üzerinden bildirilecektir.\n\nEşleşmeyi kaldırmak isterseniz `/unlink` yazabilirsiniz."
            );
            return;
        }

        // State machine handling for authentication
        $state = Cache::get("telegram_state_{$chatId}");

        if ($state === 'awaiting_email' || empty($state)) {
            // Treat current text as email
            $email = strtolower($text);

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->sendMessage($chatId, "⚠️ Girdiğiniz metin geçerli bir e-posta adresi biçiminde değil. Lütfen e-posta adresinizi kontrol edip tekrar giriniz:");
                return;
            }

            $userExists = User::where('email', $email)->exists();
            if (!$userExists) {
                $this->sendMessage($chatId, "⚠️ Sistemde *{$email}* e-posta adresiyle eşleşen bir kullanıcı bulunamadı.\n\nLütfen iKnow PDKS hesabınıza ait doğru e-posta adresini tekrar giriniz:");
                return;
            }

            Cache::put("telegram_email_{$chatId}", $email, now()->addMinutes(15));
            Cache::put("telegram_state_{$chatId}", 'awaiting_password', now()->addMinutes(15));

            $this->sendMessage($chatId, "📧 E-posta adresiniz kaydedildi: *{$email}*\n\nLütfen iKnow PDKS hesabınıza ait **şifrenizi** giriniz:");
            return;
        }

        if ($state === 'awaiting_password') {
            $email = Cache::get("telegram_email_{$chatId}");
            $user = $email ? User::where('email', $email)->first() : null;

            if ($user && Hash::check($text, $user->password)) {
                $user->update([
                    'telegram_chat_id' => $chatId,
                    'telegram_username' => $username,
                ]);

                Cache::forget("telegram_state_{$chatId}");
                Cache::forget("telegram_email_{$chatId}");

                $this->sendMessage(
                    $chatId,
                    "🎉 *Giriş Başarılı!*\n\nSayın *{$user->full_name}*, Telegram hesabınız iKnow PDKS ile başarıyla eşleştirildi.\n\nArtık tarafınıza atanan tüm görevler anlık olarak buradan iletilecektir."
                );
            } else {
                Cache::put("telegram_state_{$chatId}", 'awaiting_email', now()->addMinutes(15));
                Cache::forget("telegram_email_{$chatId}");

                $this->sendMessage(
                    $chatId,
                    "❌ *Hatalı Şifre!*\n\nGirdiğiniz şifre e-posta adresiyle eşleşmedi.\n\nLütfen e-posta adresinizi tekrar girerek baştan deneyiniz:"
                );
            }
            return;
        }
    }

    /**
     * Send task notification when assigned to a user
     */
    public function sendTaskAssignedNotification(Task $task, ?User $assignedUser = null): bool
    {
        if (!$assignedUser) {
            $assignedUser = $task->assignedUser;
        }

        if (!$assignedUser || empty($assignedUser->telegram_chat_id)) {
            return false;
        }

        $creatorName = $task->createdBy ? $task->createdBy->full_name : 'Yönetici';
        $priorityEmoji = match (strtoupper($task->priority ?? 'MEDIUM')) {
            'URGENT', 'HIGH', 'YÜKSEK', 'ACİL' => '🚨',
            'LOW', 'DÜŞÜK' => '🟢',
            default => '🟡',
        };

        $messageText = implode("\n", [
            "📌 *YENİ GÖREV ATANDI!*",
            "---------------------------------------",
            "📋 *Başlık:* " . $this->escapeMarkdown($task->title),
            "📝 *Açıklama:* " . $this->escapeMarkdown($task->description ?? 'Açıklama bulunmuyor.'),
            "{$priorityEmoji} *Öncelik:* " . $this->escapeMarkdown($task->priority ?? 'Orta'),
            "📂 *Kategori:* " . $this->escapeMarkdown($task->category ?? 'Geliştirme'),
            "⏱️ *Tahmini Süre:* " . ($task->estimated_hours ?? 4) . " saat",
            "📅 *Görev Tarihi:* " . ($task->task_date ?? now()->toDateString()),
            "👤 *Atayan:* " . $this->escapeMarkdown($creatorName),
            "---------------------------------------",
            "iKnow PDKS paneli üzerinden detayı görüntüleyebilirsiniz.",
        ]);

        return $this->sendMessage($assignedUser->telegram_chat_id, $messageText, 'Markdown');
    }

    protected function escapeMarkdown(string $text): string
    {
        return str_replace(['_', '*', '`', '['], ['\\_', '\\*', '\\`', '\\['], $text);
    }
}
