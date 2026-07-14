<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogueVersionProduct extends Model
{
    protected $fillable = [
        'catalogue_version_id',
        'product_id',
        'product_variant_id',
        'sort_order',
        'custom_title',
        'custom_description',
        'custom_price'
    ];

    public function catalogueVersion()
    {
        return $this->belongsTo(CatalogueVersion::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
