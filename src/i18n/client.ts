'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from './request';

/**
 * Hook to switch locale by setting a cookie and hard-reloading.
 * Uses window.location.href to bypass Next.js Router Cache,
 * ensuring the server re-reads the locale cookie on next request.
 */
export function useLocaleSwitcher() {
  const router = useRouter();

  const switchLocale = useCallback((locale: Locale) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
    // Force full navigation (not soft reload) to clear Router Cache
    router.refresh();
    window.location.href = window.location.href;
  }, [router]);

  return { switchLocale };
}
