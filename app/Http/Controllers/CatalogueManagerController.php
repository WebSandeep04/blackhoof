<?php

namespace App\Http\Controllers;

use App\Models\CatalogueCart;
use App\Models\Catalogue;
use App\Models\CatalogueVersion;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CatalogueManagerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            // new Middleware('permission:view saved catalogues', only: ['index', 'show']),
            // new Middleware('permission:delete saved catalogues', only: ['destroy']),
        ];
    }

    // ==========================================
    // CART MANAGEMENT
    // ==========================================

    public function getCart()
    {
        $userId = Auth::id() ?? 1; // Fallback for dev

        $cartItems = CatalogueCart::with(['product.images', 'product.category', 'variant'])
            ->where('user_id', $userId)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['cart' => $cartItems]);
    }

    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id'
        ]);

        $userId = Auth::id() ?? 1;

        $exists = CatalogueCart::where('user_id', $userId)
            ->where('product_id', $request->product_id)
            ->where('product_variant_id', $request->product_variant_id)
            ->exists();

        if (!$exists) {
            $maxOrder = CatalogueCart::where('user_id', $userId)->max('sort_order') ?? 0;
            
            CatalogueCart::create([
                'user_id' => $userId,
                'product_id' => $request->product_id,
                'product_variant_id' => $request->product_variant_id,
                'sort_order' => $maxOrder + 1
            ]);
        }

        return response()->json(['message' => 'Added to cart']);
    }

    public function removeFromCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id'
        ]);

        $userId = Auth::id() ?? 1;

        CatalogueCart::where('user_id', $userId)
            ->where('product_id', $request->product_id)
            ->where('product_variant_id', $request->product_variant_id)
            ->delete();

        return response()->json(['message' => 'Removed from cart']);
    }

    public function clearCart()
    {
        $userId = Auth::id() ?? 1;
        CatalogueCart::where('user_id', $userId)->delete();

        return response()->json(['message' => 'Cart cleared']);
    }

    public function reorderCart(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:catalogue_cart,id',
            'items.*.sort_order' => 'required|integer'
        ]);

        $userId = Auth::id() ?? 1;

        DB::transaction(function () use ($request, $userId) {
            foreach ($request->items as $item) {
                CatalogueCart::where('id', $item['id'])
                    ->where('user_id', $userId)
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json(['message' => 'Cart reordered']);
    }

    // ==========================================
    // CATALOGUE GENERATION & MANAGEMENT
    // ==========================================

    public function generate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id'
        ]);

        $userId = Auth::id() ?? 1;

        $cartItems = CatalogueCart::where('user_id', $userId)->orderBy('sort_order')->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Create Catalogue
            $catalogue = Catalogue::create([
                'name' => $request->name,
                'customer_id' => $request->customer_id,
                'user_id' => $userId
            ]);

            // 2. Create Version 1
            $version = CatalogueVersion::create([
                'catalogue_id' => $catalogue->id,
                'version_no' => 1,
                'user_id' => $userId
            ]);

            // 3. Attach Products to Version
            foreach ($cartItems as $item) {
                $product = Product::find($item->product_id);
                $variant = $item->product_variant_id ? ProductVariant::find($item->product_variant_id) : null;
                $price = $variant ? $variant->price : ($product->variants->first()->price ?? 0);

                $version->versionProducts()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'sort_order' => $item->sort_order,
                    'custom_title' => $product->name,
                    'custom_price' => $price
                ]);
            }

            // 4. Update Catalogue Current Version
            $catalogue->update(['current_version_id' => $version->id]);

            // 5. Clear Cart
            CatalogueCart::where('user_id', $userId)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Catalogue generated successfully',
                'catalogue_id' => $catalogue->id,
                'version_id' => $version->id
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate catalogue', 'error' => $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        $query = Catalogue::with(['customer', 'currentVersion']);
            
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        
        $catalogues = $query->orderBy('created_at', 'desc')->paginate(10);
            
        return response()->json($catalogues);
    }

    public function versions($id)
    {
        $catalogue = Catalogue::findOrFail($id);
        $versions = $catalogue->versions()->orderBy('version_no', 'desc')->get();
        
        return response()->json($versions);
    }

    public function getVersion($catalogueId, $versionId)
    {
        $version = CatalogueVersion::with(['versionProducts.product', 'versionProducts.variant'])
            ->where('catalogue_id', $catalogueId)
            ->findOrFail($versionId);
            
        return response()->json($version);
    }

    // ==========================================
    // VERSIONING & CLONING
    // ==========================================

    public function saveNewVersion(Request $request, $id)
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'products.*.sort_order' => 'required|integer',
            'products.*.custom_title' => 'nullable|string',
            'products.*.custom_description' => 'nullable|string',
            'products.*.custom_price' => 'nullable|numeric'
        ]);

        $userId = Auth::id() ?? 1;
        $catalogue = Catalogue::findOrFail($id);
        
        DB::beginTransaction();
        try {
            $latestVersionNo = $catalogue->versions()->max('version_no') ?? 0;
            
            $newVersion = CatalogueVersion::create([
                'catalogue_id' => $catalogue->id,
                'version_no' => $latestVersionNo + 1,
                'parent_version_id' => $catalogue->current_version_id,
                'user_id' => $userId
            ]);

            foreach ($request->products as $prod) {
                $newVersion->versionProducts()->create([
                    'product_id' => $prod['product_id'],
                    'product_variant_id' => $prod['product_variant_id'] ?? null,
                    'sort_order' => $prod['sort_order'],
                    'custom_title' => $prod['custom_title'] ?? null,
                    'custom_description' => $prod['custom_description'] ?? null,
                    'custom_price' => $prod['custom_price'] ?? null
                ]);
            }

            $catalogue->update(['current_version_id' => $newVersion->id]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'New version saved successfully',
                'version_id' => $newVersion->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save new version', 'error' => $e->getMessage()], 500);
        }
    }

    public function loadToDraft($id)
    {
        $userId = Auth::id() ?? 1;
        $catalogue = Catalogue::findOrFail($id);
        
        DB::beginTransaction();
        try {
            // Clear current cart
            CatalogueCart::where('user_id', $userId)->delete();
            
            // Get latest version
            $latestVersion = CatalogueVersion::with('versionProducts')
                ->where('catalogue_id', $id)
                ->orderBy('version_no', 'desc')
                ->first();
                
            if ($latestVersion) {
                foreach ($latestVersion->versionProducts as $vp) {
                    CatalogueCart::create([
                        'user_id' => $userId,
                        'product_id' => $vp->product_id,
                        'product_variant_id' => $vp->product_variant_id,
                        'sort_order' => $vp->sort_order
                    ]);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'Loaded to draft successfully',
                'catalogue_name' => $catalogue->name,
                'customer_id' => $catalogue->customer_id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to load to draft', 'error' => $e->getMessage()], 500);
        }
    }

    public function saveDraftAsVersion($id)
    {
        $userId = Auth::id() ?? 1;
        $catalogue = Catalogue::findOrFail($id);
        
        $cartItems = CatalogueCart::where('user_id', $userId)->orderBy('sort_order')->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        DB::beginTransaction();
        try {
            $latestVersionNo = $catalogue->versions()->max('version_no') ?? 0;
            
            $newVersion = CatalogueVersion::create([
                'catalogue_id' => $catalogue->id,
                'version_no' => $latestVersionNo + 1,
                'parent_version_id' => $catalogue->current_version_id,
                'user_id' => $userId
            ]);

            foreach ($cartItems as $item) {
                $product = Product::find($item->product_id);
                $variant = $item->product_variant_id ? ProductVariant::find($item->product_variant_id) : null;
                $price = $variant ? $variant->price : ($product->variants->first()->price ?? 0);

                $newVersion->versionProducts()->create([
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'sort_order' => $item->sort_order,
                    'custom_title' => $product->name, // Keep base name for now since cart UI doesn't allow custom text
                    'custom_price' => $price
                ]);
            }

            $catalogue->update(['current_version_id' => $newVersion->id]);
            
            // Clear Cart
            CatalogueCart::where('user_id', $userId)->delete();
            
            DB::commit();
            
            return response()->json([
                'message' => 'New version saved successfully',
                'catalogue_id' => $catalogue->id,
                'version_id' => $newVersion->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to save new version', 'error' => $e->getMessage()], 500);
        }
    }

    public function cloneToNewClient(Request $request, $versionId)
    {
        $request->validate([
            'new_catalogue_name' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id'
        ]);

        $userId = Auth::id() ?? 1;
        $sourceVersion = CatalogueVersion::with('versionProducts')->findOrFail($versionId);

        DB::beginTransaction();
        try {
            $newCatalogue = Catalogue::create([
                'name' => $request->new_catalogue_name,
                'customer_id' => $request->customer_id,
                'user_id' => $userId
            ]);

            $newVersion = CatalogueVersion::create([
                'catalogue_id' => $newCatalogue->id,
                'version_no' => 1,
                'parent_version_id' => $sourceVersion->id, // Track lineage
                'user_id' => $userId
            ]);

            foreach ($sourceVersion->versionProducts as $prod) {
                $newVersion->versionProducts()->create([
                    'product_id' => $prod->product_id,
                    'product_variant_id' => $prod->product_variant_id,
                    'sort_order' => $prod->sort_order,
                    'custom_title' => $prod->custom_title,
                    'custom_description' => $prod->custom_description,
                    'custom_price' => $prod->custom_price
                ]);
            }

            $newCatalogue->update(['current_version_id' => $newVersion->id]);

            DB::commit();

            return response()->json([
                'message' => 'Catalogue cloned successfully',
                'catalogue_id' => $newCatalogue->id,
                'version_id' => $newVersion->id
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to clone catalogue', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $catalogue = Catalogue::findOrFail($id);
        $catalogue->delete();
        
        return response()->json(['message' => 'Catalogue deleted successfully']);
    }

    public function download(Request $request, $id)
    {
        // Fetch the catalogue with its customer
        $catalogue = Catalogue::with('customer')->findOrFail($id);

        // Fetch the specific version requested, or default to the current version
        $versionId = $request->query('version_id', $catalogue->current_version_id);
        
        if (!$versionId) {
            return response()->json(['message' => 'No versions found for this catalogue'], 404);
        }

        $version = CatalogueVersion::with(['versionProducts.product.images', 'versionProducts.product.category', 'versionProducts.variant.attributeValues.attribute'])
            ->where('catalogue_id', $catalogue->id)
            ->findOrFail($versionId);

        // Map the version products back to the structure the PDF view expects
        // The old PDF view expects a $catalogue->products relation. We will map version products dynamically.
        $products = collect();
        foreach ($version->versionProducts as $vp) {
            $product = $vp->product;
            // Provide custom names/prices dynamically on the product object
            $product->name = $vp->custom_title ?? $product->name;
            $product->price_at_time_of_save = $vp->custom_price;
            $product->pivot = (object) ['product_variant_id' => $vp->product_variant_id];
            $products->push($product);
        }
        
        $catalogue->setRelation('products', $products);
        $catalogue->name = $catalogue->name . ' (v' . $version->version_no . ')';
        // You can add logic for 'show_price' based on your requirements if you saved it in the catalogue model

        $pdf = Pdf::loadView('pdf.catalogue', ['catalogue' => $catalogue]);
        
        return $pdf->stream(($catalogue->name ?? 'catalogue') . '.pdf');
    }
}
