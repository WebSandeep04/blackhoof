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
use App\Models\Category;

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
        if ($request->filled('show_on_website')) {
            $query->where('show_on_website', filter_var($request->show_on_website, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('product_for')) {
            $query->where('product_for', $request->product_for);
        }

        $products = $query->paginate(10);

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->merge([
            'name' => request()->name,
            'product_for' => request()->product_for,
            'slug' => Str::slug(request()->product_for . '-' . request()->name)
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
            'show_on_website' => 'boolean',
            'ready_to_publish' => 'boolean',
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
                'show_on_website' => $request->show_on_website ?? true,
                'ready_to_publish' => $request->ready_to_publish ?? false,
                'product_for' => $request->product_for,
            ]);

            // 2. Handle Variants
            $variantsData = json_decode($request->variants, true);
            
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            // Get valid attribute values for the category
            $validAttributeValueIds = [];
            if ($request->category_id) {
                $category = Category::with('attributeValues')->find($request->category_id);
                if ($category) {
                    $validAttributeValueIds = $category->attributeValues->pluck('id')->toArray();
                }
            }

            foreach ($variantsData as $index => $variantData) {
                // Validate variant attributes against category mapped attributes
                if (!empty($variantData['attributes']) && is_array($variantData['attributes'])) {
                    $invalidAttributes = array_diff($variantData['attributes'], $validAttributeValueIds);
                    if (!empty($invalidAttributes)) {
                        throw new \Exception("One or more selected attribute values are not mapped to this product's category.");
                    }
                }

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
                $mainImageKey = $request->input("variant_main_image_{$index}");

                if ($request->hasFile("variant_images_{$index}")) {
                    foreach ($request->file("variant_images_{$index}") as $imgIndex => $file) {
                        $path = $file->store('products', 'public');
                        
                        $isMain = ($mainImageKey === "new-{$imgIndex}");
                        if (empty($mainImageKey) && $imgIndex === 0) {
                            $isMain = true;
                        }

                        $product->images()->create([
                            'product_variant_id' => $variant->id,
                            'image_path' => $path,
                            'is_main' => $isMain,
                            'sort_order' => $imgIndex,
                        ]);
                    }
                }

                // Handle variant videos
                if ($request->hasFile("variant_videos_{$index}")) {
                    foreach ($request->file("variant_videos_{$index}") as $vidIndex => $file) {
                        $path = $file->store('products/videos', 'public');
                        $product->videos()->create([
                            'product_variant_id' => $variant->id,
                            'video_path' => $path,
                            'sort_order' => $vidIndex,
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

            // 4. Handle Videos
            if ($request->hasFile('videos')) {
                foreach ($request->file('videos') as $index => $file) {
                    $path = $file->store('products/videos', 'public');
                    $product->videos()->create([
                        'video_path' => $path,
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
            'show_on_website' => 'boolean',
            'ready_to_publish' => 'boolean',
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
                'show_on_website' => $request->has('show_on_website') ? $request->show_on_website : $product->show_on_website,
                'ready_to_publish' => $request->has('ready_to_publish') ? $request->ready_to_publish : $product->ready_to_publish,
                'product_for' => $request->product_for,
            ]);

            // 2. Handle Variants (Sync)
            $variantsData = json_decode($request->variants, true);
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            $submittedVariantIds = collect($variantsData)->pluck('id')->filter()->toArray();
            
            // 3. Prepare Existing Images & Delete Removed Images first
            $existingImageIds = [];
            if ($request->has('existing_images')) {
                \Log::info("Raw existing_images received: " . $request->existing_images);
                $decoded = json_decode($request->existing_images, true);
                if (is_array($decoded)) {
                    $existingImageIds = $decoded;
                }
            }
            \Log::info("Parsed existingImageIds: ", $existingImageIds);
            
            // Delete images that were removed by the user (do this BEFORE adding new ones so we don't accidentally delete fresh uploads)
            // Note: We intentionally do NOT delete the physical file from Storage so the Audit Logs can still display the deleted image thumbnail.
            $imagesQuery = $product->images();
            if (!empty($existingImageIds)) {
                $imagesQuery->whereNotIn('id', $existingImageIds);
            }
            $imagesToDelete = $imagesQuery->get();
            \Log::info("Images to delete count: " . $imagesToDelete->count(), $imagesToDelete->pluck('id')->toArray());
            foreach ($imagesToDelete as $img) {
                \Log::info("Deleting image ID: {$img->id}");
                $img->delete();
            }

            // Prepare Existing Videos & Delete Removed Videos first
            $existingVideoIds = [];
            if ($request->has('existing_videos')) {
                \Log::info("Raw existing_videos received: " . $request->existing_videos);
                $decoded = json_decode($request->existing_videos, true);
                if (is_array($decoded)) {
                    $existingVideoIds = $decoded;
                }
            }
            \Log::info("Parsed existingVideoIds: ", $existingVideoIds);
            
            $videosQuery = $product->videos()->whereNull('product_variant_id');
            if (!empty($existingVideoIds)) {
                $videosQuery->whereNotIn('id', $existingVideoIds);
            }
            $videosToDelete = $videosQuery->get();
            
            foreach ($videosToDelete as $vid) {
                // Note: We intentionally do NOT delete the physical video file from Storage so the Audit Logs can still display it.
                $vid->delete();
            }
            
            // Delete removed variants
            $product->variants()->whereNotIn('id', $submittedVariantIds)->delete();

            // Get valid attribute values for the category
            $validAttributeValueIds = [];
            if ($request->category_id) {
                $category = Category::with('attributeValues')->find($request->category_id);
                if ($category) {
                    $validAttributeValueIds = $category->attributeValues->pluck('id')->toArray();
                }
            }

            foreach ($variantsData as $index => $variantData) {
                // Validate variant attributes against category mapped attributes
                if (!empty($variantData['attributes']) && is_array($variantData['attributes'])) {
                    $invalidAttributes = array_diff($variantData['attributes'], $validAttributeValueIds);
                    if (!empty($invalidAttributes)) {
                        throw new \Exception("One or more selected attribute values are not mapped to this product's category.");
                    }
                }

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
                $mainImageKey = $request->input("variant_main_image_{$index}");

                if (isset($variant)) {
                    if ($mainImageKey && str_starts_with($mainImageKey, 'existing-')) {
                        $mainId = str_replace('existing-', '', $mainImageKey);
                        // Reset all to false for this variant
                        $product->images()->where('product_variant_id', $variant->id)->update(['is_main' => false]);
                        // Set the selected one to true
                        $product->images()->where('id', $mainId)->update(['is_main' => true]);
                    }

                    if ($request->hasFile("variant_images_{$index}")) {
                        $maxSort = $product->images()->max('sort_order') ?? 0;
                        foreach ($request->file("variant_images_{$index}") as $imgIndex => $file) {
                            $path = $file->store('products', 'public');
                            
                            $isMain = ($mainImageKey === "new-{$imgIndex}");
                            if ($isMain) {
                                $product->images()->where('product_variant_id', $variant->id)->update(['is_main' => false]);
                            } elseif (empty($mainImageKey) && $product->images()->where('product_variant_id', $variant->id)->count() === 0 && $imgIndex === 0) {
                                $isMain = true;
                            }

                            $product->images()->create([
                                'product_variant_id' => $variant->id,
                                'image_path' => $path,
                                'is_main' => $isMain,
                                'sort_order' => $maxSort + $imgIndex + 1,
                            ]);
                        }
                    }

                    // Handle variant videos deletion and creation
                    $existingVariantVideoIds = [];
                    if ($request->has("variant_existing_videos_{$index}")) {
                        \Log::info("Raw variant_existing_videos_{$index}: " . $request->input("variant_existing_videos_{$index}"));
                        $decoded = json_decode($request->input("variant_existing_videos_{$index}"), true);
                        if (is_array($decoded)) {
                            $existingVariantVideoIds = $decoded;
                        }
                    }
                    \Log::info("Parsed existingVariantVideoIds for variant {$index}: ", $existingVariantVideoIds);
                    
                    $variantVideosQuery = \App\Models\ProductVideo::where('product_id', $product->id)->where('product_variant_id', $variant->id);
                    if (!empty($existingVariantVideoIds)) {
                        $variantVideosQuery->whereNotIn('id', $existingVariantVideoIds);
                    }
                    $variantVideosToDelete = $variantVideosQuery->get();
                    
                    foreach ($variantVideosToDelete as $vid) {
                        // Note: We intentionally do NOT delete the physical video file from Storage so the Audit Logs can still display it.
                        $vid->delete();
                    }

                    if ($request->hasFile("variant_videos_{$index}")) {
                        $maxSort = \App\Models\ProductVideo::where('product_id', $product->id)->where('product_variant_id', $variant->id)->max('sort_order') ?? 0;
                        foreach ($request->file("variant_videos_{$index}") as $vidIndex => $file) {
                            $path = $file->store('products/videos', 'public');
                            $product->videos()->create([
                                'product_variant_id' => $variant->id,
                                'video_path' => $path,
                                'sort_order' => $maxSort + $vidIndex + 1,
                            ]);
                        }
                    }
                }
            }

            // 3. Handle New Main Images
            // Add new general product images (if we have any, though currently images are mainly handled per variant)
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

            // 4. Handle New Main Videos
            if ($request->hasFile('videos')) {
                $maxSort = $product->videos()->whereNull('product_variant_id')->max('sort_order') ?? 0;
                foreach ($request->file('videos') as $index => $file) {
                    $path = $file->store('products/videos', 'public');
                    $product->videos()->create([
                        'video_path' => $path,
                        'sort_order' => $maxSort + $index + 1,
                    ]);
                }
            }

            DB::commit();

            \Log::info("Transaction committed successfully.");
            $product->refresh();
            \Log::info("Product refreshed. Returning response.");
            return response()->json($product->load(['category', 'variants.attributeValues', 'images', 'variants.images']));
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error("Failed to update product: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['message' => 'Failed to update product', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        
        // Note: We intentionally do NOT delete the physical files from Storage so the Audit Logs can still display the deleted image thumbnails.
        // foreach ($product->images as $image) {
        //     Storage::disk('public')->delete($image->image_path);
        // }
        
        $product->delete(); // Cascades to variants and images (db records)
        
        return response()->json(null, 204);
    }
}
