import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id] — get project with components + dataSources
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      components: { orderBy: { zIndex: 'asc' } },
      dataSources: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

// PUT /api/projects/[id] — update project
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const { name, description, canvasWidth, canvasHeight, background, status, thumbnail, components, dataSources } = body;

  // Update project metadata
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(canvasWidth !== undefined && { canvasWidth }),
      ...(canvasHeight !== undefined && { canvasHeight }),
      ...(background !== undefined && { background }),
      ...(status !== undefined && { status }),
      ...(thumbnail !== undefined && { thumbnail }),
    },
  });

  // If components are provided, replace all
  if (Array.isArray(components)) {
    await prisma.component.deleteMany({ where: { projectId: id } });
    if (components.length > 0) {
      await prisma.component.createMany({
        data: components.map((c: Record<string, unknown>, idx: number) => ({
          id: c.id as string,
          type: c.type as string,
          name: (c.name as string) || null,
          x: c.x as number,
          y: c.y as number,
          width: c.width as number,
          height: c.height as number,
          rotation: (c.rotation as number) || 0,
          zIndex: idx,
          locked: (c.locked as boolean) || false,
          visible: c.visible !== false,
          opacity: (c.opacity as number) ?? 1,
          groupId: (c.groupId as string) || null,
          props: (c.props as object) || {},
          dataSourceId: (c.dataSourceId as string) || null,
          dataMapping: (c.dataMapping as object) || null,
          projectId: id,
        })),
      });
    }
  }

  // If dataSources are provided, replace all
  if (Array.isArray(dataSources)) {
    await prisma.dataSource.deleteMany({ where: { projectId: id } });
    if (dataSources.length > 0) {
      await prisma.dataSource.createMany({
        data: dataSources.map((ds: Record<string, unknown>) => ({
          id: ds.id as string,
          name: ds.name as string,
          type: ds.type as string,
          config: (ds.config as object) || {},
          transform: (ds.transform as string) || null,
          projectId: id,
        })),
      });
    }
  }

  return NextResponse.json(project);
}

// DELETE /api/projects/[id] — soft delete (set status to archived)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const project = await prisma.project.update({
    where: { id },
    data: { status: 'archived' },
  });

  return NextResponse.json({ success: true, id: project.id });
}
