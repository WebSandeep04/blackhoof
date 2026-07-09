import re

file_path = r'd:\DontDelete\laravel\blackhoof\blackhoof_frontend\src\pages\AdminCatalogue.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { fetchSavedCatalogues, deleteSavedCatalogue, fetchCatalogueVersions, updateSavedCatalogue } from '../store/slices/savedCataloguesSlice';",
    "import { fetchSavedCatalogues, deleteSavedCatalogue, fetchCatalogueVersions } from '../store/slices/savedCataloguesSlice';"
)

content = content.replace(
    "import { Link } from 'react-router-dom';",
    "import { Link, useNavigate } from 'react-router-dom';"
)

# 2. Add useNavigate hook inside AdminCatalogue
content = content.replace(
    "const dispatch = useDispatch();",
    "const dispatch = useDispatch();\n    const navigate = useNavigate();"
)

# 3. Replace openEditModal with handleEdit
old_edit_handler = '''
    const openEditModal = (catalogue) => {
        setSelectedCatalogue(catalogue);
        setEditProducts(catalogue.products || []);
        setIsEditModalOpen(true);
    };

    const handleRemoveProduct = (productId) => {
        setEditProducts(prev => prev.filter(p => p.id !== productId));
    };

    const handleAddProduct = (product) => {
        if (!editProducts.find(p => p.id === product.id)) {
            setEditProducts(prev => [...prev, product]);
        }
    };

    const saveEdit = async () => {
        try {
            await dispatch(updateSavedCatalogue({
                id: selectedCatalogue.id,
                product_ids: editProducts.map(p => p.id)
            })).unwrap();
            
            Swal.fire('Success', 'Catalogue updated successfully', 'success');
            setIsEditModalOpen(false);
            dispatch(fetchSavedCatalogues({ page, search: searchQuery }));
        } catch (error) {
            Swal.fire('Error', 'Failed to update catalogue', 'error');
        }
    };
'''

new_edit_handler = '''
    const handleEdit = async (catalogue) => {
        try {
            await api.post(/saved-catalogues//load-to-draft);
            navigate('/admin/catalogue/preview');
        } catch (error) {
            Swal.fire('Error', 'Failed to load catalogue for editing', 'error');
        }
    };
'''
content = content.replace(old_edit_handler, new_edit_handler)

# 4. Remove Edit Modal
# Find the start of the edit modal and end of it.
edit_modal_start = "{/* Edit Modal */}"
edit_modal_end = ")}\n        </div>"

import sys
start_idx = content.find(edit_modal_start)
if start_idx != -1:
    end_idx = content.find(edit_modal_end, start_idx)
    if end_idx != -1:
        content = content[:start_idx] + "        </div>"

# 5. Replace openEditModal call with handleEdit
content = content.replace("onClick={() => openEditModal(catalogue)}", "onClick={() => handleEdit(catalogue)}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AdminCatalogue.jsx successfully.")
