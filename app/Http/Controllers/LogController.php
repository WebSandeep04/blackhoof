<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class LogController extends Controller
{
    /**
     * Get paginated audit logs.
     */
    public function index(Request $request)
    {
        $query = Activity::with(['causer', 'subject'])->latest();

        // Optional filtering by subject type (e.g. App\Models\Product)
        if ($request->has('subject_type')) {
            $query->where('subject_type', $request->input('subject_type'));
        }

        // Optional filtering by subject id
        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        // Fetch related logs (Variants and Images) for a specific product
        if ($request->has('related_product_id')) {
            $query->whereIn('subject_type', [\App\Models\ProductVariant::class, \App\Models\ProductImage::class, \App\Models\ProductVideo::class])
                  ->where('properties->product_id', (int) $request->input('related_product_id'));
        }

        $logs = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }

    /**
     * Get grouped audit logs (by product_id).
     */
    public function groupedIndex(Request $request)
    {
        $groups = Activity::selectRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(properties, '$.product_id')), CASE WHEN subject_type = 'App\\\\Models\\\\Product' THEN subject_id ELSE NULL END) as product_id, MAX(created_at) as last_activity, COUNT(*) as log_count")
            ->where(function ($query) {
                $query->whereNotNull('properties->product_id')
                      ->orWhere('subject_type', \App\Models\Product::class);
            })
            ->groupBy('product_id')
            ->orderByDesc('last_activity')
            ->paginate(20);

        $productIds = $groups->pluck('product_id')->filter();
        $products = \App\Models\Product::whereIn('id', $productIds)->get()->keyBy('id');

        $formattedData = $groups->map(function($group) use ($products) {
            $product = $products->get($group->product_id);
            return [
                'product_id' => $group->product_id,
                'product_name' => $product ? $product->name : 'Deleted Product (ID: ' . $group->product_id . ')',
                'last_activity' => $group->last_activity,
                'log_count' => $group->log_count,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'data' => $formattedData,
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
                'total' => $groups->total(),
            ]
        ]);
    }

    /**
     * Get the log trail for a specific product.
     */
    public function getTrail(Request $request, $productId)
    {
        $query = Activity::with(['causer', 'subject'])
            ->where(function ($q) use ($productId) {
                $q->where('properties->product_id', (int) $productId)
                  ->orWhere(function ($q2) use ($productId) {
                      $q2->where('subject_type', \App\Models\Product::class)
                         ->where('subject_id', (int) $productId);
                  });
            })
            ->latest();
            
        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ]);
    }
}
