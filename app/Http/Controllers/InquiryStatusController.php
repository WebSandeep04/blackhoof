<?php

namespace App\Http\Controllers;

use App\Models\InquiryStatus;
use Illuminate\Http\Request;

class InquiryStatusController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = InquiryStatus::query();
        
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->has('all') && $request->all == true) {
            return response()->json($query->orderBy('name')->get());
        }

        return response()->json($query->latest()->paginate(10));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:inquiry_statuses,name',
        ]);

        $status = InquiryStatus::create([
            'name' => $request->name,
        ]);

        return response()->json($status, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $status = InquiryStatus::findOrFail($id);
        return response()->json($status);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $status = InquiryStatus::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:inquiry_statuses,name,' . $status->id,
        ]);

        $status->update([
            'name' => $request->name,
        ]);

        return response()->json($status);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $status = InquiryStatus::findOrFail($id);
        $status->delete();
        
        return response()->json(null, 204);
    }
}
