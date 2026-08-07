<?php

use Illuminate\Support\Facades\Route;

// Serve React SPA Built index.html for all non-API web routes
Route::fallback(function () {
    $indexPath = public_path('index.html');
    if (file_exists($indexPath)) {
        return file_get_contents($indexPath);
    }
    return response('IKnow PDKS App is running. Please build the frontend.', 200);
});
