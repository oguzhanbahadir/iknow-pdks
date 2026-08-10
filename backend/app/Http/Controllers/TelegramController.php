<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramController extends Controller
{
    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function getStatus(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $info = $this->telegramService->getBotInfo();
        $webhook = $this->telegramService->getWebhookInfo();

        if (isset($webhook['info'])) {
            $info['webhookUrl'] = $webhook['info']['url'] ?? '';
            $info['webhookPendingCount'] = $webhook['info']['pending_update_count'] ?? 0;
            $info['webhookLastError'] = $webhook['info']['last_error_message'] ?? null;
        }

        return response()->json(['status' => $info]);
    }

    public function setWebhook(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $url = $request->url;
        if (empty($url)) {
            $url = $request->schemeAndHttpHost() . '/api/telegram/webhook';
        }

        $res = $this->telegramService->setWebhook($url);
        return response()->json($res);
    }

    public function sendTestMessage(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $targetChatId = $request->chatId ?? $this->telegramService->getDefaultChatId();

        if (empty($targetChatId)) {
            return response()->json([
                'success' => false,
                'error' => 'Test mesajı için bir Chat ID giriniz veya .env dosyasında TELEGRAM_CHAT_ID tanımlayınız.'
            ], 400);
        }

        $testText = "<b>🤖 iKnow PDKS Portal - Telegram Bildirim Testi</b>\n\n" .
            "Telegram Bot entegrasyonu başarıyla çalışıyor!\n" .
            "Test Zamanı: " . date('d.m.Y H:i:s') . "\n\n" .
            "<i>Sistemdeki personellerinize anlık görev ve duyuru mesajlarını bu bot üzerinden iletebilirsiniz.</i>";

        $result = $this->telegramService->sendMessage($targetChatId, $testText);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Test bildirim mesajı Telegram grubuna / hesabına başarıyla ulaştı!'
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'] ?? 'Test mesajı gönderilemedi.'
        ], 400);
    }

    public function sendMessage(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $request->validate([
            'message' => 'required|string',
        ]);

        $targetType = $request->targetType ?? 'DEFAULT'; // DEFAULT, USER, CHAT_ID
        $chatId = null;

        if ($targetType === 'USER' && $request->userId) {
            $user = User::find($request->userId);
            if (!$user || empty($user->telegram_chat_id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Seçilen kullanıcının tanımlı bir Telegram Chat ID bilgisi bulunmuyor.'
                ], 400);
            }
            $chatId = $user->telegram_chat_id;
        } elseif ($targetType === 'CHAT_ID' && $request->customChatId) {
            $chatId = trim($request->customChatId);
        } else {
            $chatId = $this->telegramService->getDefaultChatId();
        }

        if (empty($chatId)) {
            return response()->json([
                'success' => false,
                'error' => 'Geçerli bir Telegram Chat ID belirlenemedi.'
            ], 400);
        }

        $formattedText = "<b>📢 iKnow PDKS Duyuru & Bildirim</b>\n\n" .
            htmlspecialchars($request->message) . "\n\n" .
            "<i>Tarih: " . date('d.m.Y H:i') . "</i>";

        $result = $this->telegramService->sendMessage($chatId, $formattedText);

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Telegram mesajı başarıyla iletildi!'
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'] ?? 'Mesaj iletilemedi.'
        ], 400);
    }
}
