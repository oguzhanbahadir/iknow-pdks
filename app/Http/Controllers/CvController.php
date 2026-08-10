<?php

namespace App\Http\Controllers;

use App\Models\CvFile;
use Illuminate\Http\Request;

class CvController extends Controller
{
    public function store(Request $request)
    {
        $userId = $request->userId ?? ($request->user() ? $request->user()->id : null);

        if (!$userId) {
            return response()->json(['error' => 'Kullanıcı kimliği bulunamadı.'], 400);
        }

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => 'required|file|mimes:pdf|max:1024',
            ], [
                'file.mimes' => 'Yalnızca PDF formatında CV yükleyebilirsiniz.',
                'file.max' => 'CV dosya boyutu maksimum 1 MB (1024 KB) olabilir.',
            ]);

            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $path = $file->store('cvs', 'public');
            $fileUrl = '/storage/' . $path;
            $fileSize = $file->getSize();
        } else {
            $request->validate([
                'fileName' => 'required|string',
            ]);

            $fileName = trim($request->fileName);
            $fileUrl = '/docs/' . $fileName;
            $fileSize = $request->fileSize ?? 1048576;
        }

        $cv = CvFile::create([
            'user_id' => $userId,
            'file_name' => $fileName,
            'file_url' => $fileUrl,
            'file_size' => $fileSize,
        ]);

        return response()->json(['success' => true, 'cv' => $cv]);
    }
}
