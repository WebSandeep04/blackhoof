<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            'view users',
            'create users',
            'edit users',
            'delete users',
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'view categories',
            'create categories',
            'edit categories',
            'delete categories',
            'view attributes',
            'create attributes',
            'edit attributes',
            'delete attributes',
            'view blog categories',
            'create blog categories',
            'edit blog categories',
            'delete blog categories',
            'view saved catalogues',
            'create saved catalogues',
            'edit saved catalogues',
            'delete saved catalogues',
            'view blogs',
            'create blogs',
            'edit blogs',
            'delete blogs',
            'view products',
            'create products',
            'edit products',
            'delete products',
            'create/edit product basic info',
            'create/edit product images',
            'create/edit product inventory',
            'create/edit product category',
            'create/edit product settings',
            'create/edit product for',
            'view inqueries',
            'create inqueries',
            'edit inqueries',
            'delete inqueries',
            'view inquiry statuses',
            'create inquiry statuses',
            'edit inquiry statuses',
            'delete inquiry statuses',
            'view testimonials',
            'create testimonials',
            'edit testimonials',
            'delete testimonials',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
