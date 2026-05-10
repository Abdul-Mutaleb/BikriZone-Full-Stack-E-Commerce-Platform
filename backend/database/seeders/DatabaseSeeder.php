<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\CannedResponse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@megabazar.com',
            'phone' => '01700000000',
            'password' => 'password',
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        // Order Manager
        User::create([
            'name' => 'Order Manager',
            'email' => 'manager@megabazar.com',
            'phone' => '01700000001',
            'password' => 'password',
            'role' => 'order_manager',
            'is_active' => true,
        ]);

        // Sample Customer
        User::create([
            'name' => 'John Customer',
            'email' => 'customer@megabazar.com',
            'phone' => '01711111111',
            'password' => 'password',
            'role' => 'customer',
            'is_active' => true,
        ]);

        // Categories
        $categories = [
            ['name' => 'Electronics', 'slug' => 'electronics', 'sort_order' => 1],
            ['name' => 'Fashion', 'slug' => 'fashion', 'sort_order' => 2],
            ['name' => 'Home & Garden', 'slug' => 'home-garden', 'sort_order' => 3],
            ['name' => 'Sports & Outdoors', 'slug' => 'sports-outdoors', 'sort_order' => 4],
            ['name' => 'Books', 'slug' => 'books', 'sort_order' => 5],
            ['name' => 'Health & Beauty', 'slug' => 'health-beauty', 'sort_order' => 6],
            ['name' => 'Toys & Kids', 'slug' => 'toys-kids', 'sort_order' => 7],
            ['name' => 'Groceries', 'slug' => 'groceries', 'sort_order' => 8],
        ];

        foreach ($categories as $cat) {
            Category::create(array_merge($cat, ['is_active' => true]));
        }

        $electronicsId = Category::where('slug', 'electronics')->first()->id;
        $fashionId = Category::where('slug', 'fashion')->first()->id;

        // Sub-categories
        Category::create(['name' => 'Smartphones', 'slug' => 'smartphones', 'parent_id' => $electronicsId, 'sort_order' => 1, 'is_active' => true]);
        Category::create(['name' => 'Laptops', 'slug' => 'laptops', 'parent_id' => $electronicsId, 'sort_order' => 2, 'is_active' => true]);
        Category::create(['name' => 'Men\'s Clothing', 'slug' => 'mens-clothing', 'parent_id' => $fashionId, 'sort_order' => 1, 'is_active' => true]);
        Category::create(['name' => 'Women\'s Clothing', 'slug' => 'womens-clothing', 'parent_id' => $fashionId, 'sort_order' => 2, 'is_active' => true]);

        // Sample Products
        $sampleProducts = [
            [
                'category_id' => $electronicsId,
                'name' => 'Samsung Galaxy A54',
                'slug' => 'samsung-galaxy-a54-' . Str::random(4),
                'short_description' => '6.4" FHD+ display, 5000mAh battery',
                'description' => 'The Samsung Galaxy A54 features a stunning 6.4-inch FHD+ display with 120Hz refresh rate...',
                'price' => 29999,
                'sale_price' => 27999,
                'sku' => 'SAM-A54-001',
                'stock' => 50,
                'is_featured' => true,
            ],
            [
                'category_id' => $electronicsId,
                'name' => 'Apple iPhone 15',
                'slug' => 'apple-iphone-15-' . Str::random(4),
                'short_description' => 'A16 Bionic chip, 48MP camera',
                'description' => 'Experience the power of Apple iPhone 15 with its advanced A16 Bionic chip...',
                'price' => 89999,
                'sale_price' => null,
                'sku' => 'APL-IP15-001',
                'stock' => 30,
                'is_featured' => true,
            ],
            [
                'category_id' => $fashionId,
                'name' => 'Classic Cotton T-Shirt',
                'slug' => 'classic-cotton-tshirt-' . Str::random(4),
                'short_description' => '100% premium cotton, multiple colors',
                'description' => 'Comfortable everyday T-shirt made from 100% premium cotton...',
                'price' => 599,
                'sale_price' => 499,
                'sku' => 'FSH-TSH-001',
                'stock' => 200,
                'is_featured' => false,
            ],
            [
                'category_id' => $fashionId,
                'name' => 'Slim Fit Jeans',
                'slug' => 'slim-fit-jeans-' . Str::random(4),
                'short_description' => 'Premium denim, slim fit',
                'description' => 'Stylish slim fit jeans crafted from high-quality denim...',
                'price' => 1499,
                'sale_price' => 1199,
                'sku' => 'FSH-JNS-001',
                'stock' => 80,
                'is_featured' => true,
            ],
        ];

        foreach ($sampleProducts as $productData) {
            Product::create(array_merge($productData, ['is_active' => true, 'low_stock_threshold' => 5]));
        }

        // Settings
        $settings = [
            ['key' => 'shipping_charge', 'value' => '60', 'group' => 'shipping'],
            ['key' => 'free_shipping_above', 'value' => '2000', 'group' => 'shipping'],
            ['key' => 'tax_rate', 'value' => '0', 'group' => 'shipping'],
            ['key' => 'site_name', 'value' => 'MegaBazar', 'group' => 'general'],
            ['key' => 'site_tagline', 'value' => 'Your One-Stop Shop', 'group' => 'general'],
            ['key' => 'currency_symbol', 'value' => '৳', 'group' => 'general'],
            ['key' => 'bkash_sandbox_mode', 'value' => 'true', 'group' => 'payment'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }

        // Canned Responses
        CannedResponse::create(['shortcut' => '/thanks', 'title' => 'Thank You', 'response' => 'Thank you for contacting MegaBazar! Is there anything else I can help you with?']);
        CannedResponse::create(['shortcut' => '/shipping', 'title' => 'Shipping Info', 'response' => 'We offer standard delivery (3-5 days) for ৳60 and free delivery on orders above ৳2000.']);
        CannedResponse::create(['shortcut' => '/return', 'title' => 'Return Policy', 'response' => 'We accept returns within 7 days of delivery for unused items in original packaging.']);
    }
}
