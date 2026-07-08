<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        return [
            'category_id' => Category::factory(),
            'name' => ucwords($name),
            'slug' => Str::slug($name),
            'short_description' => $this->faker->sentence(10),
            'description' => $this->faker->paragraphs(3, true),
            'is_active' => true,
            'include_in_catalogue' => true,
            'product_for' => $this->faker->randomElement(['satkirti', 'blackhoof']),
        ];
    }
}
