<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Hosting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebsiteController extends Controller
{
    public function index(Request $request)
    {
        $domains  = Domain::orderBy('expiration_date', 'asc')->get();
        $hostings = Hosting::orderBy('expiration_date', 'asc')->get();

        return Inertia::render('Admin/Websites/Index', [
            'domains'  => $domains,
            'hostings' => $hostings,
            'tab'      => $request->input('tab', 'domains'),
        ]);
    }
}
