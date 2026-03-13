import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => {
  const mockLog = {
    id: 'log1',
    imageUrl: 'data:image/png;base64,abc...',
    imageHash: 'abcdef1234567890',
    prompt: 'v1',
    rawOutput: { components: [{ type: 'chart_bar', x: 0, y: 0, width: 400, height: 300, props: {} }] },
    parsed: {
      components: [{ type: 'chart_bar', x: 0, y: 0, width: 400, height: 300, props: {} }],
      background: { type: 'color', value: '#1a1a2e' },
      layoutDescription: 'A dashboard with a bar chart',
    },
    model: 'claude-sonnet-4-20250514',
    tokenUsage: { input_tokens: 1000, output_tokens: 500 },
    latencyMs: 3200,
    success: true,
    errorMsg: null,
    createdAt: new Date(),
  };

  return {
    prisma: {
      aIRecognitionLog: {
        create: vi.fn().mockResolvedValue(mockLog),
        findFirst: vi.fn().mockResolvedValue(mockLog),
      },
    },
  };
});

import { saveRecognitionLog, findByImageHash } from '@/lib/ai/recognitionLog';
import { prisma } from '@/lib/prisma';

describe('AIRecognitionLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveRecognitionLog', () => {
    it('should save a successful recognition log', async () => {
      const id = await saveRecognitionLog({
        imageUrl: 'data:image/png;base64,abc...',
        imageHash: 'abcdef1234567890',
        prompt: 'v1',
        rawOutput: { components: [] },
        parsed: { components: [] },
        model: 'claude-sonnet-4-20250514',
        tokenUsage: { input_tokens: 1000, output_tokens: 500 },
        latencyMs: 3200,
        success: true,
      });

      expect(id).toBe('log1');
      expect(prisma.aIRecognitionLog.create).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.aIRecognitionLog.create).mock.calls[0][0];
      expect(call.data.success).toBe(true);
      expect(call.data.imageHash).toBe('abcdef1234567890');
    });

    it('should save a failed recognition log with error message', async () => {
      const id = await saveRecognitionLog({
        imageUrl: 'data:image/png;base64,xyz...',
        imageHash: '1234567890abcdef',
        prompt: 'v1',
        rawOutput: {},
        model: 'claude-sonnet-4-20250514',
        latencyMs: 0,
        success: false,
        errorMsg: 'API timeout',
      });

      expect(id).toBe('log1');
      const call = vi.mocked(prisma.aIRecognitionLog.create).mock.calls[0][0];
      expect(call.data.success).toBe(false);
      expect(call.data.errorMsg).toBe('API timeout');
    });

    it('should return null and not throw if DB write fails', async () => {
      vi.mocked(prisma.aIRecognitionLog.create).mockRejectedValueOnce(new Error('DB connection failed'));

      const id = await saveRecognitionLog({
        imageUrl: 'data:image/png;base64,fail...',
        imageHash: 'failhash12345678',
        prompt: 'v1',
        rawOutput: {},
        model: 'claude',
        latencyMs: 0,
        success: false,
      });

      expect(id).toBeNull();
    });
  });

  describe('findByImageHash', () => {
    it('should return cached result when hash matches', async () => {
      const result = await findByImageHash('abcdef1234567890');

      expect(result).not.toBeNull();
      expect(result!.components).toHaveLength(1);
      expect(result!.components[0].type).toBe('chart_bar');
      expect(result!.background).toEqual({ type: 'color', value: '#1a1a2e' });
      expect(result!.layoutDescription).toBe('A dashboard with a bar chart');
    });

    it('should return null when no cache entry exists', async () => {
      vi.mocked(prisma.aIRecognitionLog.findFirst).mockResolvedValueOnce(null);

      const result = await findByImageHash('nonexistenthash1');
      expect(result).toBeNull();
    });

    it('should return null when cached entry has no parsed data', async () => {
      vi.mocked(prisma.aIRecognitionLog.findFirst).mockResolvedValueOnce({
        id: 'log2',
        imageUrl: 'x',
        imageHash: 'x',
        prompt: 'v1',
        rawOutput: {},
        parsed: null,
        model: 'claude',
        tokenUsage: null,
        latencyMs: 1000,
        success: true,
        errorMsg: null,
        createdAt: new Date(),
      });

      const result = await findByImageHash('somehash12345678');
      expect(result).toBeNull();
    });

    it('should return null and not throw if DB query fails', async () => {
      vi.mocked(prisma.aIRecognitionLog.findFirst).mockRejectedValueOnce(new Error('DB error'));

      const result = await findByImageHash('errorhash1234567');
      expect(result).toBeNull();
    });
  });
});
