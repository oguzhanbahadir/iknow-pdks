<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Task;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $authUser = $request->user();

        if ($authUser && $authUser->role !== 'ADMIN') {
            $userIdFilter = (string) $authUser->id;
        } else {
            $userIdFilter = $request->query('userId', 'ALL');
        }

        $usersQuery = User::where('role', 'USER');
        if ($userIdFilter !== 'ALL') {
            $usersQuery->where('id', $userIdFilter);
        }

        $interns = $usersQuery->with('tasksAssigned')->get();

        $stats = $interns->map(function ($u) {
            $tasks = $u->tasksAssigned;
            $totalTasks = $tasks->count();
            $completedTasks = $tasks->where('status', 'DONE')->count();
            $estimatedHours = $tasks->sum('estimated_hours');
            $actualHours = $tasks->sum('actual_hours');

            $efficiencyScore = $estimatedHours > 0
                ? min(100, round(($actualHours / $estimatedHours) * 100))
                : 100;

            return [
                'id' => (string) $u->id,
                'name' => $u->full_name,
                'department' => $u->department ?? 'Yazılım',
                'estimatedHours' => (float) $estimatedHours,
                'actualHours' => (float) $actualHours,
                'completedTasks' => $completedTasks,
                'totalTasks' => $totalTasks,
                'efficiencyScore' => (int) $efficiencyScore,
            ];
        });

        return response()->json(['stats' => $stats]);
    }
}
