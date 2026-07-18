<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DomainController extends Controller
{
    public function index(Request $request)
    {
        $query = Domain::query();

        if ($search = $request->input('search')) {
            $query->where('domain_name', 'like', "%{$search}%");
        }

        $sort = $request->input('sort', 'expiration_date');
        $direction = $request->input('direction', 'asc');

        $allowed = ['id', 'domain_name', 'status', 'expiration_date', 'auto_renewal'];
        if (!in_array($sort, $allowed)) {
            $sort = 'expiration_date';
        }

        $perPage = (int) $request->input('perPage', 10);
        $domains = $query->orderBy($sort, $direction)->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Domains/Index', [
            'domains' => $domains,
            'filters' => $request->only(['search', 'perPage', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_name' => 'required|string|max:255',
            'status' => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal' => 'required|boolean',
            'provider' => 'nullable|string|max:255',
        ]);

        Domain::create($validated);

        return back()->with('success', 'Domain added successfully!');
    }

    public function update(Request $request, Domain $domain)
    {
        $validated = $request->validate([
            'domain_name' => 'required|string|max:255',
            'status' => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal' => 'required|boolean',
            'provider' => 'nullable|string|max:255',
        ]);

        $domain->update($validated);

        return back()->with('success', 'Domain updated successfully!');
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();

        return back()->with('success', 'Domain deleted successfully!');
    }
}
