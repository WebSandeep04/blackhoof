<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CountryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view countries', only: ['index', 'show']),
            new Middleware('permission:create countries', only: ['store']),
            new Middleware('permission:edit countries', only: ['update']),
            new Middleware('permission:delete countries', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Country::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('all')) {
            return response()->json($query->orderBy('name')->get());
        }

        $countries = $query->orderBy('name')->paginate(10);
        return response()->json($countries);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:countries,name',
        ]);

        $country = Country::create([
            'name' => $request->name,
        ]);

        return response()->json($country, 201);
    }

    public function show(Country $country)
    {
        return response()->json($country);
    }

    public function update(Request $request, Country $country)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:countries,name,' . $country->id,
        ]);

        $country->update([
            'name' => $request->name,
        ]);

        return response()->json($country);
    }

    public function destroy(Country $country)
    {
        // Check if country has customers
        if ($country->customers()->exists()) {
            return response()->json(['message' => 'Cannot delete country with associated customers.'], 400);
        }
        
        $country->delete();
        return response()->json(null, 204);
    }
}
