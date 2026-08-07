<?php

namespace App\Http\Controllers;

use App\Models\User;
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
            'department' => $request->department ?? 'Yazılım Geliştirme',
            'phone' => $request->phone ?? null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->fullName) . '&background=3F3C67&color=fff',
            'is_onboarded' => false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
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
