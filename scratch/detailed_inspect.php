<?php

function detailedInspect($path) {
    echo "=== Detailed inspect of $path ===\n";
    $img = imagecreatefrompng($path);
    $w = imagesx($img);
    $h = imagesy($img);

    $darkCount = 0;
    $whiteCount = 0;
    $transparentCount = 0;
    $purpleCount = 0;

    for ($x = 0; $x < $w; $x++) {
        for ($y = 0; $y < $h; $y++) {
            $rgba = imagecolorat($img, $x, $y);
            $c = imagecolorsforindex($img, $rgba);
            if ($c['alpha'] == 127) {
                $transparentCount++;
            } elseif ($c['red'] < 40 && $c['green'] < 40 && $c['blue'] < 40) {
                $darkCount++;
            } elseif ($c['red'] > 240 && $c['green'] > 240 && $c['blue'] > 240) {
                $whiteCount++;
            } else {
                $purpleCount++;
            }
        }
    }

    $total = $w * $h;
    echo "Total pixels: $total\n";
    echo "Transparent: $transparentCount (" . round($transparentCount/$total*100, 2) . "%)\n";
    echo "Dark/Black: $darkCount (" . round($darkCount/$total*100, 2) . "%)\n";
    echo "White: $whiteCount (" . round($whiteCount/$total*100, 2) . "%)\n";
    echo "Purple/Logo: $purpleCount (" . round($purpleCount/$total*100, 2) . "%)\n";
}

detailedInspect('public/icons/icon-512x512.png');
detailedInspect('public/icons/icon-maskable-512x512.png');
detailedInspect('public/images/worknest_logo.png');
