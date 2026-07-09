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
    public function index()
    {
        // Admin gets all completed catalogues, with product count
        $catalogues = SavedCatalogue::withCount('products')
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        // We might also want to load the products themselves for viewing in the modal
        $catalogues->load(['products.images', 'products.category']);

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
        $request->validate(['product_id' => 'required|exists:products,id']);
        $catalogue = $this->getDraftCatalogue();
        
        if (!$catalogue->products()->where('product_id', $request->product_id)->exists()) {
            $catalogue->products()->attach($request->product_id);
        }

        return response()->json(['message' => 'Added to cart']);
    }

    /**
     * Remove a product from the cart.
     */
    public function removeFromCart(Request $request)
    {
        $request->validate(['product_id' => 'required|exists:products,id']);
        $catalogue = $this->getDraftCatalogue();
        
        $catalogue->products()->detach($request->product_id);

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
        ]);

        $catalogue = $this->getDraftCatalogue();
        
        if ($catalogue->products()->count() === 0) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        if ($catalogue->editing_catalogue_id) {
            // We are editing an existing catalogue
            $original = SavedCatalogue::findOrFail($catalogue->editing_catalogue_id);
            
            // Sync products
            $original->products()->sync($catalogue->products->pluck('id'));

            // Create new version
            $latestVersionNumber = $original->latestVersion ? $original->latestVersion->version_number : 0;
            $version = $original->versions()->create([
                'version_number' => $latestVersionNumber + 1
            ]);
            $version->products()->sync($catalogue->products->pluck('id'));

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
            'status' => 'completed'
        ]);

        // Create initial version
        $version = $catalogue->versions()->create(['version_number' => 1]);
        $version->products()->sync($catalogue->products->pluck('id'));

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
        $draft->products()->sync($original->products->pluck('id'));
        $draft->update([
            'editing_catalogue_id' => $original->id,
            'name' => $original->name
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
            }
        }

        $pdf = Pdf::loadView('pdf.catalogue', ['catalogue' => $catalogue]);
        
        return $pdf->stream(($catalogue->name ?? 'catalogue') . '.pdf');
    }
}
