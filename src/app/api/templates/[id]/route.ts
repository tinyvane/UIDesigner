import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/templates/[id] — get template detail with full config
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Increment usage count
    await prisma.template.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json(template);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id] — delete a template
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
