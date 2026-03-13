/**
 * Client-side image compression utility.
 * Compresses images so the long edge ≤ maxSize (default 1568px for Claude Vision optimal resolution).
 * Returns a base64-encoded data URL.
 */

export interface CompressResult {
  base64: string; // data URL (data:image/jpeg;base64,...)
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  originalSize: number; // bytes
  compressedSize: number; // approximate bytes
}

export function compressImage(
  file: File,
  maxSize: number = 1568,
  quality: number = 0.85,
): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        // Calculate scaled dimensions
        let width = originalWidth;
        let height = originalHeight;
        const longEdge = Math.max(width, height);

        if (longEdge > maxSize) {
          const scale = maxSize / longEdge;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // Draw on canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', quality);

        // Estimate compressed size (base64 is ~4/3 the binary size)
        const compressedSize = Math.round((base64.length - 'data:image/jpeg;base64,'.length) * 0.75);

        resolve({
          base64,
          width,
          height,
          originalWidth,
          originalHeight,
          originalSize: file.size,
          compressedSize,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Extract raw base64 string (without data URL prefix) */
export function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

/** Get media type from data URL */
export function getMediaType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/jpeg';
}
