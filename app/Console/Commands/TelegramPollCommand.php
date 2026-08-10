<?php

namespace App\Console\Commands;

use App\Http\Controllers\TelegramWebhookController;
use App\Services\TelegramService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TelegramPollCommand extends Command
{
    protected $signature = 'telegram:poll';
    protected $description = 'Telegram botuna gelen mesajları döngüde dinler ve yanıtlar (Local Dev)';

    public function handle(TelegramService $telegramService, TelegramWebhookController $webhookController)
    {
        if (!$telegramService->isConfigured()) {
            $this->error('TELEGRAM_BOT_TOKEN .env dosyasında henüz tanımlanmamış!');
            return 1;
        }

        $this->info('🤖 Telegram Bot Canlı Dinleme Başlatıldı!');
        $this->info('Durdurmak için Ctrl+C tuşlarına basabilirsiniz.');

        $token = $telegramService->getBotToken();
        $offset = 0;

        while (true) {
            try {
                $response = Http::timeout(10)->get("https://api.telegram.org/bot{$token}/getUpdates", [
                    'offset' => $offset,
                    'timeout' => 5,
                ]);

                if ($response->successful() && $response->json('ok')) {
                    $updates = $response->json('result') ?? [];

                    foreach ($updates as $update) {
                        $offset = $update['update_id'] + 1;
                        $webhookController->processUpdate($update);

                        $msgText = $update['message']['text'] ?? '[Medya / İşlem]';
                        $chatName = $update['message']['chat']['title'] ?? ($update['message']['chat']['first_name'] ?? 'Kullanıcı');
                        $this->info(" [Gelen Mesaj]: \"{$msgText}\" (Kimden: {$chatName}) -> İşlendi ve yanıtlandı ✓");
                    }
                }
            } catch (\Exception $e) {
                // Ignore transient timeouts
            }

            sleep(1);
        }
    }
}
