<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('catalogue_versions', function (Blueprint $table) {
            $table->boolean('show_price')->default(true)->after('version_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catalogue_versions', function (Blueprint $table) {
            $table->dropColumn('show_price');
        });
    }
};
