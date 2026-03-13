'use client';

import { useCallback } from 'react';
import type { Locale } from './request';

/**
 * Hook to switch locale by setting a cookie and reloading.
 */
export function useLocaleSwitcher() {
  const switchLocale = useCallback((locale: Locale) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
    window.location.reload();
  }, []);

  return { switchLocale };
}
