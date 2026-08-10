<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\InternScore;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class InternController extends Controller
{
    private function formatUserDetail(User $u)
    {
        return [
            'id' => (string) $u->id,
            'fullName' => $u->full_name,
            'email' => $u->email,
            'role' => $u->role,
            'department' => $u->department,
            'phone' => $u->phone,
            'avatar' => $u->avatar,
            'targetCompany' => $u->target_company,
            'companyIntegrationNote' => $u->company_integration_note,
            'isOnboarded' => $u->is_onboarded,
            'isApproved' => $u->is_approved,
            'telegram_chat_id' => $u->telegram_chat_id,
            'primaryDomain' => $u->primary_domain,
            'knownSkills' => $u->known_skills ?? [],
            'preferredCareerPath' => $u->preferred_career_path,
            'toolsUsed' => $u->tools_used ?? [],
            'experienceLevel' => $u->experience_level,
            'scores' => $u->scores ? $u->scores->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'techScore' => (float) $s->tech_score,
                    'softSkillScore' => (float) $s->soft_skill_score,
                    'punctualityScore' => (float) $s->punctuality_score,
                    'overallScore' => (float) $s->overall_score,
                    'feedbackNote' => $s->feedback_note,
                ];
            }) : [],
            'cvFiles' => $u->cvFiles ? $u->cvFiles->map(function ($c) {
                return [
                    'id' => (string) $c->id,
                    'fileName' => $c->file_name,
                    'fileUrl' => $c->file_url,
                    'fileSize' => $c->file_size,
                ];
            }) : [],
        ];
    }

    public function index()
    {
        $interns = User::where('role', 'USER')
            ->with(['scores', 'cvFiles'])
            ->latest()
            ->get()
            ->map(function ($u) {
                return $this->formatUserDetail($u);
            });

        return response()->json(['interns' => $interns]);
    }

    public function show($id)
    {
        $u = User::where('role', 'USER')
            ->with(['scores', 'cvFiles', 'tasksAssigned'])
            ->findOrFail($id);

        $data = $this->formatUserDetail($u);
        $data['tasksAssigned'] = $u->tasksAssigned->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'status' => $t->status,
                'priority' => $t->priority,
                'category' => $t->category,
                'estimatedHours' => (float) $t->estimated_hours,
                'actualHours' => (float) $t->actual_hours,
            ];
        });

        return response()->json(['intern' => $data]);
    }

    public function storeScoreOrIntegration(Request $request)
    {
        $request->validate([
            'userId' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->userId);

        if ($request->has('targetCompany') || $request->has('companyIntegrationNote')) {
            $user->update([
                'target_company' => $request->targetCompany ?? $user->target_company,
                'company_integration_note' => $request->companyIntegrationNote ?? $user->company_integration_note,
            ]);
        }

        if ($request->has('techScore') || $request->has('softSkillScore') || $request->has('punctualityScore')) {
            $tech = (float) ($request->techScore ?? 8);
            $soft = (float) ($request->softSkillScore ?? 8);
            $punc = (float) ($request->punctualityScore ?? 8);
            $overall = round(($tech + $soft + $punc) / 3, 1);

            $evaluatorId = $request->user() ? $request->user()->id : null;

            InternScore::create([
                'user_id' => $user->id,
                'evaluator_id' => $evaluatorId,
                'tech_score' => $tech,
                'soft_skill_score' => $soft,
                'punctuality_score' => $punc,
                'overall_score' => $overall,
                'feedback_note' => $request->feedbackNote,
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function createManual(Request $request)
    {
        $request->validate([
            'fullName' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
        ]);

        $newIntern = User::create([
            'full_name' => trim($request->fullName),
            'email' => strtolower(trim($request->email)),
            'password' => Hash::make($request->password),
            'role' => 'USER',
            'department' => $request->department ?? 'Frontend Geliştirici',
            'phone' => $request->phone ?? null,
            'target_company' => $request->targetCompany ?? null,
            'company_integration_note' => $request->companyIntegrationNote ?? null,
            'avatar' => 'https://ui-avatars.com/api/?name=' . urlencode($request->fullName) . '&background=3F3C67&color=fff',
            'is_onboarded' => false,
            'is_approved' => true,
        ]);

        return response()->json(['success' => true, 'user' => $newIntern], 201);
    }

    public function resetPassword(Request $request)
    {
        $adminUser = $request->user();

        if (!$adminUser || $adminUser->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $request->validate([
            'userId' => 'required|exists:users,id',
            'newPassword' => 'required|min:6',
        ]);

        $targetUser = User::findOrFail($request->userId);
        $cleanPassword = trim($request->newPassword);
        $targetUser->password = Hash::make($cleanPassword);
        $targetUser->save();

        return response()->json([
            'success' => true,
            'message' => "{$targetUser->full_name} isimli personelin şifresi '{$cleanPassword}' olarak güncellendi."
        ]);
    }

    public function destroy($id, Request $request)
    {
        $adminUser = $request->user();

        if (!$adminUser || $adminUser->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $targetUser = User::where('role', 'USER')->findOrFail($id);
        $fullName = $targetUser->full_name;
        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => "{$fullName} isimli personel başarıyla silindi."
        ]);
    }

    public function toggleApprove($id, Request $request)
    {
        $adminUser = $request->user();

        if (!$adminUser || $adminUser->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $targetUser = User::where('role', 'USER')->findOrFail($id);
        $targetUser->is_approved = !$targetUser->is_approved;
        $targetUser->save();

        $statusStr = $targetUser->is_approved ? 'onaylandı' : 'onayı kaldırıldı';

        return response()->json([
            'success' => true,
            'isApproved' => $targetUser->is_approved,
            'message' => "{$targetUser->full_name} isimli personelin hesabı {$statusStr}."
        ]);
    }
}
