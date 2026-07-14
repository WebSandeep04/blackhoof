<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogue_product', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
        });

        Schema::table('catalogue_version_product', function (Blueprint $table) {
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->decimal('price_at_time_of_save', 10, 2)->nullable();
            $table->string('product_name_at_time_of_save')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('catalogue_product', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
            $table->dropColumn('product_variant_id');
        });

        Schema::table('catalogue_version_product', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
            $table->dropColumn(['product_variant_id', 'price_at_time_of_save', 'product_name_at_time_of_save']);
        });
    }
};
