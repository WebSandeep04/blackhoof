<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::with(['category', 'variants', 'images']);

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
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
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'has_variants' => 'required|boolean', // Frontend should send this
            'variants' => 'required|string', // JSON string of variants array
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        DB::beginTransaction();

        try {
            // 1. Create Product
            $product = Product::create([
                'name' => $request->name,
                'slug' => $request->slug,
                'category_id' => $request->category_id,
                'description' => $request->description,
                'is_active' => $request->is_active ?? true,
            ]);

            // 2. Handle Variants
            $variantsData = json_decode($request->variants, true);
            
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            foreach ($variantsData as $variantData) {
                $variant = $product->variants()->create([
                    'sku' => $variantData['sku'] ?? $product->slug . '-' . uniqid(),
                    'price' => $variantData['price'] ?? 0,
                    'stock_quantity' => $variantData['stock_quantity'] ?? 0,
                ]);

                // Attach attributes if any
                if (!empty($variantData['attributes']) && is_array($variantData['attributes'])) {
                    $variant->attributeValues()->attach($variantData['attributes']);
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
        $product = Product::with(['category', 'variants.attributeValues', 'images'])->findOrFail($id);
        
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

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products')->ignore($product->id),
            ],
            'category_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'has_variants' => 'required|boolean',
            'variants' => 'required|string', // JSON string
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'existing_images' => 'nullable|string', // JSON array of IDs to keep
        ]);

        DB::beginTransaction();

        try {
            // 1. Update Product Base
            $product->update([
                'name' => $request->name,
                'slug' => $request->slug,
                'category_id' => $request->category_id,
                'description' => $request->description,
                'is_active' => $request->has('is_active') ? $request->is_active : $product->is_active,
            ]);

            // 2. Handle Variants (Sync)
            $variantsData = json_decode($request->variants, true);
            if (!is_array($variantsData) || empty($variantsData)) {
                throw new \Exception("Variants data is invalid or empty.");
            }

            $submittedVariantIds = collect($variantsData)->pluck('id')->filter()->toArray();
            
            // Delete removed variants
            $product->variants()->whereNotIn('id', $submittedVariantIds)->delete();

            foreach ($variantsData as $variantData) {
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
            }

            // 3. Handle Images
            // First, remove images not in 'existing_images'
            $existingImageIds = [];
            if ($request->filled('existing_images')) {
                $existingImageIds = json_decode($request->existing_images, true) ?? [];
            }
            
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
