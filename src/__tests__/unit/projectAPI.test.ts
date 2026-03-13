import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth before importing routes
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user1', email: 'test@example.com' } }),
}));

// Mock prisma before importing routes
vi.mock('@/lib/prisma', () => {
  const mockProject = {
    id: 'proj1',
    name: 'Test Project',
    description: null,
    canvasWidth: 1920,
    canvasHeight: 1080,
    background: { type: 'color', value: '#000' },
    globalStyles: null,
    ownerId: 'user1',
    thumbnail: null,
    isTemplate: false,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    components: [],
    dataSources: [],
  };

  return {
    prisma: {
      project: {
        findMany: vi.fn().mockResolvedValue([mockProject]),
        findUnique: vi.fn().mockResolvedValue(mockProject),
        create: vi.fn().mockResolvedValue(mockProject),
        update: vi.fn().mockResolvedValue(mockProject),
        count: vi.fn().mockResolvedValue(1),
      },
      component: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      dataSource: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'ds1', name: 'Test DS' }),
        update: vi.fn().mockResolvedValue({ id: 'ds1', name: 'Updated DS' }),
        delete: vi.fn().mockResolvedValue({ id: 'ds1' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      projectVersion: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'v1', version: 1 }),
      },
    },
  };
});

import { GET as listProjects, POST as createProject } from '@/app/api/projects/route';
import { GET as getProject, PUT as updateProject, DELETE as deleteProject } from '@/app/api/projects/[id]/route';
import { GET as listVersions, POST as createVersion } from '@/app/api/projects/[id]/versions/route';
import { GET as listDataSources, POST as createDataSource } from '@/app/api/datasource/route';

import { NextRequest } from 'next/server';

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url), options);
}

describe('Project API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/projects should return list', async () => {
    const req = makeRequest('http://localhost/api/projects');
    const res = await listProjects(req);
    const data = await res.json();
    expect(data.projects).toHaveLength(1);
    expect(data.total).toBe(1);
  });

  it('POST /api/projects should create project', async () => {
    const req = makeRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project', ownerId: 'user1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createProject(req);
    expect(res.status).toBe(201);
  });

  it('POST /api/projects should require name', async () => {
    const req = makeRequest('http://localhost/api/projects', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createProject(req);
    expect(res.status).toBe(400);
  });

  it('GET /api/projects/[id] should return project with components', async () => {
    const params = Promise.resolve({ id: 'proj1' });
    const req = makeRequest('http://localhost/api/projects/proj1');
    const res = await getProject(req, { params });
    const data = await res.json();
    expect(data.id).toBe('proj1');
  });

  it('PUT /api/projects/[id] should update project', async () => {
    const params = Promise.resolve({ id: 'proj1' });
    const req = makeRequest('http://localhost/api/projects/proj1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await updateProject(req, { params });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/projects/[id] should soft delete', async () => {
    const params = Promise.resolve({ id: 'proj1' });
    const req = makeRequest('http://localhost/api/projects/proj1');
    const res = await deleteProject(req, { params });
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

describe('Version API', () => {
  it('GET /api/projects/[id]/versions should return list', async () => {
    const params = Promise.resolve({ id: 'proj1' });
    const req = makeRequest('http://localhost/api/projects/proj1/versions');
    const res = await listVersions(req, { params });
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/projects/[id]/versions should create snapshot', async () => {
    const params = Promise.resolve({ id: 'proj1' });
    const req = makeRequest('http://localhost/api/projects/proj1/versions', {
      method: 'POST',
      body: JSON.stringify({ message: 'Initial version' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createVersion(req, { params });
    expect(res.status).toBe(201);
  });
});

describe('DataSource API', () => {
  it('GET /api/datasource should require projectId', async () => {
    const req = makeRequest('http://localhost/api/datasource');
    const res = await listDataSources(req);
    expect(res.status).toBe(400);
  });

  it('GET /api/datasource?projectId=x should return list', async () => {
    const req = makeRequest('http://localhost/api/datasource?projectId=proj1');
    const res = await listDataSources(req);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/datasource should create data source', async () => {
    const req = makeRequest('http://localhost/api/datasource', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'static', config: {}, projectId: 'proj1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await createDataSource(req);
    expect(res.status).toBe(201);
  });
});
