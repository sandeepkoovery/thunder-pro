<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hosting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HostingController extends Controller
{
    public function index(Request $request)
    {
        $query = Hosting::query();

        if ($search = $request->input('search')) {
            $query->where('site_name', 'like', "%{$search}%")
                  ->orWhere('provider', 'like', "%{$search}%");
        }

        $sort      = $request->input('sort', 'expiration_date');
        $direction = $request->input('direction', 'asc');

        $allowed = ['id', 'site_name', 'provider', 'plan', 'status', 'expiration_date', 'auto_renewal', 'price'];
        if (!in_array($sort, $allowed)) {
            $sort = 'expiration_date';
        }

        $perPage  = (int) $request->input('perPage', 10);
        $hostings = $query->orderBy($sort, $direction)->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Hostings/Index', [
            'hostings' => $hostings,
            'filters'  => $request->only(['search', 'perPage', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'site_name'       => 'required|string|max:255',
            'provider'        => 'required|string|max:255',
            'plan'            => 'nullable|string|max:255',
            'server_ip'       => 'nullable|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'price'           => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
        ]);

        Hosting::create($validated);

        return back()->with('success', 'Hosting added successfully!');
    }

    public function update(Request $request, Hosting $hosting)
    {
        $validated = $request->validate([
            'site_name'       => 'required|string|max:255',
            'provider'        => 'required|string|max:255',
            'plan'            => 'nullable|string|max:255',
            'server_ip'       => 'nullable|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'price'           => 'nullable|numeric|min:0',
            'notes'           => 'nullable|string',
        ]);

        $hosting->update($validated);

        return back()->with('success', 'Hosting updated successfully!');
    }

    public function destroy(Hosting $hosting)
    {
        $hosting->delete();

        return back()->with('success', 'Hosting deleted successfully!');
    }
}
