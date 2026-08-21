<?php

/**
 * Script to generate perfectly centered, balanced PWA icons for WorkNest ERP
 */

function generatePwaIcon($sourcePath, $targetPath, $canvasSize, $logoWidthTarget) {
    // Load source logo PNG
    $srcImg = imagecreatefrompng($sourcePath);
    $srcW = imagesx($srcImg);
    $srcH = imagesy($srcImg);

    // Find actual bounding box of the purple logo symbol in the source image
    $minX = $srcW; $maxX = 0; $minY = $srcH; $maxY = 0;
    for ($x = 0; $x < $srcW; $x++) {
        for ($y = 0; $y < $srcH; $y++) {
            $rgba = imagecolorat($srcImg, $x, $y);
            $colors = imagecolorsforindex($srcImg, $rgba);
            // Non-transparent pixels
            if ($colors['alpha'] < 110) {
                if ($x < $minX) $minX = $x;
                if ($x > $maxX) $maxX = $x;
                if ($y < $minY) $minY = $y;
                if ($y > $maxY) $maxY = $y;
            }
        }
    }

    $cropW = $maxX - $minX + 1;
    $cropH = $maxY - $minY + 1;

    echo "Source Crop Box: MinX=$minX, MinY=$minY, Width=$cropW, Height=$cropH\n";

    // Create target canvas
    $dstImg = imagecreatetruecolor($canvasSize, $canvasSize);
    
    // Enable alpha blending and fill with pure clean white background (#FFFFFF)
    imagealphablending($dstImg, false);
    imagesavealpha($dstImg, true);
    $white = imagecolorallocate($dstImg, 255, 255, 255);
    imagefilledrectangle($dstImg, 0, 0, $canvasSize - 1, $canvasSize - 1, $white);
    imagealphablending($dstImg, true);

    // Calculate scaling
    $aspectRatio = $cropW / $cropH;
    $targetW = $logoWidthTarget;
    $targetH = round($targetW / $aspectRatio);

    // Calculate exact mathematical center
    $dstX = round(($canvasSize - $targetW) / 2);
    $dstY = round(($canvasSize - $targetH) / 2);

    echo "Target Placement in {$canvasSize}x{$canvasSize}: X=$dstX, Y=$dstY, Width=$targetW, Height=$targetH\n";
    echo "Margins: Left=$dstX, Right=" . ($canvasSize - $dstX - $targetW) . ", Top=$dstY, Bottom=" . ($canvasSize - $dstY - $targetH) . "\n";

    // Copy and resample with high quality
    imagecopyresampled(
        $dstImg, $srcImg,
        $dstX, $dstY,
        $minX, $minY,
        $targetW, $targetH,
        $cropW, $cropH
    );

    // Save PNG
    imagepng($dstImg, $targetPath, 9);
    imagedestroy($dstImg);
    imagedestroy($srcImg);

    echo "Successfully generated: $targetPath\n\n";
}

$sourceLogo = 'public/images/worknest_logo.png';

// Generate 512x512 standard & maskable icons (Target logo width = 310px out of 512px)
generatePwaIcon($sourceLogo, 'public/icons/icon-512x512.png', 512, 310);
generatePwaIcon($sourceLogo, 'public/icons/icon-maskable-512x512.png', 512, 310);

// Generate 192x192 standard & maskable icons (Target logo width = 116px out of 192px)
generatePwaIcon($sourceLogo, 'public/icons/icon-192x192.png', 192, 116);
generatePwaIcon($sourceLogo, 'public/icons/icon-maskable-192x192.png', 192, 116);

// Copy to public/build/icons as well if it exists
if (!is_dir('public/build/icons')) {
    mkdir('public/build/icons', 0755, true);
}
copy('public/icons/icon-512x512.png', 'public/build/icons/icon-512x512.png');
copy('public/icons/icon-maskable-512x512.png', 'public/build/icons/icon-maskable-512x512.png');
copy('public/icons/icon-192x192.png', 'public/build/icons/icon-192x192.png');
copy('public/icons/icon-maskable-192x192.png', 'public/build/icons/icon-maskable-192x192.png');

echo "All PWA icons generated and synced!\n";
