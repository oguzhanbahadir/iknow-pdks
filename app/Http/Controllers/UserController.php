<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        $users = User::all()->map(function ($u) {
            return [
                'id' => (string) $u->id,
                'fullName' => $u->full_name,
                'email' => $u->email,
                'role' => $u->role,
                'department' => $u->department,
                'telegram_chat_id' => $u->telegram_chat_id,
                'avatar' => $u->avatar,
                'isOnboarded' => $u->is_onboarded,
                'primaryDomain' => $u->primary_domain,
                'knownSkills' => $u->known_skills ?? [],
                'preferredCareerPath' => $u->preferred_career_path,
                'toolsUsed' => $u->tools_used ?? [],
                'experienceLevel' => $u->experience_level,
            ];
        });

        return response()->json(['users' => $users]);
    }

    public function saveOnboarding(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Oturum bulunamadı.'], 401);
        }

        $user->update([
            'is_onboarded' => true,
            'primary_domain' => $request->primaryDomain,
            'known_skills' => $request->knownSkills ?? [],
            'preferred_career_path' => $request->preferredCareerPath,
            'tools_used' => $request->toolsUsed ?? [],
            'experience_level' => $request->experienceLevel,
        ]);

        return response()->json([
            'success' => true,
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'department' => $user->department,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'isOnboarded' => true,
                'primaryDomain' => $user->primary_domain,
                'knownSkills' => $user->known_skills ?? [],
                'preferredCareerPath' => $user->preferred_career_path,
                'toolsUsed' => $user->tools_used ?? [],
                'experienceLevel' => $user->experience_level,
            ]
        ]);
    }

    public function linkStorage(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        try {
            \Illuminate\Support\Facades\Artisan::call('storage:link');
            return response()->json([
                'success' => true,
                'message' => 'Storage sembolik bağlantısı (storage:link) başarıyla oluşturuldu!',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Storage link hatası: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function createAdmin(Request $request)
    {
        if ($request->user() && $request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $request->validate([
            'fullName' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ], [
            'fullName.required' => 'Ad Soyad alanı zorunludur.',
            'email.required' => 'E-posta alanı zorunludur.',
            'email.unique' => 'Bu e-posta adresi sistemde zaten kayıtlı.',
            'password.required' => 'Şifre alanı zorunludur.',
            'password.min' => 'Şifre en az 6 karakter olmalıdır.',
        ]);

        $admin = User::create([
            'full_name' => trim($request->fullName),
            'email' => strtolower(trim($request->email)),
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => 'ADMIN',
            'department' => $request->department ?? 'Yönetim / IK',
            'phone' => $request->phone ?? null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->fullName) . '&background=4F46E5&color=fff',
            'is_onboarded' => true,
            'is_approved' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Yeni Admin kullanıcı başarıyla oluşturuldu.',
            'user' => [
                'id' => (string) $admin->id,
                'fullName' => $admin->full_name,
                'email' => $admin->email,
                'role' => $admin->role,
                'department' => $admin->department,
                'phone' => $admin->phone,
            ]
        ], 201);
    }

    public function updateTelegramChatId(Request $request, $id)
    {
        if ($request->user() && $request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $user = User::findOrFail($id);
        $chatId = $request->telegramChatId ? trim($request->telegramChatId) : null;
        $user->update(['telegram_chat_id' => $chatId]);

        return response()->json([
            'success' => true,
            'message' => "{$user->full_name} kullanıcısının Telegram Chat ID bilgisi güncellendi.",
            'telegram_chat_id' => $chatId,
        ]);
    }

    public function getProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Oturum bulunamadı.'], 401);
        }

        $user->load(['scores', 'cvFiles']);

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'department' => $user->department,
                'phone' => $user->phone,
                'telegram_chat_id' => $user->telegram_chat_id,
                'avatar' => $user->avatar,
                'targetCompany' => $user->target_company,
                'isOnboarded' => $user->is_onboarded,
                'isApproved' => $user->is_approved,
                'primaryDomain' => $user->primary_domain,
                'knownSkills' => $user->known_skills ?? [],
                'preferredCareerPath' => $user->preferred_career_path,
                'toolsUsed' => $user->tools_used ?? [],
                'experienceLevel' => $user->experience_level,
                'scores' => $user->scores ? $user->scores->map(function ($s) {
                    return [
                        'id' => (string) $s->id,
                        'overallScore' => (float) $s->overall_score,
                        'feedbackNote' => $s->feedback_note,
                    ];
                }) : [],
                'cvFiles' => $user->cvFiles ? $user->cvFiles->map(function ($c) {
                    return [
                        'id' => (string) $c->id,
                        'fileName' => $c->file_name,
                        'fileUrl' => $c->file_url,
                        'fileSize' => $c->file_size,
                        'createdAt' => $c->created_at ? $c->created_at->format('d.m.Y H:i') : null,
                    ];
                }) : [],
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Oturum bulunamadı.'], 401);
        }

        $request->validate([
            'fullName' => 'required|string',
            'phone' => 'nullable|string',
            'department' => 'nullable|string',
            'password' => 'nullable|string|min:6',
        ]);

        $data = [
            'full_name' => trim($request->fullName),
            'phone' => $request->phone,
            'department' => $request->department ?? $user->department,
            'primary_domain' => $request->primaryDomain ?? $user->primary_domain,
            'known_skills' => $request->knownSkills ?? $user->known_skills,
            'preferred_career_path' => $request->preferredCareerPath ?? $user->preferred_career_path,
            'tools_used' => $request->toolsUsed ?? $user->tools_used,
            'experience_level' => $request->experienceLevel ?? $user->experience_level,
        ];

        if ($request->filled('password')) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        if ($request->has('telegramChatId')) {
            $data['telegram_chat_id'] = $request->telegramChatId ? trim($request->telegramChatId) : null;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil bilgileriniz başarıyla güncellendi.',
            'user' => [
                'id' => (string) $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'department' => $user->department,
                'phone' => $user->phone,
                'telegram_chat_id' => $user->telegram_chat_id,
                'avatar' => $user->avatar,
                'isOnboarded' => $user->is_onboarded,
                'isApproved' => $user->is_approved,
                'primaryDomain' => $user->primary_domain,
                'knownSkills' => $user->known_skills ?? [],
                'preferredCareerPath' => $user->preferred_career_path,
                'toolsUsed' => $user->tools_used ?? [],
                'experienceLevel' => $user->experience_level,
            ]
        ]);
    }
}
