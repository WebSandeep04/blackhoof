<?php

namespace App\Http\Controllers;

use App\Models\Inquery;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class InqueryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view inqueries', only: ['index', 'show']),
            new Middleware('permission:edit inqueries', only: ['update']),
            new Middleware('permission:delete inqueries', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Inquery::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('inquery_for')) {
            $query->where('inquery_for', $request->inquery_for);
        }

        $inqueries = $query->latest()->paginate(10);
        return response()->json($inqueries);
    }

    /**
     * Store a newly created resource in storage.
     * Note: This could be open to the public depending on the route, 
     * but we protect it for admins in middleware above, 
     * wait, actually public form submissions need a separate open route or we remove 'create inqueries' middleware for 'store'.
     * I will adjust middleware in routes or controller.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'message' => 'nullable|string',
            'inquery_for' => 'required|string|max:50',
            'status' => 'boolean',
        ]);

        $inquery = Inquery::create($request->all());

        return response()->json($inquery, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $inquery = Inquery::findOrFail($id);
        return response()->json($inquery);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $inquery = Inquery::findOrFail($id);

        $request->validate([
            'status' => 'boolean',
        ]);

        // Mainly used for toggling status
        $inquery->update($request->only('status'));

        return response()->json($inquery);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $inquery = Inquery::findOrFail($id);
        $inquery->delete();

        return response()->json(null, 204);
    }
}
