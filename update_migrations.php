<?php

$dir = __DIR__ . '/database/migrations/';

$files = scandir($dir);

foreach ($files as $file) {
    if (strpos($file, 'create_categories_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'parent_id\')->nullable()->constrained(\'categories\')->onDelete(\'cascade\');' . "\n" . '            $table->string(\'name\');' . "\n" . '            $table->string(\'slug\')->unique();' . "\n" . '            $table->boolean(\'is_active\')->default(true);' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_attributes_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->string(\'name\');' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_attribute_values_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'attribute_id\')->constrained(\'attributes\')->onDelete(\'cascade\');' . "\n" . '            $table->string(\'value\');' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_category_attribute_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'category_id\')->constrained(\'categories\')->onDelete(\'cascade\');' . "\n" . '            $table->foreignId(\'attribute_id\')->constrained(\'attributes\')->onDelete(\'cascade\');' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_products_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'category_id\')->constrained(\'categories\')->onDelete(\'cascade\');' . "\n" . '            $table->string(\'name\');' . "\n" . '            $table->string(\'slug\')->unique();' . "\n" . '            $table->text(\'description\')->nullable();' . "\n" . '            $table->boolean(\'is_active\')->default(true);' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_product_variants_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'product_id\')->constrained(\'products\')->onDelete(\'cascade\');' . "\n" . '            $table->string(\'sku\')->unique();' . "\n" . '            $table->decimal(\'price\', 10, 2);' . "\n" . '            $table->integer(\'stock_quantity\')->default(0);' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    // create_product_variant_attribute_value_table is long, we can match it by partial
    if (strpos($file, 'variant_attribute_value') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'product_variant_id\')->constrained(\'product_variants\')->onDelete(\'cascade\');' . "\n" . '            $table->foreignId(\'attribute_value_id\')->constrained(\'attribute_values\')->onDelete(\'cascade\');' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
    if (strpos($file, 'create_product_images_table.php') !== false) {
        $content = file_get_contents($dir . $file);
        $content = str_replace(
            '$table->id();' . "\n" . '            $table->timestamps();',
            '$table->id();' . "\n" . '            $table->foreignId(\'product_id\')->constrained(\'products\')->onDelete(\'cascade\');' . "\n" . '            $table->foreignId(\'product_variant_id\')->nullable()->constrained(\'product_variants\')->onDelete(\'cascade\');' . "\n" . '            $table->string(\'image_path\');' . "\n" . '            $table->boolean(\'is_main\')->default(false);' . "\n" . '            $table->integer(\'sort_order\')->default(0);' . "\n" . '            $table->timestamps();',
            $content
        );
        file_put_contents($dir . $file, $content);
    }
}
echo "Migrations updated successfully.\n";
