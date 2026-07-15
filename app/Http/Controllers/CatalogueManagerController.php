<?php

namespace App\Http\Controllers;

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
    // CATALOGUE GENERATION & MANAGEMENT
    // ==========================================

    public function generate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'products.*.sort_order' => 'required|integer'
        ]);

        $userId = Auth::id() ?? 1;

        $cartItems = $request->products;

        if (empty($cartItems)) {
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

            $version = CatalogueVersion::create([
                'catalogue_id' => $catalogue->id,
                'version_no' => 1,
                'user_id' => $userId,
                'show_price' => $request->has('show_price') ? $request->boolean('show_price') : true
            ]);

            // 3. Attach Products to Version
            foreach ($cartItems as $item) {
                $product = Product::find($item['product_id']);
                $variant = isset($item['product_variant_id']) ? ProductVariant::find($item['product_variant_id']) : null;
                $price = $variant ? $variant->price : ($product->variants->first()->price ?? 0);

                $version->versionProducts()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'sort_order' => $item['sort_order'],
                    'custom_title' => $product->name,
                    'custom_price' => $price
                ]);
            }

            // 4. Update Catalogue Current Version
            $catalogue->update(['current_version_id' => $version->id]);

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
        $query = Catalogue::with(['customer.country', 'currentVersion' => function($q) {
            $q->withCount('versionProducts');
        }]);
            
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        
        $catalogues = $query->orderBy('created_at', 'desc')->paginate(10);
        
        $catalogues->getCollection()->transform(function ($catalogue) {
            $catalogue->products_count = $catalogue->currentVersion ? $catalogue->currentVersion->version_products_count : 0;
            return $catalogue;
        });
            
        return response()->json($catalogues);
    }

    public function versions($id)
    {
        $catalogue = Catalogue::findOrFail($id);
        $versions = $catalogue->versions()->orderBy('version_no', 'desc')->get();
        
        return response()->json($versions);
    }



    // ==========================================
    // VERSIONING & CLONING
    // ==========================================



    public function loadForEdit($id)
    {
        $catalogue = Catalogue::findOrFail($id);
        
        try {
            // Get latest version with products mapped similarly to getCart
            $latestVersion = CatalogueVersion::with(['versionProducts.product.images', 'versionProducts.product.category', 'versionProducts.product.variants', 'versionProducts.variant'])
                ->where('catalogue_id', $id)
                ->orderBy('version_no', 'desc')
                ->first();
                
            $items = [];
            if ($latestVersion) {
                foreach ($latestVersion->versionProducts as $vp) {
                    $items[] = [
                        'id' => $vp->product_id, // we map product_id to id for frontend parity
                        'product_id' => $vp->product_id,
                        'cart_variant_id' => $vp->product_variant_id,
                        'sort_order' => $vp->sort_order,
                        'product' => $vp->product,
                        'variant' => $vp->variant,
                    ];
                }
            }
            
            return response()->json([
                'message' => 'Loaded for edit successfully',
                'catalogue_name' => $catalogue->name,
                'customer_id' => $catalogue->customer_id,
                'show_price' => $latestVersion ? $latestVersion->show_price : true,
                'items' => $items
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to load for edit', 'error' => $e->getMessage()], 500);
        }
    }

    public function saveDraftAsVersion(Request $request, $id)
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'products.*.sort_order' => 'required|integer',
        ]);

        $userId = Auth::id() ?? 1;
        $catalogue = Catalogue::findOrFail($id);
        
        $cartItems = $request->products;

        if (empty($cartItems)) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        DB::beginTransaction();
        try {
            $latestVersionNo = $catalogue->versions()->max('version_no') ?? 0;
            
            $newVersion = CatalogueVersion::create([
                'catalogue_id' => $catalogue->id,
                'version_no' => $latestVersionNo + 1,
                'parent_version_id' => $catalogue->current_version_id,
                'user_id' => $userId,
                'show_price' => $request->has('show_price') ? $request->boolean('show_price') : true
            ]);

            foreach ($cartItems as $item) {
                $product = Product::find($item['product_id']);
                $variant = isset($item['product_variant_id']) ? ProductVariant::find($item['product_variant_id']) : null;
                $price = $variant ? $variant->price : ($product->variants->first()->price ?? 0);

                $newVersion->versionProducts()->create([
                    'product_id' => $item['product_id'],
                    'product_variant_id' => $item['product_variant_id'] ?? null,
                    'sort_order' => $item['sort_order'],
                    'custom_title' => $product->name,
                    'custom_price' => $price
                ]);
            }

            $catalogue->update(['current_version_id' => $newVersion->id]);
            
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
        // Pass show_price directly to the catalogue for the PDF view
        $catalogue->show_price = $version->show_price;

        $pdf = Pdf::loadView('pdf.catalogue', ['catalogue' => $catalogue]);
        
        return $pdf->stream(($catalogue->name ?? 'catalogue') . '.pdf');
    }
}
