<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductImage>
 */
class ProductImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'image_path' => 'https://picsum.photos/seed/' . $this->faker->uuid() . '/400/400',
            'is_main' => false,
            'sort_order' => $this->faker->numberBetween(0, 10),
        ];
    }
}
