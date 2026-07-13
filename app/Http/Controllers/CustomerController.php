<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CustomerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view customers', only: ['index', 'show']),
            new Middleware('permission:create customers', only: ['store']),
            new Middleware('permission:edit customers', only: ['update']),
            new Middleware('permission:delete customers', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $query = Customer::with('country');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
        }

        if ($request->has('all')) {
            return response()->json($query->orderBy('name')->get());
        }

        $customers = $query->orderBy('name')->paginate(10);
        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers,email',
            'phone' => 'nullable|string|max:255',
            'country_id' => 'required|exists:countries,id',
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'country_id' => $request->country_id,
        ]);

        return response()->json($customer->load('country'), 201);
    }

    public function show(Customer $customer)
    {
        return response()->json($customer->load('country'));
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:customers,email,' . $customer->id,
            'phone' => 'nullable|string|max:255',
            'country_id' => 'required|exists:countries,id',
        ]);

        $customer->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'country_id' => $request->country_id,
        ]);

        return response()->json($customer->load('country'));
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(null, 204);
    }
}
