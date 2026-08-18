<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectLog;
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

            $neededRoles = $p->needed_roles ?? [];
            $roleRequirements = $p->role_requirements ?? [];
            if (is_array($roleRequirements)) {
                if (empty($neededRoles)) {
                    $roleRequirements = [];
                } else {
                    $roleRequirements = array_values(array_filter($roleRequirements, function ($req) use ($neededRoles) {
                        $roleName = is_array($req) ? ($req['role'] ?? '') : ($req->role ?? '');
                        return in_array($roleName, $neededRoles);
                    }));
                }
            }

            return [
                'id' => (string) $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'neededRoles' => $neededRoles,
                'roleRequirements' => $roleRequirements,
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
                    'isModerator' => (bool) $myMembership->is_moderator,
                    'memberRole' => $myMembership->member_role ?? ($myMembership->is_moderator ? 'MODERATOR' : 'MEMBER'),
                ] : null,
                'members' => $p->members->map(function ($m) {
                    return [
                        'id' => (string) $m->id,
                        'userId' => (string) $m->user_id,
                        'requestedRole' => $m->requested_role,
                        'status' => $m->status,
                        'isModerator' => (bool) $m->is_moderator,
                        'memberRole' => $m->member_role ?? ($m->is_moderator ? 'MODERATOR' : 'MEMBER'),
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
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $actor = $request->user();

        $project = Project::create([
            'name' => trim($request->name),
            'description' => $request->description,
            'needed_roles' => $request->has('neededRoles') ? $request->neededRoles : ($request->needed_roles ?? []),
            'role_requirements' => $request->has('roleRequirements') ? $request->roleRequirements : ($request->role_requirements ?? []),
            'documentation' => $request->documentation,
            'repository_url' => $request->repositoryUrl ?? $request->repository_url,
            'status' => $request->status ?? 'PLANNING',
            'created_by_id' => $actor ? $actor->id : 1,
        ]);

        // Auto-add creator as APPROVED Moderator
        if ($actor) {
            ProjectMember::create([
                'project_id' => $project->id,
                'user_id' => $actor->id,
                'requested_role' => 'Proje Yöneticisi',
                'status' => 'APPROVED',
                'is_moderator' => true,
                'member_role' => 'MODERATOR',
            ]);
        }

        // Record Audit Log
        ProjectLog::create([
            'project_id' => $project->id,
            'task_id' => null,
            'user_id' => $actor ? $actor->id : 1,
            'action' => 'PROJECT_CREATED',
            'title' => "'{$project->name}' isimli yeni proje oluşturuldu.",
            'details' => [
                'project_name' => $project->name,
                'status' => $project->status,
            ],
            'ip_address' => $request->ip(),
        ]);

        // Send Telegram notification if enabled
        $defaultChatId = $this->telegramService->getDefaultChatId();
        if ($defaultChatId) {
            $creatorName = $actor ? $actor->full_name : 'Sistem';
            $msg = "<b>🚀 Yeni Bir Proje Başlatıldı!</b>\n\n" .
                "• <b>Proje:</b> {$project->name}\n" .
                "• <b>Başlatan:</b> {$creatorName}\n" .
                "• <b>Durum:</b> {$project->status}\n" .
                ($project->description ? "• <b>Açıklama:</b> <i>" . mb_substr($project->description, 0, 150) . "</i>\n\n" : "\n") .
                "<i>Ekip üyeleri ve detaylar için PDKS Portal'ı ziyaret edebilirsiniz.</i>";

            $this->telegramService->sendMessage($defaultChatId, $msg);
        }

        return response()->json(['success' => true, 'project' => $project], 201);
    }

    public function show(Request $request, $id)
    {
        $actor = $request->user();
        $isAdmin = $actor->role === 'ADMIN';

        $project = Project::with([
            'createdBy',
            'members.user',
            'tasks.assignedUser',
            'tasks.attachments.user',
        ])->withCount(['tasks as total_tasks_count', 'tasks as completed_tasks_count' => function ($q) {
            $q->where('status', 'DONE');
        }])->findOrFail($id);

        $myMembership = $project->members->firstWhere('user_id', $actor->id);
        $isApprovedMember = $myMembership && $myMembership->status === 'APPROVED';
        $canAccessFull = $isAdmin || $isApprovedMember;

        $neededRoles = $project->needed_roles ?? [];
        $roleRequirements = $project->role_requirements ?? [];
        if (is_array($roleRequirements)) {
            if (empty($neededRoles)) {
                $roleRequirements = [];
            } else {
                $roleRequirements = array_values(array_filter($roleRequirements, function ($req) use ($neededRoles) {
                    $roleName = is_array($req) ? ($req['role'] ?? '') : ($req->role ?? '');
                    return in_array($roleName, $neededRoles);
                }));
            }
        }

        $projectData = [
            'id' => (string) $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'neededRoles' => $neededRoles,
            'roleRequirements' => $roleRequirements,
            'documentation' => $canAccessFull ? $project->documentation : null,
            'repositoryUrl' => $canAccessFull ? $project->repository_url : null,
            'status' => $project->status,
            'createdById' => (string) $project->created_by_id,
            'createdAt' => $project->created_at ? $project->created_at->toISOString() : null,
            'createdBy' => $project->createdBy ? [
                'id' => (string) $project->createdBy->id,
                'fullName' => $project->createdBy->full_name,
            ] : null,
            'approvedCount' => $project->members->where('status', 'APPROVED')->count(),
            'pendingCount' => $project->members->where('status', 'PENDING')->count(),
            'totalTasksCount' => $project->total_tasks_count,
            'completedTasksCount' => $project->completed_tasks_count,
            'progressPercentage' => $project->total_tasks_count > 0 ? (int) round(($project->completed_tasks_count / $project->total_tasks_count) * 100) : 0,
            'canAccessContent' => $canAccessFull,
            'myMembership' => $myMembership ? [
                'id' => (string) $myMembership->id,
                'requestedRole' => $myMembership->requested_role,
                'status' => $myMembership->status,
                'isModerator' => (bool) $myMembership->is_moderator,
                'memberRole' => $myMembership->member_role ?? ($myMembership->is_moderator ? 'MODERATOR' : 'MEMBER'),
            ] : null,
            'members' => $project->members->map(function ($m) {
                return [
                    'id' => (string) $m->id,
                    'userId' => (string) $m->user_id,
                    'requestedRole' => $m->requested_role,
                    'status' => $m->status,
                    'isModerator' => (bool) $m->is_moderator,
                    'memberRole' => $m->member_role ?? ($m->is_moderator ? 'MODERATOR' : 'MEMBER'),
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
                    'isArchived' => (bool) $t->is_archived,
                    'archivedAt' => $t->archived_at ? $t->archived_at->toISOString() : null,
                    'priority' => $t->priority,
                    'category' => $t->category,
                    'projectId' => (string) $t->project_id,
                    'assignedUserId' => (string) $t->assigned_user_id,
                    'estimatedHours' => (float) $t->estimated_hours,
                    'actualHours' => (float) $t->actual_hours,
                    'taskDate' => $t->task_date,
                    'startDate' => $t->start_date ? $t->start_date : ($t->task_date ? $t->task_date : ($t->created_at ? $t->created_at->toISOString() : null)),
                    'dueDate' => $t->due_date ? $t->due_date : null,
                    'createdAt' => $t->created_at ? $t->created_at->toISOString() : null,
                    'commentsCount' => (int) ($t->comments_count ?? 0),
                    'assignedUser' => $t->assignedUser ? [
                        'id' => (string) $t->assignedUser->id,
                        'fullName' => $t->assignedUser->full_name,
                    ] : null,
                    'attachments' => $t->attachments ? $t->attachments->map(function ($att) {
                        return [
                            'id' => (string) $att->id,
                            'taskId' => (string) $att->task_id,
                            'userId' => $att->user_id ? (string) $att->user_id : null,
                            'fileName' => $att->file_name,
                            'filePath' => $att->file_path,
                            'fileUrl' => $att->file_url,
                            'fileType' => $att->file_type,
                            'fileSize' => (int) $att->file_size,
                            'mimeType' => $att->mime_type,
                            'createdAt' => $att->created_at ? $att->created_at->toISOString() : null,
                            'user' => $att->user ? [
                                'id' => (string) $att->user->id,
                                'fullName' => $att->user->full_name,
                                'avatar' => $att->user->avatar,
                            ] : null,
                        ];
                    })->values() : [],
                ];
            })->values() : [],
        ];

        return response()->json(['project' => $projectData]);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $actor = $request->user();
        $isProjectAdmin = ($actor->role === 'ADMIN' || (string) $project->created_by_id === (string) $actor->id);

        if (!$isProjectAdmin) {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $oldStatus = $project->status;

        $neededRoles = $request->has('neededRoles') ? $request->neededRoles : $project->needed_roles;
        $roleRequirements = $request->has('roleRequirements') ? $request->roleRequirements : $project->role_requirements;

        if (is_array($roleRequirements)) {
            if (empty($neededRoles) || !is_array($neededRoles)) {
                $roleRequirements = [];
            } else {
                $roleRequirements = array_values(array_filter($roleRequirements, function ($req) use ($neededRoles) {
                    $roleName = is_array($req) ? ($req['role'] ?? '') : ($req->role ?? '');
                    return in_array($roleName, $neededRoles);
                }));
            }
        }

        $project->update([
            'name' => $request->name ?? $project->name,
            'description' => $request->has('description') ? $request->description : $project->description,
            'needed_roles' => $neededRoles ?? [],
            'role_requirements' => $roleRequirements ?? [],
            'documentation' => $request->has('documentation') ? $request->documentation : $project->documentation,
            'repository_url' => $request->has('repositoryUrl') ? $request->repositoryUrl : $project->repository_url,
            'status' => $request->status ?? $project->status,
        ]);

        // Record Log
        ProjectLog::create([
            'project_id' => $project->id,
            'task_id' => null,
            'user_id' => $actor->id,
            'action' => 'PROJECT_UPDATED',
            'title' => "'{$project->name}' projesi güncellendi.",
            'details' => [
                'project_name' => $project->name,
                'status' => $project->status,
                'status_changed' => $oldStatus !== $project->status,
                'old_status' => $oldStatus,
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'project' => $project]);
    }

    public function destroy(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $actor = $request->user();
        $isProjectAdmin = ($actor->role === 'ADMIN' || (string) $project->created_by_id === (string) $actor->id);

        if (!$isProjectAdmin) {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $projectName = $project->name;

        ProjectLog::create([
            'project_id' => null,
            'task_id' => null,
            'user_id' => $actor->id,
            'action' => 'PROJECT_DELETED',
            'title' => "'{$projectName}' projesi silindi.",
            'details' => ['project_name' => $projectName],
            'ip_address' => $request->ip(),
        ]);

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

        // Record Log
        ProjectLog::create([
            'project_id' => $project->id,
            'task_id' => null,
            'user_id' => $actor->id,
            'action' => 'MEMBER_APPLIED',
            'title' => "{$actor->full_name} projeye katılım talebinde bulundu ({$member->requested_role}).",
            'details' => [
                'applicant_name' => $actor->full_name,
                'requested_role' => $member->requested_role,
            ],
            'ip_address' => $request->ip(),
        ]);

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
        $project = Project::findOrFail($id);
        $actor = $request->user();
        $isProjectAdmin = ($actor->role === 'ADMIN' || (string) $project->created_by_id === (string) $actor->id);

        if (!$isProjectAdmin) {
            return response()->json(['error' => 'Yetkisiz erişim. Sadece proje yöneticisi veya sistem yöneticisi üye durumunu değiştirebilir.'], 403);
        }

        $request->validate([
            'status' => 'required|in:APPROVED,REJECTED,PENDING',
        ]);

        $member = ProjectMember::with('user')->where('project_id', $project->id)->findOrFail($memberId);

        $oldStatus = $member->status;
        $member->update(['status' => $request->status]);

        // Record Log
        ProjectLog::create([
            'project_id' => $project->id,
            'task_id' => null,
            'user_id' => $actor->id,
            'action' => 'MEMBER_STATUS_CHANGED',
            'title' => "{$member->user?->full_name} üyelik durumu '{$request->status}' olarak güncellendi.",
            'details' => [
                'member_name' => $member->user?->full_name,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'role' => $member->requested_role,
            ],
            'ip_address' => $request->ip(),
        ]);

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

    public function updateMemberRole(Request $request, $id, $memberId)
    {
        $project = Project::findOrFail($id);
        $actor = $request->user();
        $isProjectAdmin = ($actor->role === 'ADMIN' || (string) $project->created_by_id === (string) $actor->id);

        if (!$isProjectAdmin) {
            return response()->json(['error' => 'Yetkisiz erişim. Moderatörler üye rollerini değiştiremez; yalnızca proje yöneticisi rol ataması yapabilir.'], 403);
        }

        $request->validate([
            'memberRole' => 'required|in:MEMBER,MODERATOR,SPECTATOR',
        ]);

        $member = ProjectMember::with('user')->where('project_id', $project->id)->findOrFail($memberId);

        // Cannot change project creator's role away from admin
        if ((string) $member->user_id === (string) $project->created_by_id && $request->memberRole !== 'MODERATOR') {
            return response()->json(['error' => 'Proje kurucusunun yönetici yetkisi değiştirilemez.'], 400);
        }

        $role = $request->memberRole;
        $isModerator = ($role === 'MODERATOR');
        $oldRole = $member->member_role ?? ($member->is_moderator ? 'MODERATOR' : 'MEMBER');

        $member->update([
            'member_role' => $role,
            'is_moderator' => $isModerator,
        ]);

        // Record Log
        ProjectLog::create([
            'project_id' => $project->id,
            'task_id' => null,
            'user_id' => $actor->id,
            'action' => 'MEMBER_ROLE_CHANGED',
            'title' => "{$member->user?->full_name} üye rolü '{$oldRole}' -> '{$role}' olarak değiştirildi.",
            'details' => [
                'member_name' => $member->user?->full_name,
                'old_role' => $oldRole,
                'new_role' => $role,
            ],
            'ip_address' => $request->ip(),
        ]);

        // Send Telegram notification on role assignment
        if ($member->user && !empty($member->user->telegram_chat_id)) {
            if ($role === 'MODERATOR') {
                $msg = "<b>🛡️ Tebrikler! Proje Moderatörü Oldunuz!</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}\n\n" .
                    "<i>Artık bu projede görev oluşturabilir, görevleri ekip üyelerine atayabilir ve görev süreçlerini yönetebilirsiniz!</i>";
            } elseif ($role === 'SPECTATOR') {
                $msg = "<b>👁️ Proje Yetkiniz Güncellendi (Gözlemci)</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}\n" .
                    "• <b>Yetki:</b> Gözlemci (Spectator)\n\n" .
                    "<i>Bu projeyi inceleyebilir ve dokümanları görüntüleyebilirsiniz.</i>";
            } else {
                $msg = "<b>👤 Proje Yetkiniz Güncellendi (Üye)</b>\n\n" .
                    "• <b>Proje:</b> {$project->name}\n" .
                    "• <b>Yetki:</b> Geliştirici / Proje Ekip Üyesi";
            }

            $this->telegramService->sendMessage($member->user->telegram_chat_id, $msg);
        }

        return response()->json(['success' => true, 'member' => $member]);
    }

    public function toggleMemberModerator(Request $request, $id, $memberId)
    {
        $project = Project::findOrFail($id);
        $actor = $request->user();
        $isProjectAdmin = ($actor->role === 'ADMIN' || (string) $project->created_by_id === (string) $actor->id);

        if (!$isProjectAdmin) {
            return response()->json(['error' => 'Yetkisiz erişim.'], 403);
        }

        $member = ProjectMember::with('user')->where('project_id', $project->id)->findOrFail($memberId);

        $newModeratorStatus = $request->has('isModerator')
            ? (bool) $request->isModerator
            : !$member->is_moderator;

        $newRole = $newModeratorStatus ? 'MODERATOR' : 'MEMBER';

        $member->update([
            'is_moderator' => $newModeratorStatus,
            'member_role' => $newRole,
        ]);

        return response()->json(['success' => true, 'member' => $member]);
    }

    public function getLogs(Request $request, $id)
    {
        $actor = $request->user();
        if ($actor->role !== 'ADMIN') {
            return response()->json(['error' => 'Proje loglarını sadece Sistem Yöneticisi görüntüleyebilir.'], 403);
        }

        $logs = ProjectLog::with(['user:id,full_name,email,role,avatar', 'task:id,title'])
            ->where('project_id', $id)
            ->latest()
            ->limit(200)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => (string) $log->id,
                    'projectId' => (string) $log->project_id,
                    'taskId' => $log->task_id ? (string) $log->task_id : null,
                    'userId' => (string) $log->user_id,
                    'action' => $log->action,
                    'title' => $log->title,
                    'details' => $log->details,
                    'createdAt' => $log->created_at ? $log->created_at->toISOString() : null,
                    'user' => $log->user ? [
                        'id' => (string) $log->user->id,
                        'fullName' => $log->user->full_name,
                        'email' => $log->user->email,
                        'role' => $log->user->role,
                        'avatar' => $log->user->avatar,
                    ] : null,
                    'task' => $log->task ? [
                        'id' => (string) $log->task->id,
                        'title' => $log->task->title,
                    ] : null,
                ];
            });

        return response()->json(['logs' => $logs]);
    }

    public function getAllLogs(Request $request)
    {
        $actor = $request->user();
        if ($actor->role !== 'ADMIN') {
            return response()->json(['error' => 'Sistem loglarını sadece Sistem Yöneticisi görüntüleyebilir.'], 403);
        }

        $logs = ProjectLog::with(['user:id,full_name,email,role,avatar', 'project:id,name', 'task:id,title'])
            ->latest()
            ->limit(300)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => (string) $log->id,
                    'projectId' => $log->project_id ? (string) $log->project_id : null,
                    'projectName' => $log->project ? $log->project->name : null,
                    'taskId' => $log->task_id ? (string) $log->task_id : null,
                    'userId' => (string) $log->user_id,
                    'action' => $log->action,
                    'title' => $log->title,
                    'details' => $log->details,
                    'createdAt' => $log->created_at ? $log->created_at->toISOString() : null,
                    'user' => $log->user ? [
                        'id' => (string) $log->user->id,
                        'fullName' => $log->user->full_name,
                        'email' => $log->user->email,
                        'role' => $log->user->role,
                        'avatar' => $log->user->avatar,
                    ] : null,
                    'task' => $log->task ? [
                        'id' => (string) $log->task->id,
                        'title' => $log->task->title,
                    ] : null,
                ];
            });

        return response()->json(['logs' => $logs]);
    }
}
