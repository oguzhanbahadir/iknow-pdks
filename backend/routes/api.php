<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\InternController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrientationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TelegramController;
use App\Http\Controllers\TelegramWebhookController;
use App\Http\Controllers\MailController;

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
    Route::post('/tasks/{id}/archive', [TaskController::class, 'archive']);
    Route::post('/tasks/{id}/unarchive', [TaskController::class, 'unarchive']);
    Route::get('/tasks/{id}/comments', [TaskController::class, 'getComments']);
    Route::post('/tasks/{id}/comments', [TaskController::class, 'storeComment']);
    Route::post('/tasks/{id}/attachments', [TaskController::class, 'uploadAttachment']);
    Route::delete('/tasks/{id}/attachments/{attachmentId}', [TaskController::class, 'deleteAttachment']);

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
    Route::get('/profile', [UserController::class, 'getProfile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/users/create-admin', [UserController::class, 'createAdmin']);
    Route::post('/users/{id}/telegram-chat-id', [UserController::class, 'updateTelegramChatId']);
    Route::post('/onboarding', [UserController::class, 'saveOnboarding']);
    Route::post('/system/storage-link', [UserController::class, 'linkStorage']);

    Route::get('/orientations', [OrientationController::class, 'index']);
    Route::get('/orientations/{id}', [OrientationController::class, 'show']);
    Route::post('/orientations', [OrientationController::class, 'store']);
    Route::put('/orientations/{id}', [OrientationController::class, 'update']);
    Route::delete('/orientations/{id}', [OrientationController::class, 'destroy']);

    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::post('/projects/{id}/apply', [ProjectController::class, 'apply']);
    Route::post('/projects/{id}/members/{memberId}', [ProjectController::class, 'updateMemberStatus']);
    Route::post('/projects/{id}/members/{memberId}/role', [ProjectController::class, 'updateMemberRole']);
    Route::get('/projects/{id}/logs', [ProjectController::class, 'getLogs']);
    Route::get('/project-logs', [ProjectController::class, 'getAllLogs']);
    Route::post('/projects/{id}/members/{memberId}/toggle-moderator', [ProjectController::class, 'toggleMemberModerator']);

    Route::get('/telegram/status', [TelegramController::class, 'getStatus']);
    Route::post('/telegram/set-webhook', [TelegramController::class, 'setWebhook']);
    Route::post('/telegram/test', [TelegramController::class, 'sendTestMessage']);
    Route::post('/telegram/send', [TelegramController::class, 'sendMessage']);
    Route::post('/telegram/poll-updates', [TelegramWebhookController::class, 'pollUpdates']);

    // Mail & Webmail Routes
    Route::get('/mail/account', [MailController::class, 'getAccount']);
    Route::post('/mail/account', [MailController::class, 'saveAccount']);
    Route::post('/mail/test', [MailController::class, 'testConnection']);
    Route::get('/mail/inbox', [MailController::class, 'getInbox']);
    Route::get('/mail/messages/{uid}', [MailController::class, 'getMessage']);
    Route::post('/mail/send', [MailController::class, 'sendMail']);
    Route::delete('/mail/messages/{uid}', [MailController::class, 'deleteMessage']);
    Route::post('/mail/convert-to-task', [MailController::class, 'convertEmailToTask']);
});
