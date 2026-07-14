<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Product extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'short_description',
        'description',
        'is_active',
        'is_trending',
        'is_top_seller',
        'show_on_website',
        'product_for',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_trending' => 'boolean',
        'is_top_seller' => 'boolean',
        'show_on_website' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    // Helper to get the main image
    public function mainImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_main', true)->orWhere(function($query) {
            $query->orderBy('sort_order')->limit(1);
        });
    }
}
