import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing routes
vi.mock('@/lib/prisma', () => {
  const mockTemplate = {
    id: 'tpl1',
    name: 'Test Template',
    category: 'Data Monitoring',
    tags: ['dark', 'charts'],
    thumbnail: 'https://example.com/thumb.png',
    preview: null,
    config: { canvas: { width: 1920, height: 1080, background: { type: 'color', value: '#000' } }, components: [] },
    isPublic: true,
    usageCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    prisma: {
      template: {
        findMany: vi.fn().mockResolvedValue([mockTemplate]),
        findUnique: vi.fn().mockResolvedValue(mockTemplate),
        create: vi.fn().mockResolvedValue(mockTemplate),
        update: vi.fn().mockResolvedValue({ ...mockTemplate, usageCount: 6 }),
        delete: vi.fn().mockResolvedValue(mockTemplate),
        count: vi.fn().mockResolvedValue(1),
      },
    },
  };
});

import { GET as listTemplates, POST as createTemplate } from '@/app/api/templates/route';
import { GET as getTemplate, DELETE as deleteTemplate } from '@/app/api/templates/[id]/route';
import { NextRequest } from 'next/server';

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url), options);
}

describe('Template API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/templates should return template list', async () => {
    const req = makeRequest('http://localhost/api/templates');
    const res = await listTemplates(req);
    const data = await res.json();
    expect(data.templates).toHaveLength(1);
    expect(data.total).toBe(1);
    expect(data.templates[0].name).toBe('Test Template');
  });

  it('GET /api/templates with category filter', async () => {
    const req = makeRequest('http://localhost/api/templates?category=Sales');
    const res = await listTemplates(req);
    expect(res.status).toBe(200);
  });

  it('GET /api/templates with search', async () => {
    const req = makeRequest('http://localhost/api/templates?search=monitor');
    const res = await listTemplates(req);
    expect(res.status).toBe(200);
  });

  it('POST /api/templates should create a template', async () => {
    const req = makeRequest('http://localhost/api/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Template',
        category: 'IoT',
        tags: ['realtime'],
        config: { canvas: { width: 1920, height: 1080 }, components: [] },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createTemplate(req);
    expect(res.status).toBe(201);
  });

  it('POST /api/templates should require name, category, config', async () => {
    const req = makeRequest('http://localhost/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name: 'No Config' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createTemplate(req);
    expect(res.status).toBe(400);
  });

  it('GET /api/templates/[id] should return template detail', async () => {
    const params = Promise.resolve({ id: 'tpl1' });
    const req = makeRequest('http://localhost/api/templates/tpl1');
    const res = await getTemplate(req, { params });
    const data = await res.json();
    expect(data.id).toBe('tpl1');
    expect(data.config).toBeDefined();
  });

  it('DELETE /api/templates/[id] should delete template', async () => {
    const params = Promise.resolve({ id: 'tpl1' });
    const req = makeRequest('http://localhost/api/templates/tpl1');
    const res = await deleteTemplate(req, { params });
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
