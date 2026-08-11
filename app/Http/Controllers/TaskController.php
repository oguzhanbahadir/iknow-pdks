<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected TelegramService $telegramService;

    public function __construct(TelegramService $telegramService)
    {
        $this->telegramService = $telegramService;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Task::with(['assignedUser', 'createdBy', 'project:id,name']);

        if ($request->has('project_id') && !empty($request->project_id)) {
            $query->where('project_id', $request->project_id);
        }

        if ($user && $user->role !== 'ADMIN') {
            $query->where('assigned_user_id', $user->id);
        }

        $tasks = $query->latest()->get()->map(function ($t) {
            return [
                'id' => (string) $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'status' => $t->status,
                'priority' => $t->priority,
                'category' => $t->category,
                'projectId' => $t->project_id ? (string) $t->project_id : null,
                'project' => $t->project ? [
                    'id' => (string) $t->project->id,
                    'name' => $t->project->name,
                ] : null,
                'assignedUserId' => (string) $t->assigned_user_id,
                'createdById' => (string) $t->created_by_id,
                'estimatedHours' => (float) $t->estimated_hours,
                'actualHours' => (float) $t->actual_hours,
                'taskDate' => $t->task_date,
                'assignedUser' => $t->assignedUser ? [
                    'id' => (string) $t->assignedUser->id,
                    'fullName' => $t->assignedUser->full_name,
                    'email' => $t->assignedUser->email,
                ] : null,
            ];
        });

        return response()->json(['tasks' => $tasks]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
        ]);

        $actor = $request->user();

        $task = Task::create([
            'title' => trim($request->title),
            'description' => $request->description,
            'status' => $request->status ?? 'TODO',
            'priority' => $request->priority ?? 'MEDIUM',
            'category' => $request->category ?? 'Geliştirme',
            'project_id' => !empty($request->projectId) ? $request->projectId : (!empty($request->project_id) ? $request->project_id : null),
            'assigned_user_id' => $request->assignedUserId ?? ($actor ? $actor->id : 1),
            'created_by_id' => $actor ? $actor->id : null,
            'estimated_hours' => $request->estimatedHours ?? 4,
            'actual_hours' => $request->actualHours ?? 0,
            'task_date' => $request->taskDate ?? now()->toDateString(),
        ]);

        $assignedUser = User::find($task->assigned_user_id);

        // Send Telegram notification if created by someone else
        if ($assignedUser && !empty($assignedUser->telegram_chat_id) && ($actor->id ?? 0) !== $assignedUser->id) {
            $priorityMap = ['LOW' => '🔵 Düşük', 'MEDIUM' => '🟡 Orta', 'HIGH' => '🔴 Yüksek'];
            $pr = $priorityMap[$task->priority] ?? $task->priority;
            $actorName = $actor ? $actor->full_name : 'Sistem Yöneticisi';

            $msg = "<b>📌 Size Yeni Bir Görev Atandı!</b>\n\n" .
                "• <b>Görev:</b> {$task->title}\n" .
                "• <b>Atayan:</b> {$actorName}\n" .
                "• <b>Öncelik:</b> {$pr}\n" .
                "• <b>Tahmini Efor:</b> {$task->estimated_hours} Saat\n" .
                ($task->description ? "• <b>Açıklama:</b> <i>{$task->description}</i>\n" : "") . "\n" .
                "<i>Görevlerinizi Telegram'dan /tasks yazarak takip edebilirsiniz.</i>";

            $this->telegramService->sendMessage($assignedUser->telegram_chat_id, $msg);
        }

        return response()->json(['success' => true, 'task' => $task], 201);
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $oldStatus = $task->status;
        $oldAssignedId = $task->assigned_user_id;

        $task->update([
            'title' => $request->title ?? $task->title,
            'description' => $request->has('description') ? $request->description : $task->description,
            'status' => $request->status ?? $task->status,
            'priority' => $request->priority ?? $task->priority,
            'category' => $request->category ?? $task->category,
            'project_id' => $request->has('projectId') ? ($request->projectId ?: null) : ($request->has('project_id') ? ($request->project_id ?: null) : $task->project_id),
            'assigned_user_id' => $request->assignedUserId ?? $task->assigned_user_id,
            'estimated_hours' => $request->estimatedHours ?? $task->estimated_hours,
            'actual_hours' => $request->actualHours ?? $task->actual_hours,
            'task_date' => $request->taskDate ?? $task->task_date,
        ]);

        $actor = $request->user();
        $assignedUser = User::find($task->assigned_user_id);

        // Send Telegram notification if updated by someone else
        if ($assignedUser && !empty($assignedUser->telegram_chat_id) && ($actor->id ?? 0) !== $assignedUser->id) {
            $statusMap = [
                'TODO' => '⏳ Yapılacak',
                'IN_PROGRESS' => '🔄 Devam Ediyor',
                'IN_REVIEW' => '👀 İncelemede',
                'DONE' => '✅ Tamamlandı',
            ];

            if ($oldStatus !== $task->status) {
                $oldSt = $statusMap[$oldStatus] ?? $oldStatus;
                $newSt = $statusMap[$task->status] ?? $task->status;
                $actorName = $actor ? $actor->full_name : 'Yönetici';

                $msg = "<b>🔄 Görevinizin Statüsü Güncellendi!</b>\n\n" .
                    "• <b>Görev:</b> {$task->title}\n" .
                    "• <b>Güncelleyen:</b> {$actorName}\n" .
                    "• <b>Eski Durum:</b> {$oldSt}\n" .
                    "• <b>Yeni Durum:</b> <b>{$newSt}</b>";

                $this->telegramService->sendMessage($assignedUser->telegram_chat_id, $msg);
            } elseif ($oldAssignedId != $task->assigned_user_id) {
                $actorName = $actor ? $actor->full_name : 'Yönetici';

                $msg = "<b>📌 Size Bir Görev Atandı!</b>\n\n" .
                    "• <b>Görev:</b> {$task->title}\n" .
                    "• <b>Atayan:</b> {$actorName}\n" .
                    "• <b>Durum:</b> {$task->status}";

                $this->telegramService->sendMessage($assignedUser->telegram_chat_id, $msg);
            }
        }

        return response()->json(['success' => true, 'task' => $task]);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $assignedUser = User::find($task->assigned_user_id);
        $actor = $request->user();
        $taskTitle = $task->title;

        $task->delete();

        // Send Telegram notification if deleted by someone else
        if ($assignedUser && !empty($assignedUser->telegram_chat_id) && ($actor->id ?? 0) !== $assignedUser->id) {
            $actorName = $actor ? $actor->full_name : 'Yönetici';

            $msg = "<b>🗑️ Bir Göreviniz Silindi!</b>\n\n" .
                "• <b>Görev:</b> {$taskTitle}\n" .
                "• <b>Silen Kişi:</b> {$actorName}";

            $this->telegramService->sendMessage($assignedUser->telegram_chat_id, $msg);
        }

        return response()->json(['success' => true]);
    }

    public function getComments($id)
    {
        $task = Task::findOrFail($id);
        $comments = TaskComment::with('user')
            ->where('task_id', $task->id)
            ->oldest()
            ->get()
            ->map(function ($c) {
                return [
                    'id' => (string) $c->id,
                    'taskId' => (string) $c->task_id,
                    'userId' => (string) $c->user_id,
                    'message' => $c->message,
                    'createdAt' => $c->created_at ? $c->created_at->toISOString() : null,
                    'user' => $c->user ? [
                        'id' => (string) $c->user->id,
                        'fullName' => $c->user->full_name,
                        'email' => $c->user->email,
                        'role' => $c->user->role,
                        'avatar' => $c->user->avatar,
                    ] : null,
                ];
            });

        return response()->json(['comments' => $comments]);
    }

    public function storeComment(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
        ]);

        $task = Task::with(['assignedUser', 'createdBy'])->findOrFail($id);
        $actor = $request->user();

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $actor->id,
            'message' => trim($request->message),
        ]);

        // Telegram Notifications for task commentary
        $recipients = [];
        if ($task->assignedUser && $task->assignedUser->id !== $actor->id && !empty($task->assignedUser->telegram_chat_id)) {
            $recipients[] = $task->assignedUser;
        }
        if ($task->createdBy && $task->createdBy->id !== $actor->id && !empty($task->createdBy->telegram_chat_id)) {
            if (!$task->assignedUser || $task->createdBy->id !== $task->assignedUser->id) {
                $recipients[] = $task->createdBy;
            }
        }

        foreach ($recipients as $recipient) {
            $msg = "<b>💬 Görevinize Yeni Bir Yorum Yapıldı!</b>\n\n" .
                "• <b>Görev:</b> {$task->title}\n" .
                "• <b>Yazan:</b> {$actor->full_name}\n" .
                "• <b>Yorum:</b> <i>" . htmlspecialchars($comment->message) . "</i>\n\n" .
                "<i>Görevlerinizi ve yazışmaları PDKS Portal üzerinden takip edebilirsiniz.</i>";

            $this->telegramService->sendMessage($recipient->telegram_chat_id, $msg);
        }

        $comment->load('user');

        return response()->json([
            'success' => true,
            'comment' => [
                'id' => (string) $comment->id,
                'taskId' => (string) $comment->task_id,
                'userId' => (string) $comment->user_id,
                'message' => $comment->message,
                'createdAt' => $comment->created_at ? $comment->created_at->toISOString() : null,
                'user' => $comment->user ? [
                    'id' => (string) $comment->user->id,
                    'fullName' => $comment->user->full_name,
                    'email' => $comment->user->email,
                    'role' => $comment->user->role,
                    'avatar' => $comment->user->avatar,
                ] : null,
            ]
        ], 201);
    }
}

