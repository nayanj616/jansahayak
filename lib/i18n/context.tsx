'use client';

import * as React from 'react';
import type { Language, TranslationDictionary } from './types';
import { enDictionary } from './dictionaries/en';
import { hiDictionary } from './dictionaries/hi';

const STORAGE_KEY = 'jansahayak_language';
const EXPLICIT_KEY = 'jansahayak_explicit_choice';
const COOKIE_NAME = 'jansahayak_lang';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
  fallbackText: (hindiText?: string | null, englishText?: string | null) => string;
  isReady: boolean;
}

const dictionaries: Record<Language, TranslationDictionary> = {
  en: enDictionary,
  hi: hiDictionary,
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = obj;
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Derives a safe human-readable fallback when a translation key cannot be resolved.
 * Strictly prevents internal translation keys (e.g. 'errors.generic') from reaching the UI.
 */
function formatSafeFallback(key: string, language: Language): string {
  if (key.startsWith('errors.')) {
    return language === 'hi'
      ? 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।'
      : 'An unexpected error occurred. Please try again.';
  }

  if (key.startsWith('complaints.statuses.') || key.startsWith('assignments.statuses.')) {
    const rawStatus = key.split('.').pop() || '';
    const formatted = rawStatus.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  if (key.startsWith('complaints.priorities.')) {
    const rawPriority = key.split('.').pop() || '';
    return rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1);
  }

  if (!key.includes('.')) {
    return key;
  }

  const lastSegment = key.split('.').pop() || '';
  const humanized = lastSegment.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
    window.addEventListener('popstate', listener);
  }
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
      window.removeEventListener('popstate', listener);
    }
  };
}

function getSnapshot(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const urlParam = new URLSearchParams(window.location.search).get('lang');
    if (urlParam === 'hi' || urlParam === 'en') return urlParam;

    const isExplicit = localStorage.getItem(EXPLICIT_KEY) === 'true';
    const stored = localStorage.getItem(STORAGE_KEY);
    const cookieMatch = document.cookie.match(/(?:^|; )jansahayak_lang=([^;]+)/);
    const savedLang =
      stored === 'hi' || stored === 'en'
        ? (stored as Language)
        : cookieMatch && (cookieMatch[1] === 'hi' || cookieMatch[1] === 'en')
          ? (cookieMatch[1] as Language)
          : null;

    if (isExplicit && savedLang) {
      return savedLang;
    }

    // Role default based on route if no explicit user choice has been made
    const pathname = window.location.pathname || '';
    if (pathname.startsWith('/worker')) {
      return 'hi';
    }

    if (savedLang) {
      return savedLang;
    }
  } catch {
    // Fall back to default
  }
  return 'en';
}

function getServerSnapshot(): Language {
  return 'en';
}

export function LanguageProvider({
  children,
  defaultLanguage,
}: {
  children?: React.ReactNode;
  defaultLanguage?: Language;
}) {
  const storeLang = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [overrideLang, setOverrideLang] = React.useState<Language | null>(null);

  const language: Language = React.useMemo(() => {
    if (overrideLang) return overrideLang;
    if (defaultLanguage) {
      if (typeof window !== 'undefined') {
        const isExplicit = localStorage.getItem(EXPLICIT_KEY) === 'true';
        if (!isExplicit) return defaultLanguage;
      } else {
        return defaultLanguage;
      }
    }
    return storeLang;
  }, [overrideLang, defaultLanguage, storeLang]);

  // Dynamically synchronize document element lang attribute
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = React.useCallback((newLang: Language) => {
    try {
      localStorage.setItem(EXPLICIT_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
    setOverrideLang(newLang);
    emitChange();
  }, []);

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[language] as unknown as Record<string, unknown>;
      const fallbackDict = dictionaries.en as unknown as Record<string, unknown>;

      let val = resolvePath(dict, key);

      // Handle category/label objects gracefully
      if (val && typeof val === 'object' && 'label' in (val as Record<string, unknown>)) {
        val = (val as Record<string, unknown>).label;
      }

      if (typeof val !== 'string') {
        val = resolvePath(fallbackDict, key);
        if (val && typeof val === 'object' && 'label' in (val as Record<string, unknown>)) {
          val = (val as Record<string, unknown>).label;
        }
      }

      if (typeof val !== 'string') {
        return formatSafeFallback(key, language);
      }

      if (params) {
        let str = val;
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
        return str;
      }

      return val;
    },
    [language]
  );

  const tArray = React.useCallback(
    (key: string): string[] => {
      const dict = dictionaries[language] as unknown as Record<string, unknown>;
      const fallbackDict = dictionaries.en as unknown as Record<string, unknown>;

      let val = resolvePath(dict, key);
      if (!Array.isArray(val)) {
        val = resolvePath(fallbackDict, key);
      }

      return Array.isArray(val) ? (val as string[]) : [];
    },
    [language]
  );

  /**
   * Content fallback decision implementation:
   * If Hindi is selected and a content field has no Hindi translation,
   * display the English text accompanied by the clear Hindi fallback indicator.
   * Never silently present English content as a genuine Hindi translation.
   */
  const fallbackText = React.useCallback(
    (hindiText?: string | null, englishText?: string | null): string => {
      const en = englishText ? englishText.trim() : '';
      const hi = hindiText ? hindiText.trim() : '';

      if (language === 'hi') {
        if (hi.length > 0) {
          return hi;
        }
        if (en.length > 0) {
          return `${en} (उपलब्ध हिन्दी अनुवाद नहीं है)`;
        }
        return '(उपलब्ध हिन्दी अनुवाद नहीं है)';
      }

      return en;
    },
    [language]
  );

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tArray,
      fallbackText,
      isReady: true,
    }),
    [language, setLanguage, t, tArray, fallbackText]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = React.useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for isolated component testing or rendering outside LanguageProvider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        let val = resolvePath(dictionaries.en as unknown as Record<string, unknown>, key);
        if (val && typeof val === 'object' && 'label' in (val as Record<string, unknown>)) {
          val = (val as Record<string, unknown>).label;
        }
        if (typeof val !== 'string') return formatSafeFallback(key, 'en');
        if (params) {
          let str = val;
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
          }
          return str;
        }
        return val;
      },
      tArray: (key: string) => {
        const val = resolvePath(dictionaries.en as unknown as Record<string, unknown>, key);
        return Array.isArray(val) ? (val as string[]) : [];
      },
      fallbackText: (hindiText?: string | null, englishText?: string | null) => englishText || '',
      isReady: true,
    };
  }
  return context;
}
