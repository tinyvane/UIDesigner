import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

// Next.js 16 requires a default export or named "middleware" export
export default auth;

export const config = {
  // Protect these routes — redirect to sign-in if unauthenticated
  // IMPORTANT: /api/auth/* must NOT be included (NextAuth needs unauthenticated access)
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/api/projects/:path*',
    '/api/datasource/:path*',
    '/api/ai/:path*',
    '/api/export/:path*',
  ],
};
