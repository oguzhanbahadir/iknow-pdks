<?php

namespace App\Http\Controllers;

use App\Models\Task;
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

        $query = Task::with(['assignedUser', 'createdBy']);

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

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['success' => true]);
    }
}
