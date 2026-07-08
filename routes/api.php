<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AttributeController;
use App\Http\Controllers\ProductController;

use App\Http\Controllers\CatalogueController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/catalogue', [CatalogueController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Admin routes (e.g. requires Admin role)
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('roles', RoleController::class);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('attributes', AttributeController::class);
        Route::apiResource('products', ProductController::class);
        Route::get('permissions', function () {
            return response()->json(\Spatie\Permission\Models\Permission::all());
        });
    });
});
