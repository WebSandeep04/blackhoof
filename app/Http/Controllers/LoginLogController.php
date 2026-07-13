<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LoginLog;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class LoginLogController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view login logs', only: ['index']),
        ];
    }

    public function index(Request $request)
    {
        $query = LoginLog::select(
            \DB::raw('DATE(created_at) as login_date'),
            'user_id',
            \DB::raw('COUNT(*) as login_count'),
            \DB::raw('MAX(created_at) as last_login'),
            \DB::raw('MAX(ip_address) as last_ip')
        )->with('user');

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $query->groupByRaw('DATE(created_at), user_id')
              ->orderByRaw('DATE(created_at) DESC')
              ->orderByRaw('MAX(created_at) DESC');

        $logs = $query->paginate(10);

        // Load trails for each group
        $logs->getCollection()->transform(function ($group) {
            $group->trail = LoginLog::where('user_id', $group->user_id)
                ->whereDate('created_at', $group->login_date)
                ->orderBy('created_at', 'desc')
                ->get();
            return $group;
        });

        return response()->json($logs);
    }
}
