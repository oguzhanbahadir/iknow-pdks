<?php

namespace App\Http\Controllers;

use App\Models\OrientationDocument;
use App\Models\User;
use Illuminate\Http\Request;

class OrientationController extends Controller
{
    private function formatDocument(OrientationDocument $doc)
    {
        $assignedIds = $doc->assigned_user_ids ?? [];
        // Map assigned user details for convenience
        $assignedUsers = [];
        if (!empty($assignedIds)) {
            $assignedUsers = User::whereIn('id', $assignedIds)->get()->map(function ($u) {
                return [
                    'id' => (string) $u->id,
                    'fullName' => $u->full_name,
                    'email' => $u->email,
                    'avatar' => $u->avatar,
                    'department' => $u->department,
                ];
            });
        }

        return [
            'id' => (string) $doc->id,
            'title' => $doc->title,
            'description' => $doc->description,
            'content' => $doc->content,
            'category' => $doc->category ?? 'Proje Kurulumu',
            'isPublic' => (bool) $doc->is_public,
            'assignedUserIds' => array_map('strval', $assignedIds),
            'assignedUsers' => $assignedUsers,
            'createdById' => $doc->created_by_id ? (string) $doc->created_by_id : null,
            'createdAt' => $doc->created_at ? $doc->created_at->toIso8601String() : null,
            'updatedAt' => $doc->updated_at ? $doc->updated_at->toIso8601String() : null,
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['error' => 'Oturum bulunamadı.'], 401);
        }

        if ($user->role === 'ADMIN') {
            $docs = OrientationDocument::latest()->get();
        } else {
            $userIdStr = (string) $user->id;
            $userIdInt = (int) $user->id;

            $docs = OrientationDocument::latest()->get()->filter(function ($doc) use ($userIdStr, $userIdInt) {
                if ($doc->is_public) {
                    return true;
                }
                $assigned = $doc->assigned_user_ids ?? [];
                return in_array($userIdStr, $assigned, true) || in_array($userIdInt, $assigned, true);
            })->values();
        }

        $formatted = $docs->map(function ($doc) {
            return $this->formatDocument($doc);
        });

        return response()->json(['documents' => $formatted]);
    }

    public function show($id, Request $request)
    {
        $user = $request->user();
        $doc = OrientationDocument::findOrFail($id);

        if ($user->role !== 'ADMIN') {
            $userIdStr = (string) $user->id;
            $userIdInt = (int) $user->id;
            $assigned = $doc->assigned_user_ids ?? [];

            if (!$doc->is_public && !in_array($userIdStr, $assigned, true) && !in_array($userIdInt, $assigned, true)) {
                return response()->json(['error' => 'Bu oryantasyon dokümanına erişim izniniz bulunmamaktadır.'], 403);
            }
        }

        return response()->json(['document' => $this->formatDocument($doc)]);
    }

    public function store(Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
        ]);

        $assignedIds = $request->assignedUserIds ?? [];

        $doc = OrientationDocument::create([
            'title' => trim($request->title),
            'description' => $request->description ? trim($request->description) : null,
            'content' => $request->content,
            'category' => $request->category ?? 'Proje Kurulumu',
            'created_by_id' => $admin->id,
            'is_public' => (bool) ($request->isPublic ?? false),
            'assigned_user_ids' => array_map('strval', $assignedIds),
        ]);

        return response()->json(['success' => true, 'document' => $this->formatDocument($doc)], 201);
    }

    public function update($id, Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $doc = OrientationDocument::findOrFail($id);

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
        ]);

        $assignedIds = $request->assignedUserIds ?? [];

        $doc->update([
            'title' => trim($request->title),
            'description' => $request->description ? trim($request->description) : null,
            'content' => $request->content,
            'category' => $request->category ?? $doc->category,
            'is_public' => (bool) ($request->isPublic ?? false),
            'assigned_user_ids' => array_map('strval', $assignedIds),
        ]);

        return response()->json(['success' => true, 'document' => $this->formatDocument($doc)]);
    }

    public function destroy($id, Request $request)
    {
        $admin = $request->user();

        if (!$admin || $admin->role !== 'ADMIN') {
            return response()->json(['error' => 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.'], 403);
        }

        $doc = OrientationDocument::findOrFail($id);
        $doc->delete();

        return response()->json(['success' => true, 'message' => 'Oryantasyon rehberi başarıyla silindi.']);
    }
}
