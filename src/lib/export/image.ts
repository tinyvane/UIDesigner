/**
 * Image Export — captures the canvas area as PNG/JPEG using html2canvas.
 */

export interface ImageExportOptions {
  /** Scale factor: 1 = 1920×1080, 2 = 3840×2160 */
  scale?: number;
  /** Output format */
  format?: 'png' | 'jpeg';
  /** JPEG quality (0-1) */
  quality?: number;
}

/**
 * Capture a DOM element as a data URL image.
 * The element should be the canvas container with all widgets rendered.
 */
export async function captureCanvasAsImage(
  element: HTMLElement,
  options: ImageExportOptions = {},
): Promise<string> {
  const { scale = 1, format = 'png', quality = 0.92 } = options;

  // Dynamically import html2canvas to avoid SSR issues
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: null, // Preserve element's background
    useCORS: true,
    logging: false,
    // Ensure we capture the full size
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  return canvas.toDataURL(`image/${format}`, quality);
}

/**
 * Trigger a browser download of the captured image.
 */
export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
