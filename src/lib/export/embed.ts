/**
 * Generate iframe embed snippets for sharing dashboards.
 */

export interface EmbedOptions {
  baseUrl: string;
  projectId?: string;
  width?: number;
  height?: number;
}

/**
 * Generate an iframe embed snippet for the preview page.
 */
export function generateEmbedCode(options: EmbedOptions): string {
  const { baseUrl, projectId, width = 1920, height = 1080 } = options;
  const src = projectId ? `${baseUrl}/preview/${projectId}` : `${baseUrl}/preview`;
  return `<iframe src="${src}" width="${width}" height="${height}" frameborder="0" style="border:none;" allowfullscreen></iframe>`;
}

/**
 * Generate a direct share link.
 */
export function generateShareLink(baseUrl: string, projectId?: string): string {
  return projectId ? `${baseUrl}/preview/${projectId}` : `${baseUrl}/preview`;
}
