import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/datasource/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ds = await prisma.dataSource.findUnique({ where: { id } });
  if (!ds) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ds);
}

// PUT /api/datasource/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { name, type, config, transform } = body;

  const ds = await prisma.dataSource.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(config !== undefined && { config }),
      ...(transform !== undefined && { transform }),
    },
  });

  return NextResponse.json(ds);
}

// DELETE /api/datasource/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.dataSource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
