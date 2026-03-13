import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/datasource?projectId=xxx — list data sources for a project
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const dataSources = await prisma.dataSource.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(dataSources);
}

// POST /api/datasource — create a data source
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, type, config, transform, projectId } = body;

  if (!name || !type || !projectId) {
    return NextResponse.json({ error: 'name, type, and projectId are required' }, { status: 400 });
  }

  const ds = await prisma.dataSource.create({
    data: {
      name,
      type,
      config: config || {},
      transform: transform || null,
      projectId,
    },
  });

  return NextResponse.json(ds, { status: 201 });
}
