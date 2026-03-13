import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/templates — list templates with optional category filter + search + pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublic: true };
    if (category) where.category = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          category: true,
          tags: true,
          thumbnail: true,
          preview: true,
          isPublic: true,
          usageCount: true,
          createdAt: true,
        },
      }),
      prisma.template.count({ where }),
    ]);

    return NextResponse.json({ templates, total, page, limit });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list templates';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/templates — publish a project as a template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, tags = [], thumbnail, preview, config, isPublic = true } = body;

    if (!name || !category || !config) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, config' },
        { status: 400 },
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        category,
        tags,
        thumbnail: thumbnail ?? '',
        preview,
        config,
        isPublic,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create template';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
