<?php
// generate_centered_icons.php

function createCenteredIcon($sourcePath, $destPath, $size, $isMaskable = false) {
    if (!file_exists($sourcePath)) {
        echo "Source file not found: $sourcePath\n";
        return false;
    }

    $src = imagecreatefrompng($sourcePath);
    if (!$src) {
        echo "Failed to load PNG: $sourcePath\n";
        return false;
    }

    $width = imagesx($src);
    $height = imagesy($src);

    // Find the bounding box of non-transparent pixels
    $top = $height;
    $bottom = 0;
    $left = $width;
    $right = 0;

    for ($y = 0; $y < $height; $y++) {
        for ($x = 0; $x < $width; $x++) {
            $color = imagecolorat($src, $x, $y);
            $alpha = ($color >> 24) & 0x7F;
            if ($alpha < 127) { // not fully transparent
                if ($x < $left) $left = $x;
                if ($x > $right) $right = $x;
                if ($y < $top) $top = $y;
                if ($y > $bottom) $bottom = $y;
            }
        }
    }

    // Bounding box dimensions
    $logoW = $right - $left + 1;
    $logoH = $bottom - $top + 1;

    if ($logoW <= 0 || $logoH <= 0) {
        $left = 0;
        $top = 0;
        $logoW = $width;
        $logoH = $height;
    }

    // Create destination canvas
    $dst = imagecreatetruecolor($size, $size);
    
    // Enable alpha blending and save alpha
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    
    // Fill with solid white
    $white = imagecolorallocate($dst, 255, 255, 255);
    imagefill($dst, 0, 0, $white);

    // Determine target size for the logo inside the canvas
    // Using 58% for maskable and 72% for standard
    $maxSize = $isMaskable ? ($size * 0.58) : ($size * 0.72);

    $ratio = min($maxSize / $logoW, $maxSize / $logoH);
    $targetW = round($logoW * $ratio);
    $targetH = round($logoH * $ratio);

    // Center coordinates
    $dstX = round(($size - $targetW) / 2);
    $dstY = round(($size - $targetH) / 2);

    // Enable alpha blending on destination to merge the transparent logo on top of the white background
    imagealphablending($dst, true);

    imagecopyresampled(
        $dst, $src,
        $dstX, $dstY,
        $left, $top,
        $targetW, $targetH,
        $logoW, $logoH
    );

    // Save as PNG
    $success = imagepng($dst, $destPath);

    imagedestroy($src);
    imagedestroy($dst);

    echo "Generated " . ($isMaskable ? "maskable " : "") . "icon ($size x $size) at: $destPath\n";
    return $success;
}

$logoPath = __DIR__ . '/public/images/worknest_logo.png';
$iconsDir = __DIR__ . '/public/icons/';

if (!is_dir($iconsDir)) {
    mkdir($iconsDir, 0755, true);
}

// Generate the 4 manifest icons
createCenteredIcon($logoPath, $iconsDir . 'icon-192x192.png', 192, false);
createCenteredIcon($logoPath, $iconsDir . 'icon-512x512.png', 512, false);
createCenteredIcon($logoPath, $iconsDir . 'icon-maskable-192x192.png', 192, true);
createCenteredIcon($logoPath, $iconsDir . 'icon-maskable-512x512.png', 512, true);

echo "All icons successfully generated!\n";
