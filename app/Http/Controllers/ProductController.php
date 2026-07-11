<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view products', only: ['index', 'show']),
            new Middleware('permission:create products', only: ['store']),
            new Middleware('permission:edit products', only: ['update']),
            new Middleware('permission:delete products', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'variants.images', 'images']);

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        // Apply filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('is_trending')) {
            $query->where('is_trending', filter_var($request->is_trending, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('is_top_seller')) {
            $query->where('is_top_seller', filter_var($request->is_top_seller, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('include_in_catalogue')) {
            $query->where('include_in_catalogue', filter_var($request->include_in_catalogue, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('product_for')) {
            $query->where('product_for', $request->product_for);
        }

        $products = $query->paginate(10);

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

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge([
            'slug' => Str::slug($request->name)
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'category_id' => 'nullable|exists:categories,id',
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_trending' => 'boolean',
            'is_top_seller' => 'boolean',
            'include_in_catalogue' => 'boolean',
            'has_variants' => 'required|boolean', // Frontend should send this
            'variants' => 'required|string', // JSON string of variants array
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'product_for' => 'required|in:satkirti,blackhoof',
        ]);

        DB::beginTransaction();

        try {
            // 1. Create Product
            $product = Product::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'category_id' => $request->category_id,
                'short_description' => $request->short_description,
                'description' => $request->description,
                'is_active' => $request->is_active ?? true,
                'is_trending' => $request->is_trending ?? false,
                'is_top_seller' => $request->is_top_seller ?? false,
                'include_in_catalogue' => $request->include_in_catalogue ?? true,
                'product_for' => $request->product_for,
            ]);

            // 2. Handle Variants
            $variantsData = json_decode($request->variants, true);
            
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            foreach ($variantsData as $index => $variantData) {
                $variant = $product->variants()->create([
                    'sku' => $variantData['sku'] ?? $product->slug . '-' . uniqid(),
                    'price' => $variantData['price'] ?? 0,
                    'stock_quantity' => $variantData['stock_quantity'] ?? 0,
                ]);

                // Attach attributes if any
                if (!empty($variantData['attributes']) && is_array($variantData['attributes'])) {
                    $variant->attributeValues()->attach($variantData['attributes']);
                }

                // Handle variant images
                if ($request->hasFile("variant_images_{$index}")) {
                    foreach ($request->file("variant_images_{$index}") as $imgIndex => $file) {
                        $path = $file->store('products', 'public');
                        $product->images()->create([
                            'product_variant_id' => $variant->id,
                            'image_path' => $path,
                            'is_main' => count($product->images) === 0 && $imgIndex === 0,
                            'sort_order' => $imgIndex,
                        ]);
                    }
                }
            }

            // 3. Handle Images
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');
                    $product->images()->create([
                        'image_path' => $path,
                        'is_main' => $index === 0, // First image is main by default
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();

            return response()->json($product->load(['category', 'variants.attributeValues', 'images']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::with(['category', 'variants.attributeValues', 'variants.images', 'images'])->findOrFail($id);
        
        $product->images->transform(function ($image) {
            $image->url = $image->url;
            return $image;
        });

        return response()->json($product);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $request->merge([
            'slug' => Str::slug($request->name)
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->ignore($product->id),
            ],
            'category_id' => 'nullable|exists:categories,id',
            'short_description' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'is_trending' => 'boolean',
            'is_top_seller' => 'boolean',
            'include_in_catalogue' => 'boolean',
            'has_variants' => 'required|boolean',
            'variants' => 'required|string', // JSON string
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'existing_images' => 'nullable|string', // JSON array of IDs to keep
            'product_for' => 'required|in:satkirti,blackhoof',
        ]);

        DB::beginTransaction();

        try {
            // 1. Update Product Base
            $product->update([
                'name' => $request->name,
                'slug' => $request->slug,
                'category_id' => $request->category_id,
                'short_description' => $request->short_description,
                'description' => $request->description,
                'is_active' => $request->has('is_active') ? $request->is_active : $product->is_active,
                'is_trending' => $request->has('is_trending') ? $request->is_trending : $product->is_trending,
                'is_top_seller' => $request->has('is_top_seller') ? $request->is_top_seller : $product->is_top_seller,
                'include_in_catalogue' => $request->has('include_in_catalogue') ? $request->include_in_catalogue : $product->include_in_catalogue,
                'product_for' => $request->product_for,
            ]);

            // 2. Handle Variants (Sync)
            $variantsData = json_decode($request->variants, true);
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            $submittedVariantIds = collect($variantsData)->pluck('id')->filter()->toArray();
            
            // 3. Prepare Existing Images
            $existingImageIds = [];
            if ($request->filled('existing_images')) {
                $existingImageIds = json_decode($request->existing_images, true) ?? [];
            }
            
            // Delete removed variants
            $product->variants()->whereNotIn('id', $submittedVariantIds)->delete();

            foreach ($variantsData as $index => $variantData) {
                if (isset($variantData['id'])) {
                    // Update existing
                    $variant = ProductVariant::find($variantData['id']);
                    if ($variant && $variant->product_id === $product->id) {
                        $variant->update([
                            'sku' => $variantData['sku'] ?? $variant->sku,
                            'price' => $variantData['price'] ?? 0,
                            'stock_quantity' => $variantData['stock_quantity'] ?? 0,
                        ]);
                        if (isset($variantData['attributes'])) {
                            $variant->attributeValues()->sync($variantData['attributes']);
                        }
                    }
                } else {
                    // Create new
                    $variant = $product->variants()->create([
                        'sku' => $variantData['sku'] ?? $product->slug . '-' . uniqid(),
                        'price' => $variantData['price'] ?? 0,
                        'stock_quantity' => $variantData['stock_quantity'] ?? 0,
                    ]);
                    if (!empty($variantData['attributes'])) {
                        $variant->attributeValues()->attach($variantData['attributes']);
                    }
                }

                // Handle variant images
                if (isset($variant) && $request->hasFile("variant_images_{$index}")) {
                    $maxSort = $product->images()->max('sort_order') ?? 0;
                    foreach ($request->file("variant_images_{$index}") as $imgIndex => $file) {
                        $path = $file->store('products', 'public');
                        $product->images()->create([
                            'product_variant_id' => $variant->id,
                            'image_path' => $path,
                            'is_main' => count($product->images) === 0 && count($existingImageIds) === 0 && $imgIndex === 0,
                            'sort_order' => $maxSort + $imgIndex + 1,
                        ]);
                    }
                }
            }

            // 3. Handle Images
            // First, remove images not in 'existing_images'
            
            $imagesToDelete = $product->images()->whereNotIn('id', $existingImageIds)->get();
            foreach ($imagesToDelete as $img) {
                Storage::disk('public')->delete($img->image_path);
                $img->delete();
            }

            // Add new images
            if ($request->hasFile('images')) {
                // Get highest sort order
                $maxSort = $product->images()->max('sort_order') ?? 0;
                
                foreach ($request->file('images') as $index => $file) {
                    $path = $file->store('products', 'public');
                    $product->images()->create([
                        'image_path' => $path,
                        'is_main' => count($existingImageIds) === 0 && $index === 0, // Main if it's the first ever
                        'sort_order' => $maxSort + $index + 1,
                    ]);
                }
            }

            DB::commit();

            return response()->json($product->load(['category', 'variants.attributeValues', 'images']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        
        // Delete physical images
        foreach ($product->images as $image) {
            Storage::disk('public')->delete($image->image_path);
        }
        
        $product->delete(); // Cascades to variants and images (db records)
        
        return response()->json(null, 204);
    }
}
