<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalogue_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('saved_catalogue_id')->constrained('saved_catalogues')->onDelete('cascade');
            $table->integer('version_number');
            $table->timestamps();
            
            $table->unique(['saved_catalogue_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogue_versions');
    }
};
