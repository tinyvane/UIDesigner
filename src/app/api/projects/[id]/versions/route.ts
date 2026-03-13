import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/versions — list versions
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const versions = await prisma.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      version: true,
      message: true,
      createdAt: true,
    },
  });

  return NextResponse.json(versions);
}

// POST /api/projects/[id]/versions — create a version snapshot
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { message } = body;

  // Get current project state
  const project = await prisma.project.findUnique({
    where: { id },
    include: { components: true, dataSources: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Determine next version number
  const lastVersion = await prisma.projectVersion.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;

  // Create snapshot
  const snapshot = {
    canvas: {
      width: project.canvasWidth,
      height: project.canvasHeight,
      background: project.background,
    },
    components: project.components.map((c) => ({
      id: c.id,
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
      props: c.props,
      dataSourceId: c.dataSourceId,
      dataMapping: c.dataMapping,
    })),
    dataSources: project.dataSources.map((ds) => ({
      id: ds.id,
      name: ds.name,
      type: ds.type,
      config: ds.config,
      transform: ds.transform,
    })),
  };

  const version = await prisma.projectVersion.create({
    data: {
      version: nextVersion,
      snapshot,
      message: message || `Version ${nextVersion}`,
      projectId: id,
    },
  });

  return NextResponse.json(version, { status: 201 });
}
