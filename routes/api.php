<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\InternController;
use App\Http\Controllers\CvController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\TelegramWebhookController;

// Public Auth & Webhook Routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handle']);

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

    Route::post('/cv', [CvController::class, 'store']);
    Route::get('/stats', [StatsController::class, 'index']);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/onboarding', [UserController::class, 'saveOnboarding']);

    Route::get('/telegram/status', [TelegramWebhookController::class, 'status']);
    Route::post('/telegram/unlink', [TelegramWebhookController::class, 'unlink']);
});

