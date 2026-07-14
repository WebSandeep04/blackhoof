<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogueCart extends Model
{
    protected $table = 'catalogue_cart';

    protected $fillable = [
        'user_id',
        'product_id',
        'product_variant_id',
        'sort_order'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
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
