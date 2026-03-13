import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

// Use the Edge-safe auth config (no Prisma, no Node.js modules)
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect these routes — redirect to sign-in if unauthenticated
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/api/projects/:path*',
    '/api/datasource/:path*',
    '/api/ai/:path*',
    '/api/export/:path*',
  ],
};
