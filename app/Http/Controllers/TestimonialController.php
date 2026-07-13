<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Testimonial;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class TestimonialController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view testimonials', only: ['index', 'show']),
            new Middleware('permission:create testimonials|edit testimonials', only: ['store', 'update']),
            new Middleware('permission:delete testimonials', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Testimonial::query();

        if ($request->filled('search')) {
            $query->where('given_by', 'like', "%{$request->search}%")
                  ->orWhere('text', 'like', "%{$request->search}%");
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return response()->json($query->latest()->paginate(10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string',
            'given_by' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $testimonial = Testimonial::create($validated);
        return response()->json($testimonial, 201);
    }

    public function show(Testimonial $testimonial)
    {
        return response()->json($testimonial);
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'text' => 'required|string',
            'given_by' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $testimonial->update($validated);
        return response()->json($testimonial);
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();
        return response()->json(null, 204);
    }
}
