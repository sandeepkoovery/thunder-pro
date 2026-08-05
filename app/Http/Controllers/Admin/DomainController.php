<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Hosting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DomainController extends Controller
{
    /**
     * Resolve the tenant admin ID for the authenticated user.
     * Returns null for superadmin (sees all).
     */
    private function tenantAdminId(): ?int
    {
        $user = auth()->user();
        if ($user->role === 'superadmin') {
            return null;
        }
        return $user->role === 'admin' ? $user->id : ($user->admin_id ?? $user->id);
    }

    public function index(Request $request)
    {
        $tenantAdminId = $this->tenantAdminId();

        $domainsQuery  = Domain::orderBy('expiration_date', 'asc');
        $hostingsQuery = Hosting::orderBy('expiration_date', 'asc');

        if ($tenantAdminId !== null) {
            $domainsQuery->where('admin_id', $tenantAdminId);
            $hostingsQuery->where('admin_id', $tenantAdminId);
        }

        $domains  = $domainsQuery->get();
        $hostings = $hostingsQuery->get();

        return Inertia::render('Admin/Domains/Index', [
            'domains'  => $domains,
            'hostings' => $hostings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_name'     => 'required|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'provider'        => 'nullable|string|max:255',
            'price'           => 'nullable|numeric',
        ]);

        $validated['admin_id'] = $this->tenantAdminId();

        Domain::create($validated);

        return back()->with('success', 'Domain added successfully!');
    }

    public function update(Request $request, Domain $domain)
    {
        $tenantAdminId = $this->tenantAdminId();

        // Prevent cross-tenant edit
        if ($tenantAdminId !== null && $domain->admin_id !== null && $domain->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'domain_name'     => 'required|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'provider'        => 'nullable|string|max:255',
            'price'           => 'nullable|numeric',
        ]);

        $domain->update($validated);

        return back()->with('success', 'Domain updated successfully!');
    }

    public function destroy(Domain $domain)
    {
        $tenantAdminId = $this->tenantAdminId();

        if ($tenantAdminId !== null && $domain->admin_id !== null && $domain->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        $domain->delete();

        return back()->with('success', 'Domain deleted successfully!');
    }

    public function storeHosting(Request $request)
    {
        $validated = $request->validate([
            'site_name'       => 'required|string|max:255',
            'provider'        => 'required|string|max:255',
            'plan'            => 'nullable|string|max:255',
            'server_ip'       => 'nullable|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'price'           => 'nullable|numeric',
            'notes'           => 'nullable|string',
        ]);

        $validated['admin_id'] = $this->tenantAdminId();

        Hosting::create($validated);

        return back()->with('success', 'Hosting added successfully!');
    }

    public function updateHosting(Request $request, Hosting $hosting)
    {
        $tenantAdminId = $this->tenantAdminId();

        if ($tenantAdminId !== null && $hosting->admin_id !== null && $hosting->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'site_name'       => 'required|string|max:255',
            'provider'        => 'required|string|max:255',
            'plan'            => 'nullable|string|max:255',
            'server_ip'       => 'nullable|string|max:255',
            'status'          => 'required|string',
            'expiration_date' => 'required|date',
            'auto_renewal'    => 'required|boolean',
            'price'           => 'nullable|numeric',
            'notes'           => 'nullable|string',
        ]);

        $hosting->update($validated);

        return back()->with('success', 'Hosting updated successfully!');
    }

    public function destroyHosting(Hosting $hosting)
    {
        $tenantAdminId = $this->tenantAdminId();

        if ($tenantAdminId !== null && $hosting->admin_id !== null && $hosting->admin_id !== $tenantAdminId) {
            abort(403, 'Unauthorized.');
        }

        $hosting->delete();

        return back()->with('success', 'Hosting deleted successfully!');
    }
}
