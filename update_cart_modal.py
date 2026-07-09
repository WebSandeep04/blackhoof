import re

file_path = r'd:\DontDelete\laravel\blackhoof\blackhoof_frontend\src\components\CatalogueCartModal.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useSelector for cartName and editingCatalogueId
content = content.replace(
    "const cartItems = useSelector(state => state.catalogueCart.cartItems);",
    "const cartItems = useSelector(state => state.catalogueCart.cartItems);\n    const { cartName, editingCatalogueId } = useSelector(state => state.catalogueCart);"
)

# Use useEffect to prefill catalogueName when modal opens if it's editing
useEffect_import = "import React, { useState, useEffect } from 'react';"
content = content.replace("import React, { useState } from 'react';", useEffect_import)

useEffect_block = '''
    useEffect(() => {
        if (isOpen && cartName) {
            setCatalogueName(cartName);
        } else if (isOpen && !cartName) {
            setCatalogueName('');
        }
    }, [isOpen, cartName]);
'''
content = content.replace("if (!isOpen) return null;", useEffect_block + "\n    if (!isOpen) return null;")

# Update Modal UI Text dynamically based on edit state
content = content.replace("Catalogue Generator", "{editingCatalogueId ? 'Edit Catalogue' : 'Catalogue Generator'}")
content = content.replace("Generate & Download PDF", "{editingCatalogueId ? 'Save & Download PDF' : 'Generate & Download PDF'}")
content = content.replace("Generating PDF...", "{editingCatalogueId ? 'Saving...' : 'Generating PDF...'}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated CatalogueCartModal.jsx successfully.")
