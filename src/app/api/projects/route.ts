import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects — list projects
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || undefined;
  const sort = searchParams.get('sort') || 'updatedAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));

  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(status ? { status } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        canvasWidth: true,
        canvasHeight: true,
        thumbnail: true,
        status: true,
        isTemplate: true,
        updatedAt: true,
        createdAt: true,
        ownerId: true,
        _count: { select: { components: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({ projects, total, page, limit });
}

// POST /api/projects — create project
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, canvasWidth, canvasHeight, ownerId } = body;

  if (!name || !ownerId) {
    return NextResponse.json({ error: 'name and ownerId are required' }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      canvasWidth: canvasWidth || 1920,
      canvasHeight: canvasHeight || 1080,
      background: { type: 'color', value: '#0d1117' },
      ownerId,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
