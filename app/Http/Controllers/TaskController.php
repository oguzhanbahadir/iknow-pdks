<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
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

        $user = $request->user();

        $task = Task::create([
            'title' => trim($request->title),
            'description' => $request->description,
            'status' => $request->status ?? 'TODO',
            'priority' => $request->priority ?? 'MEDIUM',
            'category' => $request->category ?? 'Geliştirme',
            'assigned_user_id' => $request->assignedUserId ?? ($user ? $user->id : 1),
            'created_by_id' => $user ? $user->id : null,
            'estimated_hours' => $request->estimatedHours ?? 4,
            'actual_hours' => $request->actualHours ?? 0,
            'task_date' => $request->taskDate ?? now()->toDateString(),
        ]);

        return response()->json(['success' => true, 'task' => $task], 201);
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

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

        return response()->json(['success' => true, 'task' => $task]);
    }

    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['success' => true]);
    }
}
