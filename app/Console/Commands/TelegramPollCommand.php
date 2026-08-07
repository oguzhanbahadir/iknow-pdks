<?php

namespace App\Console\Commands;

use App\Services\TelegramService;
use Illuminate\Console\Command;

class TelegramPollCommand extends Command
{
    protected $signature = 'telegram:poll {--timeout=30 : Timeout in seconds for long polling}';
    protected $description = 'Poll Telegram API for incoming updates in local development environment';

    public function handle(TelegramService $telegramService): int
    {
        $this->info('Starting Telegram Bot Polling...');
        $this->comment('Press Ctrl+C to stop.');

        $offset = 0;
        $timeout = (int) $this->option('timeout');

        while (true) {
            try {
                $updates = $telegramService->getUpdates($offset, $timeout);

                foreach ($updates as $update) {
                    $updateId = $update['update_id'] ?? 0;
                    $offset = max($offset, $updateId + 1);

                    $chatId = $update['message']['chat']['id'] ?? 'unknown';
                    $text = $update['message']['text'] ?? '';
                    $this->line("Received message from chat [{$chatId}]: {$text}");

                    $telegramService->handleUpdate($update);
                }
            } catch (\Exception $e) {
                $this->error('Error during Telegram polling: ' . $e->getMessage());
                sleep(2);
            }
        }

        return Command::SUCCESS;
    }
}
