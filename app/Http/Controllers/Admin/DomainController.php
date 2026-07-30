<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Hosting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DomainController extends Controller
{
    public function index(Request $request)
    {
        $domains = Domain::orderBy('expiration_date', 'asc')->get();
        $hostings = Hosting::orderBy('expiration_date', 'asc')->get();

        return Inertia::render('Admin/Domains/Index', [
            'domains' => $domains,
            'hostings' => $hostings,
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
            'price' => 'nullable|numeric',
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
            'price' => 'nullable|numeric',
        ]);

        $domain->update($validated);

        return back()->with('success', 'Domain updated successfully!');
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();

        return back()->with('success', 'Domain deleted successfully!');
    }

    public function storeHosting(Request $request)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'provider' => 'required|string|max:255',
            'plan' => 'nullable|string|max:255',
            'server_ip' => 'nullable|string|max:255',
            'status' => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal' => 'required|boolean',
            'price' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        Hosting::create($validated);

        return back()->with('success', 'Hosting added successfully!');
    }

    public function updateHosting(Request $request, Hosting $hosting)
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'provider' => 'required|string|max:255',
            'plan' => 'nullable|string|max:255',
            'server_ip' => 'nullable|string|max:255',
            'status' => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal' => 'required|boolean',
            'price' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $hosting->update($validated);

        return back()->with('success', 'Hosting updated successfully!');
    }

    public function destroyHosting(Hosting $hosting)
    {
        $hosting->delete();

        return back()->with('success', 'Hosting deleted successfully!');
    }
}
