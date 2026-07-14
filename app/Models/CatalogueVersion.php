<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CatalogueVersion extends Model
{
    protected $fillable = [
        'catalogue_id',
        'version_no',
        'parent_version_id',
        'user_id'
    ];

    public function catalogue()
    {
        return $this->belongsTo(Catalogue::class);
    }

    public function parentVersion()
    {
        return $this->belongsTo(CatalogueVersion::class, 'parent_version_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function versionProducts()
    {
        return $this->hasMany(CatalogueVersionProduct::class)->orderBy('sort_order');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'catalogue_version_products')
                    ->withPivot(['product_variant_id', 'sort_order', 'custom_title', 'custom_description', 'custom_price'])
                    ->withTimestamps()
                    ->orderByPivot('sort_order');
    }
}
