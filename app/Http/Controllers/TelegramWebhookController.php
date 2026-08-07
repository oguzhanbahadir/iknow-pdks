<?php

namespace App\Http\Controllers;

use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramWebhookController extends Controller
{
    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    /**
     * Handle Telegram incoming webhook
     */
    public function handle(Request $request)
    {
        $update = $request->all();
        if (!empty($update)) {
            $this->telegramService->handleUpdate($update);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Get current user's Telegram status
     */
    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'is_connected' => !empty($user->telegram_chat_id),
            'telegram_username' => $user->telegram_username,
        ]);
    }

    /**
     * Unlink user's Telegram
     */
    public function unlink(Request $request)
    {
        $user = $request->user();

        if ($user->telegram_chat_id) {
            $this->telegramService->sendMessage(
                $user->telegram_chat_id,
                "🔒 *Bağlantı Kesildi.*\n\nWeb paneliniz üzerinden Telegram hesabınızın bağlantısı kaldırıldı."
            );
        }

        $user->update([
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);

        return response()->json(['success' => true]);
    }
}
