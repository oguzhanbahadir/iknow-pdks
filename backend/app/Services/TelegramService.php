<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public function getBotToken(): ?string
    {
        return env('TELEGRAM_BOT_TOKEN') ?: config('services.telegram.bot_token');
    }

    public function getDefaultChatId(): ?string
    {
        return env('TELEGRAM_CHAT_ID') ?: env('TELEGRAM_DEFAULT_CHAT_ID') ?: config('services.telegram.default_chat_id');
    }

    public function isConfigured(): bool
    {
        $token = $this->getBotToken();
        return !empty($token) && strlen($token) > 10;
    }

    public function getMaskedToken(): string
    {
        $token = $this->getBotToken();
        if (!$token) {
            return 'Henüz Eklenmedi (.env)';
        }
        $len = strlen($token);
        if ($len < 10) return '********';
        return substr($token, 0, 6) . '...' . substr($token, -4);
    }

    public function getBotInfo(): array
    {
        if (!$this->isConfigured()) {
            return [
                'configured' => false,
                'connected' => false,
                'message' => 'TELEGRAM_BOT_TOKEN .env dosyasında tanımlı değil.',
                'maskedToken' => $this->getMaskedToken(),
                'defaultChatId' => $this->getDefaultChatId(),
            ];
        }

        try {
            $token = $this->getBotToken();
            $response = Http::timeout(5)->get("https://api.telegram.org/bot{$token}/getMe");

            if ($response->successful() && $response->json('ok')) {
                $bot = $response->json('result');
                return [
                    'configured' => true,
                    'connected' => true,
                    'botName' => $bot['first_name'] ?? 'PDKS Bot',
                    'botUsername' => $bot['username'] ?? '',
                    'maskedToken' => $this->getMaskedToken(),
                    'defaultChatId' => $this->getDefaultChatId(),
                ];
            }

            return [
                'configured' => true,
                'connected' => false,
                'message' => 'Telegram Bot API yanıt vermedi: Token geçersiz olabilir.',
                'maskedToken' => $this->getMaskedToken(),
                'defaultChatId' => $this->getDefaultChatId(),
            ];
        } catch (\Exception $e) {
            Log::error('Telegram getMe error: ' . $e->getMessage());
            return [
                'configured' => true,
                'connected' => false,
                'message' => 'Telegram sunucularına bağlanılamadı: ' . $e->getMessage(),
                'maskedToken' => $this->getMaskedToken(),
                'defaultChatId' => $this->getDefaultChatId(),
            ];
        }
    }

    public function sendMessage(string $chatId, string $message, string $parseMode = 'HTML'): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'TELEGRAM_BOT_TOKEN .env dosyasında henüz tanımlanmamış.',
            ];
        }

        try {
            $token = $this->getBotToken();
            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => $parseMode,
            ]);

            if ($response->successful() && $response->json('ok')) {
                return [
                    'success' => true,
                    'messageId' => $response->json('result.message_id'),
                ];
            }

            $errorMsg = $response->json('description') ?? 'Telegram mesaj gönderimi başarısız.';
            return [
                'success' => false,
                'error' => $errorMsg,
            ];
        } catch (\Exception $e) {
            Log::error('Telegram sendMessage error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Telegram istemcisi hatası: ' . $e->getMessage(),
            ];
        }
    }
}
