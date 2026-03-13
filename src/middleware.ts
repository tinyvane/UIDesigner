export { auth as middleware } from '@/lib/auth';

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
