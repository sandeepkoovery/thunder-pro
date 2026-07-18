<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\IsAdmin;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\CheckBetaAccess::class,
        ]);

        $middleware->alias([
            'is_admin' => IsAdmin::class,
            'is_super_admin' => \App\Http\Middleware\IsSuperAdmin::class,
            'is_super_or_admin' => \App\Http\Middleware\IsSuperOrAdmin::class,
        ]);
    })
    ->withExceptions(function ($exceptions) {
        //
    })->create();

