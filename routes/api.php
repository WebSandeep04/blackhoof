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

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/catalogue', [CatalogueController::class, 'index']);
Route::get('/saved-catalogues/{id}/download', [SavedCatalogueController::class, 'download']);

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

    // Admin routes (e.g. requires Admin role)
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('roles', RoleController::class);
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('attributes', AttributeController::class);
        Route::apiResource('products', ProductController::class);
        Route::apiResource('blog-categories', BlogCategoryController::class);
        
        // Saved Catalogues management
        Route::get('saved-catalogues', [SavedCatalogueController::class, 'index']);
        Route::delete('saved-catalogues/{id}', [SavedCatalogueController::class, 'destroy']);
        
        Route::get('permissions', function () {
            return response()->json(\Spatie\Permission\Models\Permission::all());
        });
    });
});
