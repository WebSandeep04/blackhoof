<?php
use App\Models\User;
use App\Models\SavedCatalogue;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

\ = User::first();
Auth::login(\);

// Create a completed catalogue
\ = SavedCatalogue::create(['user_id' => \->id, 'name' => 'Test', 'status' => 'completed']);
\ = Product::first();
if (\) {
    \->products()->attach(\->id);
}

// Instantiate controller
\ = new App\Http\Controllers\SavedCatalogueController();
\ = \->loadToDraft(\->id);

echo json_encode(\->getData());
