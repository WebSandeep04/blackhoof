<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CatalogueVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'saved_catalogue_id',
        'version_number',
        'show_price',
    ];

    public function savedCatalogue()
    {
        return $this->belongsTo(SavedCatalogue::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'catalogue_version_product')
                    ->withPivot(['product_variant_id', 'price_at_time_of_save', 'product_name_at_time_of_save'])
                    ->withTimestamps();
    }
}
