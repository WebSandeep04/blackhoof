<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Catalogue extends Model
{
    protected $fillable = [
        'name',
        'customer_id',
        'user_id',
        'current_version_id'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function versions()
    {
        return $this->hasMany(CatalogueVersion::class);
    }

    public function currentVersion()
    {
        return $this->belongsTo(CatalogueVersion::class, 'current_version_id');
    }
}
