<?php

function analyzeImage($path) {
    echo "=== Analyzing $path ===\n";
    if (!file_exists($path)) {
        echo "File does not exist!\n";
        return;
    }
    $info = getimagesize($path);
    echo "Dimensions: " . $info[0] . "x" . $info[1] . "\n";
    
    $img = imagecreatefrompng($path);
    $w = imagesx($img);
    $h = imagesy($img);

    // Sample corners
    $corners = [[0, 0], [$w - 1, 0], [0, $h - 1], [$w - 1, $h - 1], [intval($w/2), intval($h/2)]];
    foreach ($corners as $c) {
        $rgba = imagecolorat($img, $c[0], $c[1]);
        $colors = imagecolorsforindex($img, $rgba);
        echo "Point ({$c[0]}, {$c[1]}): R={$colors['red']} G={$colors['green']} B={$colors['blue']} Alpha={$colors['alpha']}\n";
    }

    // Find bounding box of non-transparent / non-background pixels
    $minX = $w; $maxX = 0; $minY = $h; $maxY = 0;
    for ($x = 0; $x < $w; $x += 2) {
        for ($y = 0; $y < $h; $y += 2) {
            $rgba = imagecolorat($img, $x, $y);
            $colors = imagecolorsforindex($img, $rgba);
            // Check if not fully transparent and not black/dark background
            if ($colors['alpha'] < 120 && !($colors['red'] < 30 && $colors['green'] < 30 && $colors['blue'] < 30)) {
                if ($x < $minX) $minX = $x;
                if ($x > $maxX) $maxX = $x;
                if ($y < $minY) $minY = $y;
                if ($y > $maxY) $maxY = $y;
            }
        }
    }

    echo "Bounding box of logo symbol: MinX=$minX, MaxX=$maxX, MinY=$minY, MaxY=$maxY\n";
    echo "Logo Width: " . ($maxX - $minX) . ", Logo Height: " . ($maxY - $minY) . "\n";
    echo "Top Margin: $minY, Bottom Margin: " . ($h - $maxY) . "\n";
    echo "Left Margin: $minX, Right Margin: " . ($w - $maxX) . "\n";
}

analyzeImage('public/icons/icon-512x512.png');
analyzeImage('public/icons/icon-maskable-512x512.png');
analyzeImage('public/images/worknest_logo.png');
analyzeImage('public/images/worknest_logo_original.png');
