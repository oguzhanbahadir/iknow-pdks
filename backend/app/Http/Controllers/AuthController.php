<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    private function formatUser(User $user)
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'role' => $user->role,
            'department' => $user->department,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'isOnboarded' => $user->is_onboarded,
            'isApproved' => $user->is_approved,
            'primaryDomain' => $user->primary_domain,
            'knownSkills' => $user->known_skills ?? [],
            'preferredCareerPath' => $user->preferred_career_path,
            'toolsUsed' => $user->tools_used ?? [],
            'experienceLevel' => $user->experience_level,
        ];
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $email = strtolower(trim($request->email));
        $password = trim($request->password);

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Geçersiz e-posta adresi veya şifre.'], 401);
        }

        if (!$user->is_approved) {
            return response()->json(['error' => 'Hesabınız henüz yönetici tarafından onaylanmamıştır. Lütfen yöneticiniz ile iletişime geçiniz.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $this->formatUser($user)
        ])->cookie('iknow_pdks_session', $token, 60 * 24 * 7);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Oturum bulunamadı.'], 401);
        }

        return response()->json([
            'user' => $this->formatUser($user)
        ]);
    }

    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function register(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $user = User::create([
            'full_name' => trim($request->fullName),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'USER',
            'department' => $request->department ?? 'Frontend Geliştirici',
            'phone' => $request->phone ?? null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->fullName) . '&background=3F3C67&color=fff',
            'is_onboarded' => false,
            'is_approved' => false,
        ]);

        // Send Telegram alert with inline approval buttons to Admin(s)
        try {
            $adminChatIds = User::where('role', 'ADMIN')
                ->whereNotNull('telegram_chat_id')
                ->where('telegram_chat_id', '!=', '')
                ->pluck('telegram_chat_id')
                ->toArray();

            if (empty($adminChatIds)) {
                $defaultChatId = $this->telegramService->getDefaultChatId();
                if ($defaultChatId) {
                    $adminChatIds = [$defaultChatId];
                }
            }

            $alertMsg = "<b>🆕 Yeni Personel Kaydı Yapıldı!</b>\n\n" .
                "• <b>Ad Soyad:</b> {$user->full_name}\n" .
                "• <b>E-Posta:</b> {$user->email}\n" .
                "• <b>Departman:</b> {$user->department}\n" .
                "• <b>Tarih:</b> " . date('d.m.Y H:i') . "\n\n" .
                "<i>Bu personelin PDKS sistemine erişmesini onaylıyor musunuz?</i>";

            $inlineKeyboard = [
                [
                    [
                        'text' => '✅ Onayla',
                        'callback_data' => "approve_user_{$user->id}",
                    ],
                    [
                        'text' => '❌ Reddet & Sil',
                        'callback_data' => "reject_user_{$user->id}",
                    ],
                ]
            ];

            foreach ($adminChatIds as $adminChatId) {
                $this->telegramService->sendInlineKeyboardMessage($adminChatId, $alertMsg, $inlineKeyboard);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Register Telegram notification error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Hesabınız başarıyla oluşturuldu. Yöneticiniz hesabınızı onayladıktan sonra giriş yapabilirsiniz.',
            'user' => $this->formatUser($user)
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['success' => true])->withoutCookie('iknow_pdks_session');
    }
}
