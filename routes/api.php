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
use App\Http\Controllers\CatalogueManagerController;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/forgot-password/reset', [AuthController::class, 'verifyOtpAndResetPassword']);
Route::get('/catalogue', [CatalogueController::class, 'index']);
Route::get('/catalogues/{id}/download', [CatalogueManagerController::class, 'download']);
Route::post('/catalogues/{id}/load-for-edit', [CatalogueManagerController::class, 'loadForEdit']);
Route::post('/catalogues/{id}/save-draft-as-version', [CatalogueManagerController::class, 'saveDraftAsVersion']);
Route::post('/inqueries', [\App\Http\Controllers\InqueryController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    Route::post('/catalogues/generate', [CatalogueManagerController::class, 'generate']);

    // Admin routes (Protected by Controller-level Spatie permissions)
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    
    Route::apiResource('users', UserController::class);
    Route::apiResource('roles', RoleController::class);
    
    Route::apiResource('categories', CategoryController::class);
    Route::post('categories/{id}/attributes', [CategoryController::class, 'syncAttributes']);
    
    Route::apiResource('attributes', AttributeController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('blog-categories', BlogCategoryController::class);
    Route::apiResource('blogs', BlogController::class);
    Route::apiResource('testimonials', \App\Http\Controllers\TestimonialController::class);
    
    // We already have a public store for inqueries, so we exclude store here
    Route::apiResource('inqueries', \App\Http\Controllers\InqueryController::class)->except(['store']);
    
    // Catalogues management
    Route::get('catalogues', [CatalogueManagerController::class, 'index']);
    Route::get('catalogues/{id}/versions', [CatalogueManagerController::class, 'versions']);
    Route::delete('catalogues/{id}', [CatalogueManagerController::class, 'destroy']);
    
    Route::get('permissions', function () {
        return response()->json(\Spatie\Permission\Models\Permission::all());
    });
    Route::apiResource('inquiry_statuses', \App\Http\Controllers\InquiryStatusController::class);
    Route::get('login-logs', [\App\Http\Controllers\LoginLogController::class, 'index']);
    Route::get('audit-logs', [\App\Http\Controllers\LogController::class, 'index']);
    Route::apiResource('countries', \App\Http\Controllers\CountryController::class);
    Route::apiResource('customers', \App\Http\Controllers\CustomerController::class);
});
