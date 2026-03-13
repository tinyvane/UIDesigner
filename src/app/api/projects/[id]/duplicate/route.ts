import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/duplicate — deep copy project
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const original = await prisma.project.findUnique({
    where: { id },
    include: { components: true, dataSources: true },
  });

  if (!original) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Create new project with copied data
  const newProject = await prisma.project.create({
    data: {
      name: `${original.name} (copy)`,
      description: original.description,
      canvasWidth: original.canvasWidth,
      canvasHeight: original.canvasHeight,
      background: original.background ?? undefined,
      globalStyles: original.globalStyles ?? undefined,
      ownerId: original.ownerId,
      components: {
        createMany: {
          data: original.components.map((c) => ({
            type: c.type,
            name: c.name,
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height,
            rotation: c.rotation,
            zIndex: c.zIndex,
            locked: c.locked,
            visible: c.visible,
            opacity: c.opacity,
            groupId: c.groupId,
            props: c.props ?? {},
            dataSourceId: null, // Don't copy bindings — IDs won't match
            dataMapping: null,
          })),
        },
      },
      dataSources: {
        createMany: {
          data: original.dataSources.map((ds) => ({
            name: ds.name,
            type: ds.type,
            config: ds.config ?? {},
            transform: ds.transform,
          })),
        },
      },
    },
    include: { components: true, dataSources: true },
  });

  return NextResponse.json(newProject, { status: 201 });
}
