<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\InternController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrientationController;
use App\Http\Controllers\TelegramController;
use App\Http\Controllers\TelegramWebhookController;

// Public Auth & Webhook Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handleWebhook']);

// Protected Sanctum Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);

    Route::get('/interns', [InternController::class, 'index']);
    Route::post('/interns/create', [InternController::class, 'createManual']);
    Route::post('/interns/reset-password', [InternController::class, 'resetPassword']);
    Route::get('/interns/{id}', [InternController::class, 'show']);
    Route::post('/interns', [InternController::class, 'storeScoreOrIntegration']);
    Route::delete('/interns/{id}', [InternController::class, 'destroy']);
    Route::post('/interns/{id}/toggle-approve', [InternController::class, 'toggleApprove']);

    Route::post('/cv', [CvController::class, 'store']);
    Route::get('/stats', [StatsController::class, 'index']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/onboarding', [UserController::class, 'saveOnboarding']);

    Route::get('/orientations', [OrientationController::class, 'index']);
    Route::get('/orientations/{id}', [OrientationController::class, 'show']);
    Route::post('/orientations', [OrientationController::class, 'store']);
    Route::put('/orientations/{id}', [OrientationController::class, 'update']);
    Route::delete('/orientations/{id}', [OrientationController::class, 'destroy']);

    Route::get('/telegram/status', [TelegramController::class, 'getStatus']);
    Route::post('/telegram/test', [TelegramController::class, 'sendTestMessage']);
    Route::post('/telegram/send', [TelegramController::class, 'sendMessage']);
    Route::post('/telegram/poll-updates', [TelegramWebhookController::class, 'pollUpdates']);
});
