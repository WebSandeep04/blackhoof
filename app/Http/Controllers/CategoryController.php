<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view categories', only: ['index', 'show']),
            new Middleware('permission:create categories', only: ['store']),
            new Middleware('permission:edit categories', only: ['update']),
            new Middleware('permission:delete categories', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Category::with('parent', 'attributes');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->query('all') === 'true') {
            return response()->json(Category::with('attributes')->orderBy('name')->get());
        }

        $categories = $query->paginate(10);
        return response()->json($categories);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('categories', 'public');
        }

        $category = Category::create([
            'name' => $request->name,
            'slug' => $request->slug,
            'parent_id' => $request->parent_id,
            'is_active' => $request->is_active ?? true,
            'image' => $imagePath,
        ]);

        return response()->json($category->load('parent', 'attributes'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::with('parent', 'attributes')->findOrFail($id);
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories')->ignore($category->id),
            ],
            'parent_id' => 'nullable|exists:categories,id|not_in:' . $category->id,
            'is_active' => 'boolean',
            'image' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        $data = [
            'name' => $request->name,
            'slug' => $request->slug,
            'parent_id' => $request->parent_id,
            'is_active' => $request->has('is_active') ? $request->is_active : $category->is_active,
        ];

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $data['image'] = $request->file('image')->store('categories', 'public');
        }

        $category->update($data);

        return response()->json($category->load('parent', 'attributes'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);
        
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }
        
        $category->delete();
        return response()->json(null, 204);
    }

    /**
     * Sync attributes for the category.
     */
    public function syncAttributes(Request $request, $id)
    {
        $request->validate([
            'attributes' => 'array',
            'attributes.*' => 'exists:attributes,id',
        ]);

        $category = Category::findOrFail($id);
        $category->attributes()->sync($request->attributes ?? []);

        return response()->json($category->load('parent', 'attributes'));
    }
}
