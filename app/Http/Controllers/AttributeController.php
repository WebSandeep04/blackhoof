<?php

namespace App\Http\Controllers;

use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class AttributeController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view attributes', only: ['index', 'show']),
            new Middleware('permission:create attributes', only: ['store']),
            new Middleware('permission:edit attributes', only: ['update']),
            new Middleware('permission:delete attributes', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Attribute::with('values');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->query('all') === 'true') {
            return response()->json(Attribute::with('values')->orderBy('name')->get());
        }

        $attributes = $query->paginate(10);
        return response()->json($attributes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:attributes,name',
            'values' => 'nullable|array',
            'values.*.value' => 'required|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            $attribute = Attribute::create([
                'name' => $request->name,
            ]);

            if ($request->has('values') && is_array($request->values)) {
                foreach ($request->values as $val) {
                    $attribute->values()->create([
                        'value' => $val['value'],
                    ]);
                }
            }

            DB::commit();
            return response()->json($attribute->load('values'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create attribute', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $attribute = Attribute::with('values')->findOrFail($id);
        return response()->json($attribute);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $attribute = Attribute::findOrFail($id);

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('attributes')->ignore($attribute->id),
            ],
            'values' => 'nullable|array',
            'values.*.id' => 'nullable|exists:attribute_values,id',
            'values.*.value' => 'required|string|max:255',
        ]);

        DB::beginTransaction();

        try {
            $attribute->update([
                'name' => $request->name,
            ]);

            if ($request->has('values') && is_array($request->values)) {
                $submittedIds = collect($request->values)->pluck('id')->filter()->toArray();
                
                // Delete values that are not in the submitted array
                $attribute->values()->whereNotIn('id', $submittedIds)->delete();

                // Update or create values
                foreach ($request->values as $val) {
                    if (isset($val['id'])) {
                        // Update existing
                        AttributeValue::where('id', $val['id'])
                            ->where('attribute_id', $attribute->id) // Security check
                            ->update(['value' => $val['value']]);
                    } else {
                        // Create new
                        $attribute->values()->create(['value' => $val['value']]);
                    }
                }
            } else {
                // If no values provided, maybe they deleted all of them
                $attribute->values()->delete();
            }

            DB::commit();
            return response()->json($attribute->load('values'));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update attribute', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $attribute = Attribute::findOrFail($id);
        $attribute->delete();
        return response()->json(null, 204);
    }
}
