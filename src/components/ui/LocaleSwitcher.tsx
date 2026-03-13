'use client';

import { useLocale } from 'next-intl';
import { useLocaleSwitcher } from '@/i18n/client';
import type { Locale } from '@/i18n/request';

const LOCALE_LABELS: Record<string, string> = {
  en: 'EN',
  zh: '中',
};

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const { switchLocale } = useLocaleSwitcher();

  const nextLocale: Locale = currentLocale === 'zh' ? 'en' : 'zh';

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
      title={`Switch to ${nextLocale === 'zh' ? '中文' : 'English'}`}
    >
      {LOCALE_LABELS[currentLocale]} → {LOCALE_LABELS[nextLocale]}
    </button>
  );
}
