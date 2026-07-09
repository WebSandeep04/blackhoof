<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use App\Models\Blog;
use App\Models\SavedCatalogue;
use App\Models\Category;
use Spatie\Permission\Models\Role;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Retrieve aggregated statistics for the admin dashboard.
     */
    public function stats(Request $request)
    {
        // 1. Core aggregates
        $totalBlackhoofProducts = Product::where('product_for', 'blackhoof')->count();
        $totalSatkirtiProducts = Product::where('product_for', 'satkirti')->count();
        $totalUsers = User::count();
        $totalBlogs = Blog::count();
        $totalCatalogues = SavedCatalogue::where('status', 'completed')->count();
        $totalCategories = Category::count();

        // 2. Recent data (optimized, without loading large relationships unless necessary)
        $latestProducts = Product::with('category')->latest()->take(5)->get();
        $latestCatalogues = SavedCatalogue::with('user')->where('status', 'completed')->latest()->take(5)->get();

        return response()->json([
            'stats' => [
                'products_blackhoof' => $totalBlackhoofProducts,
                'products_satkirti' => $totalSatkirtiProducts,
                'users' => $totalUsers,
                'blogs' => $totalBlogs,
                'catalogues' => $totalCatalogues,
                'categories' => $totalCategories,
            ],
            'recent' => [
                'products' => $latestProducts,
                'catalogues' => $latestCatalogues
            ]
        ]);
    }
}
