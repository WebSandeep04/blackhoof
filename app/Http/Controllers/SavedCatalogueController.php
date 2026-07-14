<?php

namespace App\Http\Controllers;

use App\Models\SavedCatalogue;
use App\Models\CatalogueVersion;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SavedCatalogueController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view saved catalogues', only: ['index', 'show']),
            new Middleware('permission:delete saved catalogues', only: ['destroy']),
        ];
    }

    /**
     * Get a list of all completed catalogues.
     */
    public function index(Request $request)
    {
        $query = SavedCatalogue::withCount('products')
            ->where('status', 'completed');
            
        if ($request->filled('country_id')) {
            $query->whereHas('customer', function($q) use ($request) {
                $q->where('country_id', $request->country_id);
            });
        }
        
        $catalogues = $query->orderBy('created_at', 'desc')->paginate(10);
            
        $catalogues->load(['products.images', 'products.category', 'customer.country']);

        return response()->json($catalogues);
    }

    /**
     * Delete a saved catalogue.
     */
    public function destroy($id)
    {
        $catalogue = SavedCatalogue::findOrFail($id);
        $catalogue->delete();
        
        return response()->json(['message' => 'Catalogue deleted successfully']);
    }

    /**
     * Get or create the active draft catalogue for the user.
     */
    private function getDraftCatalogue()
    {
        // For now we use Auth::id() or a dummy session based draft if not logged in.
        // Assuming admin user is logged in.
        $userId = Auth::id();
        
        $catalogue = SavedCatalogue::firstOrCreate(
            ['user_id' => $userId, 'status' => 'draft'],
            ['name' => null]
        );

        return $catalogue;
    }

    /**
     * Get the current draft cart.
     */
    public function getCart()
    {
        $catalogue = $this->getDraftCatalogue();
        $catalogue->load('products.images', 'products.category', 'products.variants');
        return response()->json(['cart' => $catalogue]);
    }

    /**
     * Add a product to the cart.
     */
    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id'
        ]);
        $catalogue = $this->getDraftCatalogue();
        
        $exists = $catalogue->products()
            ->where('product_id', $request->product_id)
            ->wherePivot('product_variant_id', $request->product_variant_id)
            ->exists();

        if (!$exists) {
            $catalogue->products()->attach($request->product_id, [
                'product_variant_id' => $request->product_variant_id
            ]);
        }

        return response()->json(['message' => 'Added to cart']);
    }

    /**
     * Remove a product from the cart.
     */
    public function removeFromCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id'
        ]);
        $catalogue = $this->getDraftCatalogue();
        
        \DB::table('catalogue_product')
            ->where('saved_catalogue_id', $catalogue->id)
            ->where('product_id', $request->product_id)
            ->where('product_variant_id', $request->product_variant_id)
            ->delete();

        return response()->json(['message' => 'Removed from cart']);
    }

    /**
     * Clear the cart.
     */
    public function clearCart()
    {
        $catalogue = $this->getDraftCatalogue();
        $catalogue->products()->detach();

        return response()->json(['message' => 'Cart cleared']);
    }

    /**
     * Checkout: Give name and mark as completed.
     */
    public function checkout(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'customer_id' => 'nullable|exists:customers,id',
            'show_price' => 'boolean',
        ]);

        $catalogue = $this->getDraftCatalogue();
        
        if ($catalogue->products()->count() === 0) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        if ($catalogue->editing_catalogue_id && !$request->boolean('save_as_new')) {
            // We are editing an existing catalogue
            $original = SavedCatalogue::findOrFail($catalogue->editing_catalogue_id);
            
            $original->update([
                'name' => $request->name,
                'customer_id' => $request->customer_id ?? $original->customer_id,
                'show_price' => $request->boolean('show_price', true)
            ]);
            
            // Sync products safely avoiding identical key overwrites
            $original->products()->detach();
            foreach ($catalogue->products as $prod) {
                $original->products()->attach($prod->id, [
                    'product_variant_id' => $prod->pivot->product_variant_id
                ]);
            }

            // Create new version
            $latestVersionNumber = $original->latestVersion ? $original->latestVersion->version_number : 0;
            $version = $original->versions()->create([
                'version_number' => $latestVersionNumber + 1,
                'show_price' => $request->boolean('show_price', true)
            ]);
            
            foreach ($catalogue->products as $prod) {
                $variant = $prod->pivot->product_variant_id ? \App\Models\ProductVariant::find($prod->pivot->product_variant_id) : null;
                $price = $variant ? $variant->price : ($prod->variants->first()->price ?? 0);
                
                $version->products()->attach($prod->id, [
                    'product_variant_id' => $prod->pivot->product_variant_id,
                    'price_at_time_of_save' => $price,
                    'product_name_at_time_of_save' => $prod->name
                ]);
            }

            // Clear draft cart
            $catalogue->products()->detach();
            $catalogue->update(['editing_catalogue_id' => null, 'name' => null]);

            return response()->json([
                'message' => 'Catalogue updated successfully',
                'catalogue_id' => $original->id
            ], 200);
        }

        $catalogue->update([
            'name' => $request->name,
            'customer_id' => $request->customer_id,
            'status' => 'completed',
            'editing_catalogue_id' => null,
            'show_price' => $request->boolean('show_price', true)
        ]);

        // Create initial version
        $version = $catalogue->versions()->create([
            'version_number' => 1,
            'show_price' => $request->boolean('show_price', true)
        ]);
        
        foreach ($catalogue->products as $prod) {
            $variant = $prod->pivot->product_variant_id ? \App\Models\ProductVariant::find($prod->pivot->product_variant_id) : null;
            $price = $variant ? $variant->price : ($prod->variants->first()->price ?? 0);
            
            $version->products()->attach($prod->id, [
                'product_variant_id' => $prod->pivot->product_variant_id,
                'price_at_time_of_save' => $price,
                'product_name_at_time_of_save' => $prod->name
            ]);
        }

        return response()->json([
            'message' => 'Catalogue generated successfully',
            'catalogue_id' => $catalogue->id
        ], 200);
    }

    /**
     * Load an existing catalogue into the draft cart for editing.
     */
    public function loadToDraft($id)
    {
        $original = SavedCatalogue::findOrFail($id);
        $draft = $this->getDraftCatalogue();

        // Sync original products to draft
        $draft->products()->detach();
        foreach ($original->products as $prod) {
            $draft->products()->attach($prod->id, [
                'product_variant_id' => $prod->pivot->product_variant_id
            ]);
        }
        $draft->update([
            'editing_catalogue_id' => $original->id,
            'name' => $original->name,
            'show_price' => $original->show_price,
            'customer_id' => $original->customer_id
        ]);

        return response()->json(['message' => 'Loaded into cart', 'cart' => $draft]);
    }

    /**
     * Get all versions of a specific catalogue.
     */
    public function versions($id)
    {
        $catalogue = SavedCatalogue::findOrFail($id);
        $versions = $catalogue->versions()->orderBy('version_number', 'desc')->get();
        return response()->json($versions);
    }

    /**
     * Generate and stream the PDF for a specific saved catalogue.
     */
    public function download(Request $request, $id)
    {
        $catalogue = SavedCatalogue::with(['products.images', 'products.variants.attributeValues.attribute', 'products.category'])->findOrFail($id);

        if ($request->has('version_id')) {
            $version = CatalogueVersion::with(['products.images', 'products.variants.attributeValues.attribute', 'products.category'])->findOrFail($request->version_id);
            if ($version->saved_catalogue_id == $catalogue->id) {
                $catalogue->setRelation('products', $version->products);
                $catalogue->name = $catalogue->name . ' (v' . $version->version_number . ')';
                $catalogue->show_price = $version->show_price;
            }
        }

        $pdf = Pdf::loadView('pdf.catalogue', ['catalogue' => $catalogue]);
        
        return $pdf->stream(($catalogue->name ?? 'catalogue') . '.pdf');
    }
}
