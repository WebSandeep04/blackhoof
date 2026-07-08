<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saved_catalogues', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
            $table->string('status')->default('draft')->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('saved_catalogues', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->string('name')->nullable(false)->change();
        });
    }
};
