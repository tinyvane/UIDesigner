import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'user1', email: 'new@example.com', name: 'new' }),
    },
  },
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

function makeRequest(body: object) {
  return new NextRequest(new URL('http://localhost/api/auth/register'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new user', async () => {
    const req = makeRequest({ email: 'new@example.com', name: 'New User' });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe('new@example.com');
    expect(prisma.user.create).toHaveBeenCalledOnce();
  });

  it('should return 400 when email is missing', async () => {
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 409 when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'existing',
      email: 'existing@example.com',
      name: 'Existing',
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const req = makeRequest({ email: 'existing@example.com' });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('should use email prefix as default name', async () => {
    const req = makeRequest({ email: 'hello@example.com' });
    await POST(req);
    const call = vi.mocked(prisma.user.create).mock.calls[0][0];
    expect(call.data.name).toBe('hello');
  });
});
