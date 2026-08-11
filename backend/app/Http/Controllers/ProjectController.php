<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function index(Request $request)
    {
        $actor = $request->user();
        $isAdmin = $actor->role === 'ADMIN';

        $projects = Project::with([
            'createdBy',
            'members.user:id,full_name,email,role,department,avatar',
            'tasks:id,project_id,status',
        ])->latest()->get()->map(function ($p) use ($actor, $isAdmin) {
            $myMembership = $p->members->firstWhere('user_id', $actor->id);
            $isApprovedMember = $myMembership && $myMembership->status === 'APPROVED';
            $canAccessFull = $isAdmin || $isApprovedMember;

            $approvedCount = $p->members->where('status', 'APPROVED')->count();
            $pendingCount = $p->members->where('status', 'PENDING')->count();

            $totalTasks = $p->tasks->count();
            $completedTasks = $p->tasks->where('status', 'DONE')->count();
            $progress = $totalTasks > 0 ? (int) round(($completedTasks / $totalTasks) * 100) : 0;

            return [
                'id' => (string) $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'neededRoles' => $p->needed_roles ?? [],
                'roleRequirements' => $p->role_requirements ?? [],
                'status' => $p->status,
                'repositoryUrl' => $canAccessFull ? $p->repository_url : null,
                'createdById' => (string) $p->created_by_id,
                'createdAt' => $p->created_at ? $p->created_at->toISOString() : null,
                'createdBy' => $p->createdBy ? [
                    'id' => (string) $p->createdBy->id,
                    'fullName' => $p->createdBy->full_name,
                ] : null,
                'approvedCount' => $approvedCount,
                'pendingCount' => $pendingCount,
                'totalTasksCount' => $totalTasks,
                'completedTasksCount' => $completedTasks,
                'progressPercentage' => $progress,
                'canAccessContent' => $canAccessFull,
                'myMembership' => $myMembership ? [
                    'id' => (string) $myMembership->id,
                    'requestedRole' => $myMembership->requested_role,
                    'status' => $myMembership->status,
                ] : null,
                'members' => $p->members->map(function ($m) {
                    return [
                        'id' => (string) $m->id,
                        'userId' => (string) $m->user_id,
                        'requestedRole' => $m->requested_role,
                        'status' => $m->status,
                        'createdAt' => $m->created_at ? $m->created_at->toISOString() : null,
                        'user' => $m->user ? [
                            'id' => (string) $m->user->id,
                            'fullName' => $m->user->full_name,
                            'email' => $m->user->email,
                            'role' => $m->user->role,
                            'department' => $m->user->department,
                            'avatar' => $m->user->avatar,
                        ] : null,
                    ];
                })->values(),
            ];
        });

        return response()->json(['projects' => $projects]);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $request->validate([
            'name' => 'required|string',
        ]);

        $project = Project::create([
            'name' => trim($request->name),
            'description' => $request->description,
            'needed_roles' => $request->neededRoles ?? ['Frontend', 'Backend'],
            'role_requirements' => $request->roleRequirements ?? [],
            'documentation' => $request->documentation,
            'repository_url' => $request->repositoryUrl,
            'status' => $request->status ?? 'PLANNING',
            'created_by_id' => $request->user()->id,
        ]);

        // Automatically add admin as approved member
        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => $request->user()->id,
            'requested_role' => 'Proje Yöneticisi',
            'status' => 'APPROVED',
        ]);

        return response()->json(['success' => true, 'project' => $project], 201);
    }

    public function show(Request $request, $id)
    {
        $actor = $request->user();
        $isAdmin = $actor->role === 'ADMIN';

        $project = Project::with([
            'createdBy',
            'members.user:id,full_name,email,role,department,avatar',
            'tasks' => function ($q) {
                $q->withCount('comments')->with('assignedUser:id,full_name,email');
            },
        ])->findOrFail($id);

        $myMembership = $project->members->firstWhere('user_id', $actor->id);
        $isApprovedMember = $myMembership && $myMembership->status === 'APPROVED';
        $canAccessFull = $isAdmin || $isApprovedMember;

        $totalTasks = $project->tasks->count();
        $completedTasks = $project->tasks->where('status', 'DONE')->count();
        $progress = $totalTasks > 0 ? (int) round(($completedTasks / $totalTasks) * 100) : 0;

        $projectData = [
            'id' => (string) $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'neededRoles' => $project->needed_roles ?? [],
            'roleRequirements' => $project->role_requirements ?? [],
            'status' => $project->status,
            'totalTasksCount' => $totalTasks,
            'completedTasksCount' => $completedTasks,
            'progressPercentage' => $progress,
            'createdById' => (string) $project->created_by_id,
            'createdAt' => $project->created_at ? $project->created_at->toISOString() : null,
            'createdBy' => $project->createdBy ? [
                'id' => (string) $project->createdBy->id,
                'fullName' => $project->createdBy->full_name,
            ] : null,
            'canAccessContent' => $canAccessFull,
            'documentation' => $canAccessFull ? $project->documentation : null,
            'repositoryUrl' => $canAccessFull ? $project->repository_url : null,
            'myMembership' => $myMembership ? [
                'id' => (string) $myMembership->id,
                'requestedRole' => $myMembership->requested_role,
                'status' => $myMembership->status,
            ] : null,
            'members' => $project->members->map(function ($m) {
                return [
                    'id' => (string) $m->id,
                    'userId' => (string) $m->user_id,
                    'requestedRole' => $m->requested_role,
                    'status' => $m->status,
                    'createdAt' => $m->created_at ? $m->created_at->toISOString() : null,
                    'user' => $m->user ? [
                        'id' => (string) $m->user->id,
                        'fullName' => $m->user->full_name,
                        'email' => $m->user->email,
                        'role' => $m->user->role,
                        'department' => $m->user->department,
                        'avatar' => $m->user->avatar,
                    ] : null,
                ];
            })->values(),
            'tasks' => $canAccessFull ? $project->tasks->map(function ($t) {
                return [
                    'id' => (string) $t->id,
                    'title' => $t->title,
                    'description' => $t->description,
                    'status' => $t->status,
                    'priority' => $t->priority,
                    'category' => $t->category,
                    'projectId' => (string) $t->project_id,
                    'assignedUserId' => (string) $t->assigned_user_id,
                    'estimatedHours' => (float) $t->estimated_hours,
                    'actualHours' => (float) $t->actual_hours,
                    'taskDate' => $t->task_date,
                    'commentsCount' => (int) ($t->comments_count ?? 0),
                    'assignedUser' => $t->assignedUser ? [
                        'id' => (string) $t->assignedUser->id,
                        'fullName' => $t->assignedUser->full_name,
                    ] : null,
                ];
            })->values() : [],
        ];

        return response()->json(['project' => $projectData]);
    }

    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $project = Project::findOrFail($id);

        $project->update([
            'name' => $request->name ?? $project->name,
            'description' => $request->has('description') ? $request->description : $project->description,
            'needed_roles' => $request->neededRoles ?? $project->needed_roles,
            'role_requirements' => $request->has('roleRequirements') ? $request->roleRequirements : $project->role_requirements,
            'documentation' => $request->has('documentation') ? $request->documentation : $project->documentation,
            'repository_url' => $request->has('repositoryUrl') ? $request->repositoryUrl : $project->repository_url,
            'status' => $request->status ?? $project->status,
        ]);

        return response()->json(['success' => true, 'project' => $project]);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json(['success' => true]);
    }

    public function apply(Request $request, $id)
    {
        $request->validate([
            'requestedRole' => 'required|string',
        ]);

        $project = Project::findOrFail($id);
        $actor = $request->user();

        $existing = ProjectMember::where('project_id', $project->id)
            ->where('user_id', $actor->id)
            ->first();

        if ($existing) {
            if ($existing->status === 'APPROVED') {
                return response()->json(['error' => 'Zaten bu projenin bir üyesisiniz.'], 400);
            }
            $existing->update([
                'requested_role' => trim($request->requestedRole),
                'status' => 'PENDING',
            ]);
            $member = $existing;
        } else {
            $member = ProjectMember::create([
                'project_id' => $project->id,
                'user_id' => $actor->id,
                'requested_role' => trim($request->requestedRole),
                'status' => 'PENDING',
            ]);
        }

        // Send Telegram notification to Admins or Default Chat ID
        $defaultChatId = $this->telegramService->getDefaultChatId();
        if ($defaultChatId) {
            $msg = "<b>📌 Yeni Proje Katılım Talebi!</b>\n\n" .
                "• <b>Proje:</b> {$project->name}\n" .
                "• <b>Başvuran:</b> {$actor->full_name}\n" .
                "• <b>Talep Edilen Rol:</b> {$member->requested_role}\n\n" .
                "<i>Projeler alanından talebi onaylayabilirsiniz.</i>";

            $this->telegramService->sendMessage($defaultChatId, $msg);
        }

        return response()->json(['success' => true, 'member' => $member]);
    }

    public function updateMemberStatus(Request $request, $id, $memberId)
    {
        if ($request->user()->role !== 'ADMIN') {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING',
        ]);

        $project = Project::findOrFail($id);
        $member = ProjectMember::with('user')->where('project_id', $project->id)->findOrFail($memberId);

        $oldStatus = $member->status;
        $member->update(['status' => $request->status]);

        // Send Telegram notification to the applicant
        if ($member->user && !empty($member->user->telegram_chat_id) && $oldStatus !== $member->status) {
            if ($member->status === 'APPROVED') {
                $msg = "<b>🎉 Proje Katılım Talebiniz Onaylandı!</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}\n" .
                    "• <b>Rolünüz:</b> {$member->requested_role}\n\n" .
                    "<i>Artık projenin dokümantasyonuna, repo bilgilerine ve görev listesine erişebilirsiniz!</i>";
            } elseif ($member->status === 'REJECTED') {
                $msg = "<b>ℹ️ Proje Başvuru Bilgilendirmesi</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}\n" .
                    "• <b>Durum:</b> Katılım talebiniz bu aşamada onaylanmadı.";
            } else {
                $msg = "<b>⏳ Proje Başvurusu Beklemeye Alındı</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}";
            }

            $this->telegramService->sendMessage($member->user->telegram_chat_id, $msg);
        }

        return response()->json(['success' => true, 'member' => $member]);
    }
}
