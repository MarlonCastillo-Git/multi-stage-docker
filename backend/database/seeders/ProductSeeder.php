<?php
namespace Database\Seeders;
use App\Models\Product;
use Illuminate\Database\Seeder;
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([['Teclado mecánico', 'teclado-mecanico', '59.90'], ['Mouse inalámbrico', 'mouse-inalambrico', '24.50'], ['Monitor 24 pulgadas', 'monitor-24', '179.00']] as [$name, $slug, $price]) {
            // Never reset stock or overwrite purchases when a container restarts.
            Product::firstOrCreate(['slug' => $slug], ['name' => $name, 'description' => 'Producto de demostración del ecosistema Docker.', 'price' => $price, 'stock' => 100, 'is_active' => true]);
        }
    }
}
