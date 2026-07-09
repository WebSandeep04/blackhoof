<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Get all completed catalogues
        $catalogues = DB::table('saved_catalogues')->where('status', 'completed')->get();
        
        foreach ($catalogues as $catalogue) {
            // Create version 1
            $versionId = DB::table('catalogue_versions')->insertGetId([
                'saved_catalogue_id' => $catalogue->id,
                'version_number' => 1,
                'created_at' => $catalogue->created_at,
                'updated_at' => $catalogue->updated_at,
            ]);
            
            // Get current products
            $products = DB::table('catalogue_product')->where('saved_catalogue_id', $catalogue->id)->get();
            
            // Attach products to version 1
            $versionProducts = [];
            foreach ($products as $product) {
                $versionProducts[] = [
                    'catalogue_version_id' => $versionId,
                    'product_id' => $product->product_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            
            if (!empty($versionProducts)) {
                DB::table('catalogue_version_product')->insert($versionProducts);
            }
        }
    }

    public function down(): void
    {
        // We don't need to do anything here because dropping the tables will revert the data
        DB::table('catalogue_versions')->truncate();
        DB::table('catalogue_version_product')->truncate();
    }
};
