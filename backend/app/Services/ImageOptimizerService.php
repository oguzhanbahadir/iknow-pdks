<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageOptimizerService
{
    /**
     * Target max byte size for optimized WebP images (100 KB).
     */
    protected const MAX_TARGET_BYTES = 100 * 1024; // 102400 bytes

    /**
     * Target max dimension (width or height).
     */
    protected const MAX_DIMENSION = 1600;

    /**
     * Convert and optimize an uploaded image to WebP format.
     * Uses Imagick as primary, with a GD fallback if Imagick is not installed.
     *
     * @param UploadedFile $file
     * @param string $directory Storage subdirectory (e.g. 'task_attachments')
     * @return array{path: string, size: int, mime: string, name: string}
     */
    public function optimizeAndStoreImage(UploadedFile $file, string $directory = 'task_attachments'): array
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeBaseName = Str::slug($originalName) ?: 'image';
        $uniqueName = $safeBaseName . '_' . uniqid() . '.webp';
        $relativeStoragePath = $directory . '/' . $uniqueName;

        // Ensure storage directory exists
        Storage::disk('public')->makeDirectory($directory);
        $absoluteDestPath = Storage::disk('public')->path($relativeStoragePath);

        $tempPath = $file->getRealPath();

        if (class_exists('Imagick')) {
            $this->processWithImagick($tempPath, $absoluteDestPath);
        } elseif (function_exists('imagewebp')) {
            $this->processWithGD($tempPath, $absoluteDestPath, $file->getClientMimeType() ?: $file->getMimeType());
        } else {
            // Raw store if no image processing extensions are available
            $path = $file->store($directory, 'public');
            return [
                'path' => $path,
                'size' => Storage::disk('public')->size($path),
                'mime' => $file->getClientMimeType() ?: 'image/jpeg',
                'name' => $file->getClientOriginalName(),
            ];
        }

        $finalSize = file_exists($absoluteDestPath) ? filesize($absoluteDestPath) : 0;

        return [
            'path' => $relativeStoragePath,
            'size' => $finalSize,
            'mime' => 'image/webp',
            'name' => $safeBaseName . '.webp',
        ];
    }

    /**
     * Process image using Imagick to WebP with dimension & compression optimization.
     */
    protected function processWithImagick(string $sourcePath, string $destPath): void
    {
        $imagick = new \Imagick($sourcePath);

        // Strip metadata / EXIF
        $imagick->stripImage();

        // Get orientation and fix if needed
        $orientation = $imagick->getImageOrientation();
        switch ($orientation) {
            case \Imagick::ORIENTATION_BOTTOMRIGHT:
                $imagick->rotateImage('#000', 180);
                break;
            case \Imagick::ORIENTATION_RIGHTTOP:
                $imagick->rotateImage('#000', 90);
                break;
            case \Imagick::ORIENTATION_LEFTBOTTOM:
                $imagick->rotateImage('#000', -90);
                break;
        }
        $imagick->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);

        // Downscale if dimensions exceed MAX_DIMENSION
        $width = $imagick->getImageWidth();
        $height = $imagick->getImageHeight();

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            if ($width >= $height) {
                $newWidth = self::MAX_DIMENSION;
                $newHeight = (int) round(($height / $width) * self::MAX_DIMENSION);
            } else {
                $newHeight = self::MAX_DIMENSION;
                $newWidth = (int) round(($width / $height) * self::MAX_DIMENSION);
            }
            $imagick->resizeImage($newWidth, $newHeight, \Imagick::FILTER_LANCZOS, 1);
        }

        // Set output format to webp
        $imagick->setImageFormat('webp');

        // Target: 50-100 KB max. Start with quality 80 and adjust if needed
        $quality = 80;
        $imagick->setImageCompressionQuality($quality);
        $imagick->writeImage($destPath);

        $currentSize = filesize($destPath);

        // If file size exceeds 100 KB, re-compress with lower quality and/or smaller scale
        if ($currentSize > self::MAX_TARGET_BYTES && $quality > 35) {
            for ($q = 70; $q >= 35; $q -= 15) {
                $imagick->setImageCompressionQuality($q);
                $imagick->writeImage($destPath);
                if (filesize($destPath) <= self::MAX_TARGET_BYTES) {
                    break;
                }
            }
        }

        // If still larger than 100 KB, resize further
        if (filesize($destPath) > self::MAX_TARGET_BYTES) {
            $w = (int) round($imagick->getImageWidth() * 0.75);
            $h = (int) round($imagick->getImageHeight() * 0.75);
            $imagick->resizeImage($w, $h, \Imagick::FILTER_LANCZOS, 1);
            $imagick->setImageCompressionQuality(65);
            $imagick->writeImage($destPath);
        }

        $imagick->clear();
        $imagick->destroy();
    }

    /**
     * Fallback to GD if Imagick is not installed in the local environment.
     */
    protected function processWithGD(string $sourcePath, string $destPath, ?string $mimeType): void
    {
        $image = null;

        $info = @getimagesize($sourcePath);
        $mime = $info['mime'] ?? $mimeType ?? '';

        if (str_contains($mime, 'jpeg') || str_contains($mime, 'jpg')) {
            $image = @imagecreatefromjpeg($sourcePath);
        } elseif (str_contains($mime, 'png')) {
            $image = @imagecreatefrompng($sourcePath);
        } elseif (str_contains($mime, 'webp')) {
            $image = @imagecreatefromwebp($sourcePath);
        }

        if (!$image) {
            // If GD fails to load, copy directly
            copy($sourcePath, $destPath);
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            if ($width >= $height) {
                $newWidth = self::MAX_DIMENSION;
                $newHeight = (int) round(($height / $width) * self::MAX_DIMENSION);
            } else {
                $newHeight = self::MAX_DIMENSION;
                $newWidth = (int) round(($width / $height) * self::MAX_DIMENSION);
            }

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        // Save as WebP with quality 80
        imagewebp($image, $destPath, 80);

        // Adjust if size > 100 KB
        if (file_exists($destPath) && filesize($destPath) > self::MAX_TARGET_BYTES) {
            imagewebp($image, $destPath, 60);
        }
        if (file_exists($destPath) && filesize($destPath) > self::MAX_TARGET_BYTES) {
            imagewebp($image, $destPath, 45);
        }

        imagedestroy($image);
    }
}
