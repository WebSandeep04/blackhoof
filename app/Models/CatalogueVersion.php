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
    ];

    public function savedCatalogue()
    {
        return $this->belongsTo(SavedCatalogue::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'catalogue_version_product');
    }
}
