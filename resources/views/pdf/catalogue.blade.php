<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $catalogue->name }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2bb69a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 32px; margin: 0; color: #2bb69a; text-transform: uppercase; }
        .header p { margin: 5px 0 0; color: #777; font-size: 14px; }
        .product { page-break-inside: avoid; margin-bottom: 40px; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
        .product-header { margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .product-title { font-size: 22px; font-weight: bold; margin: 0 0 5px; color: #222; }
        .product-category { font-size: 12px; color: #fff; background-color: #2bb69a; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; display: inline-block; }
        .product-content { width: 100%; display: table; }
        .product-image { width: 30%; display: table-cell; vertical-align: top; text-align: center; }
        .product-image img { max-width: 100%; max-height: 200px; border-radius: 4px; }
        .product-details { width: 65%; display: table-cell; vertical-align: top; padding-left: 20px; }
        .product-desc { font-size: 14px; line-height: 1.5; color: #555; margin-bottom: 15px; }
        .variants-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        .variants-table th, .variants-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .variants-table th { background-color: #f9f9f9; color: #333; }
        .price { font-weight: bold; color: #2bb69a; }
    </style>
</head>
<body>

    <div class="header">
        <h1>{{ $catalogue->name }}</h1>
        <p>Generated on {{ now()->format('F j, Y') }}</p>
    </div>

    @foreach($catalogue->products as $product)
        <div class="product">
            <div class="product-header">
                <h2 class="product-title">{{ $product->pivot->product_name_at_time_of_save ?? $product->name }}</h2>
                @if($product->category)
                    <span class="product-category">{{ $product->category->name }}</span>
                @endif
            </div>

            <div class="product-content">
                <div class="product-image">
                    @php
                        $mainImage = $product->images->where('is_main', true)->first() ?? $product->images->first();
                    @endphp
                    @if($mainImage)
                        <!-- If external URL, output it directly. If local, use public_path() for DomPDF to access it locally -->
                        <img src="{{ str_starts_with($mainImage->image_path, 'http') ? $mainImage->image_path : public_path('storage/'.$mainImage->image_path) }}" alt="{{ $product->name }}">
                    @else
                        <div style="padding: 50px; background: #f0f0f0; color: #999; border-radius: 4px;">No Image</div>
                    @endif
                </div>
                <div class="product-details">
                    <div class="product-desc">
                        {!! $product->short_description !!}
                    </div>

                    @php
                        $specificVariantId = $product->pivot->product_variant_id ?? null;
                        $variantsToDisplay = $specificVariantId 
                            ? $product->variants->where('id', $specificVariantId) 
                            : $product->variants;
                        $snapshotPrice = $product->pivot->price_at_time_of_save ?? null;
                    @endphp

                    @if($variantsToDisplay->count() > 0)
                        <table class="variants-table">
                            <thead>
                                <tr>
                                    <th>SKU</th>
                                    @if($catalogue->show_price ?? true)
                                        <th>Price</th>
                                    @endif
                                    <th>Attributes</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($variantsToDisplay as $variant)
                                    <tr>
                                        <td>{{ $variant->sku }}</td>
                                        @if($catalogue->show_price ?? true)
                                            <td class="price">${{ number_format($snapshotPrice ?? $variant->price, 2) }}</td>
                                        @endif
                                        <td>
                                            @foreach($variant->attributeValues as $attrVal)
                                                <strong>{{ $attrVal->attribute->name }}:</strong> {{ $attrVal->value }}<br>
                                            @endforeach
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </div>
            </div>
        </div>
    @endforeach

</body>
</html>
