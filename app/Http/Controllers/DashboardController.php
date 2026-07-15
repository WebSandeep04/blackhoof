<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;
use App\Models\Blog;
use App\Models\Catalogue;
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
        $totalCatalogues = Catalogue::count();
        $totalBlackhoofCategories = Category::where('category_for', 'blackhoof')->count();
        $totalSatkirtiCategories = Category::where('category_for', 'satkirti')->count();
        $totalCategories = Category::count();

        // 2. Recent data (optimized, without loading large relationships unless necessary)
        $latestProducts = Product::with('category')->latest()->take(5)->get();
        $latestCatalogues = Catalogue::with('user')->latest()->take(5)->get();

        return response()->json([
            'stats' => [
                'products_blackhoof' => $totalBlackhoofProducts,
                'products_satkirti' => $totalSatkirtiProducts,
                'users' => $totalUsers,
                'blogs' => $totalBlogs,
                'catalogues' => $totalCatalogues,
                'categories_blackhoof' => $totalBlackhoofCategories,
                'categories_satkirti' => $totalSatkirtiCategories,
                'categories' => $totalCategories,
            ],
            'recent' => [
                'products' => $latestProducts,
                'catalogues' => $latestCatalogues
            ]
        ]);
    }
}
