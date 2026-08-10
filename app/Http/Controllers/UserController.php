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
}
