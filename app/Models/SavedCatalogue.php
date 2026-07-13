<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SavedCatalogue extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'status',
        'editing_catalogue_id',
        'show_price',
        'customer_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'catalogue_product');
    }

    public function versions()
    {
        return $this->hasMany(CatalogueVersion::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function latestVersion()
    {
        return $this->hasOne(CatalogueVersion::class)->latestOfMany('version_number');
    }
}
