<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BlogController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view blogs', only: ['index', 'show']),
            new Middleware('permission:create blogs', only: ['store']),
            new Middleware('permission:edit blogs', only: ['update']),
            new Middleware('permission:delete blogs', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Blog::with('category');

        if ($request->filled('search')) {
            $searchTerm = '%' . $request->search . '%';
            $query->where(function($q) use ($searchTerm) {
                $q->where('title', 'like', $searchTerm)
                  ->orWhere('content', 'like', $searchTerm);
            });
        }

        $blogs = $query->orderBy('id', 'desc')->paginate(10);
        
        return response()->json($blogs);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'blog_category_id' => 'required|exists:blog_categories,id',
            'content' => 'nullable|string',
            'status' => 'required|boolean',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $slug = Str::slug($request->title);
        $count = Blog::where('slug', $slug)->count();
        if ($count > 0) {
            $slug = $slug . '-' . time();
        }

        $imagePath = null;
        if ($request->hasFile('featured_image')) {
            $file = $request->file('featured_image');
            $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/blogs'), $filename);
            $imagePath = 'uploads/blogs/' . $filename;
        }

        $blog = Blog::create([
            'title' => $request->title,
            'slug' => $slug,
            'content' => $request->content,
            'blog_category_id' => $request->blog_category_id,
            'status' => $request->status,
            'featured_image' => $imagePath
        ]);

        return response()->json($blog->load('category'), 201);
    }

    public function show($id)
    {
        return response()->json(Blog::with('category')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $blog = Blog::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'blog_category_id' => 'required|exists:blog_categories,id',
            'content' => 'nullable|string',
            'status' => 'required|boolean',
            'featured_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $slug = Str::slug($request->title);
        if ($slug !== $blog->slug) {
            $count = Blog::where('slug', $slug)->where('id', '!=', $id)->count();
            if ($count > 0) {
                $slug = $slug . '-' . time();
            }
        }

        $imagePath = $blog->featured_image;
        if ($request->hasFile('featured_image')) {
            // Delete old image if exists
            if ($imagePath && file_exists(public_path($imagePath))) {
                unlink(public_path($imagePath));
            }

            $file = $request->file('featured_image');
            $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/blogs'), $filename);
            $imagePath = 'uploads/blogs/' . $filename;
        }

        $blog->update([
            'title' => $request->title,
            'slug' => $slug,
            'content' => $request->content,
            'blog_category_id' => $request->blog_category_id,
            'status' => $request->status,
            'featured_image' => $imagePath
        ]);

        return response()->json($blog->load('category'));
    }

    public function destroy($id)
    {
        $blog = Blog::findOrFail($id);
        
        if ($blog->featured_image && file_exists(public_path($blog->featured_image))) {
            unlink(public_path($blog->featured_image));
        }
        
        $blog->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
