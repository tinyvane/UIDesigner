/**
 * Auth configuration shared between middleware (Edge) and server (Node.js).
 * This file must NOT import Prisma or any Node.js-only modules,
 * because it's used by middleware which runs in the Edge runtime.
 */
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Credentials provider needs authorize() which uses Prisma,
    // so we define a minimal version here for the Edge middleware.
    // The full authorize() is in auth.ts (Node.js only).
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const { pathname } = request.nextUrl;

      const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/editor') ||
        pathname.startsWith('/api/projects') ||
        pathname.startsWith('/api/datasource') ||
        pathname.startsWith('/api/ai') ||
        pathname.startsWith('/api/export');

      if (isProtected && !isLoggedIn) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
