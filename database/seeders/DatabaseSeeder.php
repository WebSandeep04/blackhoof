<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\BlogCategory;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Core Seeders (Roles, Permissions, Admin)
        $this->call([
            PermissionSeeder::class,
            RoleSeeder::class,
            AdminUserSeeder::class,
        ]);

        // 1.5 Generate Blog Categories
        $blogCategories = ['Technology', 'Lifestyle', 'Health', 'Travel', 'Food', 'Business', 'Education', 'Entertainment', 'Sports', 'Fashion'];
        foreach ($blogCategories as $cat) {
            BlogCategory::create([
                'name' => $cat,
                'slug' => Str::slug($cat),
                'description' => "All posts related to $cat"
            ]);
        }

        // 2. Generate 10 Parent Categories
        $parentCategories = Category::factory()->count(10)->create();

        // 3. Generate 40 Child Categories (total 50 categories)
        $childCategories = collect();
        foreach (range(1, 40) as $i) {
            $childCategories->push(Category::factory()->create([
                'parent_id' => $parentCategories->random()->id
            ]));
        }

        $allCategories = $parentCategories->merge($childCategories);

        // 4. Generate 10 Attributes
        $attributes = Attribute::factory()->count(10)->create();

        // 5. Generate 5 Values per Attribute (total 50 values)
        $attributeValues = collect();
        foreach ($attributes as $attribute) {
            $attributeValues = $attributeValues->merge(
                AttributeValue::factory()->count(5)->create([
                    'attribute_id' => $attribute->id
                ])
            );
        }

        // 6. Generate 50 Products
        $products = Product::factory()->count(50)->create([
            'category_id' => fn() => $allCategories->random()->id
        ]);

        // 7. Generate Variants and Images for each Product
        foreach ($products as $product) {
            // Images (1 main, 1-2 gallery)
            ProductImage::factory()->create([
                'product_id' => $product->id,
                'is_main' => true,
                'sort_order' => 0
            ]);

            ProductImage::factory()->count(rand(1, 2))->create([
                'product_id' => $product->id,
                'is_main' => false,
            ]);

            // Variants
            $variants = ProductVariant::factory()->count(rand(1, 3))->create([
                'product_id' => $product->id
            ]);

            // Attach 1-2 random Attribute Values to each Variant
            foreach ($variants as $variant) {
                // Ensure we don't attach multiple values of the same attribute
                $randomAttributes = $attributes->random(rand(1, 2));
                $valuesToAttach = [];

                foreach ($randomAttributes as $attr) {
                    $randomValue = $attributeValues->where('attribute_id', $attr->id)->random();
                    $valuesToAttach[] = $randomValue->id;
                }

                $variant->attributeValues()->attach($valuesToAttach);
            }
        }
    }
}
