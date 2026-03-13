/**
 * AIRecognitionLog — persists every AI recognition request to the database.
 * Used for debugging, analytics, and perceptual-hash cache lookups.
 */

import { prisma } from '@/lib/prisma';
import type { AIRecognitionResult } from './provider';

export interface RecognitionLogEntry {
  imageUrl: string;          // original image URL or data-url prefix
  imageHash: string;         // perceptual hash for cache lookup
  prompt: string;            // prompt version (e.g. "v1")
  rawOutput: unknown;        // raw AI response (components + metadata)
  parsed?: unknown;          // post-processed components (after postProcess)
  model: string;             // model identifier (e.g. "claude-sonnet-4-20250514")
  tokenUsage?: { input_tokens: number; output_tokens: number } | null;
  latencyMs: number;
  success: boolean;
  errorMsg?: string | null;
}

/**
 * Save a recognition log entry to the database.
 * Fire-and-forget — errors are logged but never thrown to avoid disrupting the main flow.
 */
export async function saveRecognitionLog(entry: RecognitionLogEntry): Promise<string | null> {
  try {
    const record = await prisma.aIRecognitionLog.create({
      data: {
        imageUrl: entry.imageUrl,
        imageHash: entry.imageHash,
        prompt: entry.prompt,
        rawOutput: entry.rawOutput as object,
        parsed: entry.parsed as object ?? undefined,
        model: entry.model,
        tokenUsage: entry.tokenUsage as object ?? undefined,
        latencyMs: entry.latencyMs,
        success: entry.success,
        errorMsg: entry.errorMsg ?? null,
      },
    });
    return record.id;
  } catch (err) {
    console.error('[AIRecognitionLog] Failed to save:', err);
    return null;
  }
}

/**
 * Look up a cached recognition result by perceptual image hash.
 * Returns the most recent successful entry for the given hash, or null.
 */
export async function findByImageHash(imageHash: string): Promise<AIRecognitionResult | null> {
  try {
    const cached = await prisma.aIRecognitionLog.findFirst({
      where: {
        imageHash,
        success: true,
        parsed: { not: undefined },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!cached || !cached.parsed) return null;

    const parsed = cached.parsed as { components?: unknown[]; background?: unknown; layoutDescription?: string };
    if (!parsed.components || !Array.isArray(parsed.components)) return null;

    return {
      components: parsed.components as AIRecognitionResult['components'],
      background: parsed.background as AIRecognitionResult['background'],
      layoutDescription: parsed.layoutDescription,
      tokenUsage: cached.tokenUsage as AIRecognitionResult['tokenUsage'] ?? undefined,
      latencyMs: cached.latencyMs,
    };
  } catch (err) {
    console.error('[AIRecognitionLog] Cache lookup failed:', err);
    return null;
  }
}
