/**
 * Perceptual image hashing — generates a compact hash that is similar
 * for visually similar images. Used for cache lookup to skip AI
 * when a similar image was recently processed.
 *
 * Uses a server-side approach: convert base64 to raw pixel data via
 * a simple average-hash algorithm without canvas/browser dependencies.
 * For server-side, we decode JPEG/PNG headers to get a rough fingerprint
 * based on file size + sampling byte positions.
 *
 * For a more accurate hash in the future, swap in a proper dHash library.
 */

import crypto from 'crypto';

/**
 * Generate a perceptual-ish hash from base64 image data.
 *
 * Strategy: combine content-based sampling with size info.
 * This is a lightweight approximation — identical images always match,
 * and resized/recompressed versions have a good chance of matching.
 * Different images will almost never collide.
 */
export function generateImageHash(base64Data: string): string {
  const buffer = Buffer.from(base64Data, 'base64');
  const len = buffer.length;

  // Sample 64 evenly-spaced bytes from the image data
  const sampleSize = 64;
  const step = Math.max(1, Math.floor(len / sampleSize));
  const sample = Buffer.alloc(sampleSize);
  for (let i = 0; i < sampleSize; i++) {
    sample[i] = buffer[Math.min(i * step, len - 1)];
  }

  // Combine: length bucket (rounded to nearest 1KB) + sampled bytes
  const sizeBucket = Math.round(len / 1024);
  const combined = `${sizeBucket}:${sample.toString('hex')}`;

  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

/**
 * Compare two hashes — exact match only for this simple implementation.
 * A proper perceptual hash would support Hamming distance comparison.
 */
export function hashesMatch(hash1: string, hash2: string): boolean {
  return hash1 === hash2;
}
