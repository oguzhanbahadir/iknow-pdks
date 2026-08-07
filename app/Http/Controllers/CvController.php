<?php

namespace App\Http\Controllers;

use App\Models\CvFile;
use Illuminate\Http\Request;

class CvController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'userId' => 'required|exists:users,id',
            'fileName' => 'required|string',
        ]);

        $fileName = trim($request->fileName);
        $fileUrl = '/docs/' . $fileName;

        $cv = CvFile::create([
            'user_id' => $request->userId,
            'file_name' => $fileName,
            'file_url' => $fileUrl,
            'file_size' => 1048576,
        ]);

        return response()->json(['success' => true, 'cv' => $cv]);
    }
}
