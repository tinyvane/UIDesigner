/**
 * Full auth setup — Node.js runtime only.
 * Extends authConfig with PrismaAdapter and Credentials authorize().
 * NOT imported by middleware (which uses auth.config.ts instead).
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    // Re-use OAuth providers from config (GitHub, Google)
    ...authConfig.providers.filter(
      (p) => 'type' in p && p.type !== 'credentials',
    ),
    // Full Credentials provider with Prisma-backed authorize()
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email as string;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: { email, name: email.split('@')[0] },
          });
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
