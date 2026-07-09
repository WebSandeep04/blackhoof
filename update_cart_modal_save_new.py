import re

file_path = r'd:\DontDelete\laravel\blackhoof\blackhoof_frontend\src\components\CatalogueCartModal.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add saveAsNew state
content = content.replace(
    "const [isGenerating, setIsGenerating] = useState(false);",
    "const [isGenerating, setIsGenerating] = useState(false);\n    const [saveAsNew, setSaveAsNew] = useState(false);"
)

# 2. Reset saveAsNew in useEffect
useEffect_orig = '''    useEffect(() => {
        if (isOpen && cartName) {
            setCatalogueName(cartName);
        } else if (isOpen && !cartName) {
            setCatalogueName('');
        }
    }, [isOpen, cartName]);'''
useEffect_new = '''    useEffect(() => {
        if (isOpen && cartName) {
            setCatalogueName(cartName);
            setSaveAsNew(false);
        } else if (isOpen && !cartName) {
            setCatalogueName('');
            setSaveAsNew(false);
        }
    }, [isOpen, cartName]);'''
content = content.replace(useEffect_orig, useEffect_new)

# 3. Add save_as_new to API payload
content = content.replace(
    "name: catalogueName",
    "name: catalogueName,\n                save_as_new: saveAsNew"
)

# 4. Modify UI to include checkbox and conditional name field
form_orig = '''                                <div className="mb-4">
                                    <label htmlFor="catalogueName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Catalogue Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="catalogueName"
                                        required
                                        value={catalogueName}
                                        onChange={(e) => setCatalogueName(e.target.value)}
                                        placeholder="e.g. Summer Collection 2026"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">This name will appear on the cover of the generated PDF.</p>
                                </div>'''

form_new = '''                                {editingCatalogueId && (
                                    <div className="mb-4 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="saveAsNew"
                                            checked={saveAsNew}
                                            onChange={(e) => {
                                                setSaveAsNew(e.target.checked);
                                                if (e.target.checked) setCatalogueName('');
                                                else setCatalogueName(cartName || '');
                                            }}
                                            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                                        />
                                        <label htmlFor="saveAsNew" className="text-sm font-medium text-gray-700">
                                            Save as new catalogue
                                        </label>
                                    </div>
                                )}

                                {(!editingCatalogueId || saveAsNew) && (
                                    <div className="mb-4">
                                        <label htmlFor="catalogueName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Catalogue Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="catalogueName"
                                            required
                                            value={catalogueName}
                                            onChange={(e) => setCatalogueName(e.target.value)}
                                            placeholder="e.g. Summer Collection 2026"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">This name will appear on the cover of the generated PDF.</p>
                                    </div>
                                )}'''
content = content.replace(form_orig, form_new)

# 5. Fix submit button text
content = content.replace(
    "{editingCatalogueId ? 'Saving...' : 'Generating PDF...'}",
    "{(editingCatalogueId && !saveAsNew) ? 'Saving...' : 'Generating PDF...'}"
)
content = content.replace(
    "{editingCatalogueId ? 'Save & Download PDF' : 'Generate & Download PDF'}",
    "{(editingCatalogueId && !saveAsNew) ? 'Save & Download PDF' : 'Generate & Download PDF'}"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated CatalogueCartModal.jsx successfully.")
