<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class ProductImage extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function tapActivity(Activity $activity, string $eventName)
    {
        // Inject the product_id so we can easily query image logs by product
        $activity->properties = $activity->properties->put('product_id', (int) $this->product_id);
    }

    protected $fillable = [
        'product_id',
        'product_variant_id',
        'image_path',
        'is_main',
        'sort_order',
    ];

    protected $casts = [
        'is_main' => 'boolean',
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

    // Accessor for full URL
    public function getUrlAttribute()
    {
        if (str_starts_with($this->image_path, 'http')) {
            return $this->image_path;
        }
        return asset('storage/' . $this->image_path);
    }
}
