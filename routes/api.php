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
use App\Http\Controllers\SavedCatalogueController;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/forgot-password/reset', [AuthController::class, 'verifyOtpAndResetPassword']);
Route::get('/catalogue', [CatalogueController::class, 'index']);
Route::get('/saved-catalogues/{id}/download', [SavedCatalogueController::class, 'download']);
Route::post('/inqueries', [\App\Http\Controllers\InqueryController::class, 'store']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Cart Endpoints
    Route::get('/cart', [SavedCatalogueController::class, 'getCart']);
    Route::post('/cart/add', [SavedCatalogueController::class, 'addToCart']);
    Route::post('/cart/remove', [SavedCatalogueController::class, 'removeFromCart']);
    Route::post('/cart/clear', [SavedCatalogueController::class, 'clearCart']);
    Route::post('/cart/checkout', [SavedCatalogueController::class, 'checkout']);

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
    
    // Saved Catalogues management
    Route::get('saved-catalogues', [SavedCatalogueController::class, 'index']);
    Route::post('saved-catalogues/{id}/load-to-draft', [SavedCatalogueController::class, 'loadToDraft']);
    Route::delete('saved-catalogues/{id}', [SavedCatalogueController::class, 'destroy']);
    Route::get('saved-catalogues/{id}/versions', [SavedCatalogueController::class, 'versions']);
    
    Route::get('permissions', function () {
        return response()->json(\Spatie\Permission\Models\Permission::all());
    });
    Route::apiResource('inquiry_statuses', \App\Http\Controllers\InquiryStatusController::class);
});
