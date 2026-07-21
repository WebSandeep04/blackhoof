<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVideo extends Model
{
    protected $fillable = [
        'product_id',
        'product_variant_id',
        'video_path',
        'sort_order'
    ];

    protected $appends = ['url'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function getUrlAttribute()
    {
        if (!$this->video_path) return null;
        return asset('storage/' . $this->video_path);
    }
}
