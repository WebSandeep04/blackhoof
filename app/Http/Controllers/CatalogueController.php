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

        if ($request->filled('attributes') && is_array($request->attributes)) {
            $query->whereHas('variants.attributeValues', function ($q) use ($request) {
                $q->whereIn('attribute_values.id', $request->attributes);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                  ->orWhere('description', 'like', $searchTerm);
            });
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
