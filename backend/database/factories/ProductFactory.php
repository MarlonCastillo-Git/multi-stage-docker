<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
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
        $name = fake()->unique()->words(3, true);

        return ['name' => ucfirst($name), 'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999), 'description' => fake()->sentence(16), 'price' => fake()->randomFloat(2, 5, 1500), 'stock' => fake()->numberBetween(0, 100), 'is_active' => true];
    }
}
