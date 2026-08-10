<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TelegramBotSession;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function handleWebhook(Request $request)
    {
        $update = $request->all();
        $this->processUpdate($update);
        return response()->json(['status' => 'ok']);
    }

    public function pollUpdates(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz işlem.'], 403);
        }

        if (!$this->telegramService->isConfigured()) {
            return response()->json(['success' => false, 'error' => 'Bot Token tanımlı değil.'], 400);
        }

        $token = $this->telegramService->getBotToken();
        $res = Http::get("https://api.telegram.org/bot{$token}/getUpdates");

        if ($res->successful() && $res->json('ok')) {
            $updates = $res->json('result') ?? [];
            $processedCount = 0;
            $maxUpdateId = 0;

            foreach ($updates as $up) {
                $this->processUpdate($up);
                $processedCount++;
                if (isset($up['update_id'])) {
                    $maxUpdateId = max($maxUpdateId, $up['update_id']);
                }
            }

            // Acknowledge updates by setting offset to maxUpdateId + 1
            if ($maxUpdateId > 0) {
                Http::get("https://api.telegram.org/bot{$token}/getUpdates", [
                    'offset' => $maxUpdateId + 1,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "{$processedCount} adet Telegram güncellemesi işlendi.",
                'updatesCount' => $processedCount,
            ]);
        }

        return response()->json(['success' => false, 'error' => 'Telegram güncellemeleri alınamadı.'], 400);
    }

    public function processUpdate(array $update)
    {
        Log::info('Telegram update payload: ' . json_encode($update));

        $message = $update['message'] ?? $update['edited_message'] ?? null;
        if (!$message || !isset($message['chat']['id'])) {
            return;
        }

        $chatId = (string) $message['chat']['id'];
        $text = trim($message['text'] ?? '');

        if (empty($text)) {
            return;
        }

        $lowerText = strtolower($text);
        $user = User::where('telegram_chat_id', $chatId)->first();

        // 1. COMMAND: /logout
        if (str_starts_with($lowerText, '/logout') || $lowerText === 'cikis' || $lowerText === 'çıkış') {
            if ($user) {
                $user->update(['telegram_chat_id' => null]);
                $this->telegramService->sendMessage($chatId, "<b>🔒 Oturum Kapandı</b>\n\nTelegram hesabınızın iKnow PDKS profilinizle eşleştirmesi kaldırıldı. Tekrar bağlanmak için /start yazabilirsiniz.");
            } else {
                $this->telegramService->sendMessage($chatId, "Zaten aktif bir profil eşleşmeniz bulunmuyor.");
            }
            TelegramBotSession::where('chat_id', $chatId)->delete();
            return;
        }

        // 2. COMMAND: /tasks or görevlerim
        if (str_starts_with($lowerText, '/tasks') || $lowerText === 'gorevlerim' || $lowerText === 'görevlerim') {
            if (!$user) {
                $this->telegramService->sendMessage($chatId, "⚠️ <b>Henüz Giriş Yapmadınız</b>\n\nGörevlerinizi listeleyebilmek için öncelikle PDKS hesabınızı bağlamalısınız.\nLütfen /start yazarak giriş yapın.");
                return;
            }

            $tasks = Task::where('assigned_user_id', $user->id)->latest()->get();

            if ($tasks->isEmpty()) {
                $this->telegramService->sendMessage($chatId, "<b>📋 Görevleriniz</b>\n\nÜzerinize atanmış aktif bir görev bulunmamaktadır.");
                return;
            }

            $msg = "<b>📋 Üzerinize Atanan Görevler ({$tasks->count()} Adet):</b>\n\n";
            foreach ($tasks as $idx => $t) {
                $statusMap = [
                    'TODO' => '⏳ Yapılacak',
                    'IN_PROGRESS' => '🔄 Devam Ediyor',
                    'IN_REVIEW' => '👀 İncelemede',
                    'DONE' => '✅ Tamamlandı',
                ];
                $priorityMap = [
                    'LOW' => '🔵 Düşük',
                    'MEDIUM' => '🟡 Orta',
                    'HIGH' => '🔴 Yüksek',
                ];

                $st = $statusMap[$t->status] ?? $t->status;
                $pr = $priorityMap[$t->priority] ?? $t->priority;
                $num = $idx + 1;

                $msg .= "<b>{$num}. {$t->title}</b>\n";
                $msg .= "• Durum: {$st}\n";
                $msg .= "• Öncelik: {$pr}\n";
                $msg .= "• Tahmini Efor: {$t->estimated_hours}h | Harcanan: {$t->actual_hours}h\n";
                if ($t->description) {
                    $msg .= "• Not: <i>{$t->description}</i>\n";
                }
                $msg .= "\n";
            }

            $this->telegramService->sendMessage($chatId, $msg);
            return;
        }

        // 3. COMMAND: /start or /help
        if (str_starts_with($lowerText, '/start') || str_starts_with($lowerText, '/help')) {
            if ($user) {
                $msg = "<b>👋 Hoş Geldiniz, {$user->full_name}!</b>\n\n" .
                    "Telegram hesabınız <b>{$user->email}</b> profili ile eşleşmiş durumda.\n\n" .
                    "📌 <b>Kullanabileceğiniz Komutlar:</b>\n" .
                    "• /tasks - Atanan görevlerinizi listeleyin\n" .
                    "• /profile - Profil bilgilerinizi görün\n" .
                    "• /logout - Hesabınızın eşleştirmesini kaldırın";
                $this->telegramService->sendMessage($chatId, $msg);
                return;
            }

            TelegramBotSession::updateOrCreate(
                ['chat_id' => $chatId],
                ['step' => 'WAITING_EMAIL', 'pending_email' => null]
            );

            $welcomeMsg = "<b>👋 iKnow PDKS Telegram Botuna Hoş Geldiniz!</b>\n\n" .
                "Görevlerinizi görüntülemek ve anlık bildirimleri alabilmek için hesabınızı eşleştirmemiz gerekmektedir.\n\n" .
                "📧 Lütfen PDKS sisteminde kayıtlı <b>E-posta Adresinizi</b> yazınız:";
            $this->telegramService->sendMessage($chatId, $welcomeMsg);
            return;
        }

        // 4. COMMAND: /profile
        if (str_starts_with($lowerText, '/profile')) {
            if (!$user) {
                $this->telegramService->sendMessage($chatId, "Giriş yapmadınız. Lütfen /start yazarak eşleştirme başlatın.");
                return;
            }
            $msg = "<b>👤 Profil Bilgileriniz:</b>\n\n" .
                "• Ad Soyad: <b>{$user->full_name}</b>\n" .
                "• E-Posta: {$user->email}\n" .
                "• Departman: " . ($user->department ?? 'Yazılım') . "\n" .
                "• Rol: {$user->role}\n" .
                "• Durum: " . ($user->is_approved ? '🟢 Onaylı' : '🟡 Onay Bekliyor');
            $this->telegramService->sendMessage($chatId, $msg);
            return;
        }

        // 5. STATEFUL CONVERSATION (Login Flow)
        $session = TelegramBotSession::where('chat_id', $chatId)->first();

        if (!$session) {
            $this->telegramService->sendMessage($chatId, "Lütfen komut çalıştırmak veya hesabınızı bağlamak için /start yazınız.");
            return;
        }

        if ($session->step === 'WAITING_EMAIL') {
            $email = strtolower($text);
            $foundUser = User::where('email', $email)->first();

            if (!$foundUser) {
                $this->telegramService->sendMessage($chatId, "❌ <b>Kullanıcı Bulunamadı</b>\n\n<b>{$email}</b> e-posta adresi ile kayıtlı bir personel bulunamadı.\n\nLütfen e-postanızı kontrol edip tekrar yazınız:");
                return;
            }

            $session->update([
                'step' => 'WAITING_PASSWORD',
                'pending_email' => $email,
            ]);

            $this->telegramService->sendMessage($chatId, "✅ <b>E-posta Adresi Doğrulandı ({$foundUser->full_name})</b>\n\nLütfen PDKS sistemindeki <b>Giriş Şifrenizi</b> yazınız:");
            return;
        }

        if ($session->step === 'WAITING_PASSWORD') {
            $email = $session->pending_email;
            $foundUser = User::where('email', $email)->first();

            if (!$foundUser || !Hash::check($text, $foundUser->password)) {
                $this->telegramService->sendMessage($chatId, "🔑 <b>Hatalı Şifre</b>\n\nGirdiğiniz şifre uyuşmadı. Lütfen şifrenizi tekrar deneyiniz:");
                return;
            }

            $foundUser->update(['telegram_chat_id' => $chatId]);
            $session->delete();

            $successMsg = "🎉 <b>Tebrikler {$foundUser->full_name}!</b>\n\n" .
                "Telegram hesabınız PDKS profilinizle başarıyla eşleştirildi.\n\n" .
                "📌 <b>Hemen Deneyin:</b>\n" .
                "• /tasks yazarak size atanan görevleri listeleyebilirsiniz.\n" .
                "• /profile yazarak bilgilerinizi görebilirsiniz.";
            $this->telegramService->sendMessage($chatId, $successMsg);
            return;
        }
    }
}
