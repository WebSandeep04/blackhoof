<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop old tables
        Schema::dropIfExists('catalogue_version_product');
        Schema::dropIfExists('catalogue_versions');
        Schema::dropIfExists('catalogue_product');
        Schema::dropIfExists('saved_catalogues');

        // 2. Create new architecture
        
        // Active cart table
        Schema::create('catalogue_cart', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Catalogues container table
        Schema::create('catalogues', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->comment('created_by')->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('current_version_id')->nullable(); // Foreign key added later to avoid circular dependency
            $table->timestamps();
        });

        // Catalogue versions table
        Schema::create('catalogue_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catalogue_id')->constrained('catalogues')->onDelete('cascade');
            $table->integer('version_no');
            $table->foreignId('parent_version_id')->nullable()->constrained('catalogue_versions')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->comment('created_by')->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->unique(['catalogue_id', 'version_no']);
        });

        // Add FK back to catalogues
        Schema::table('catalogues', function (Blueprint $table) {
            $table->foreign('current_version_id')->references('id')->on('catalogue_versions')->nullOnDelete();
        });

        // Products attached to versions
        Schema::create('catalogue_version_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('catalogue_version_id')->constrained('catalogue_versions')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->string('custom_title')->nullable();
            $table->text('custom_description')->nullable();
            $table->decimal('custom_price', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Drop new tables
        Schema::dropIfExists('catalogue_version_products');
        
        Schema::table('catalogues', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });
        
        Schema::dropIfExists('catalogue_versions');
        Schema::dropIfExists('catalogues');
        Schema::dropIfExists('catalogue_cart');
    }
};
