<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class CatalogueController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images', 'variants'])
                    ->where('is_active', true)
                    ->where('include_in_catalogue', true);

        if ($request->filled('brand')) {
            $query->where('product_for', $request->brand);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->paginate(12);

        // Append the full URL for images
        $products->getCollection()->transform(function ($product) {
            $product->images->transform(function ($image) {
                $image->url = $image->url;
                return $image;
            });
            return $product;
        });

        return response()->json($products);
    }
}
