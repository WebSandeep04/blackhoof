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

        // Fetch variant logs for a specific product
        if ($request->has('variant_product_id')) {
            $query->where('subject_type', \App\Models\ProductVariant::class)
                  ->where('properties->product_id', $request->input('variant_product_id'));
        }

        $logs = $query->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }
}
