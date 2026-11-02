'use client';

import * as React from 'react';
import type { Language, TranslationDictionary } from './types';
import { enDictionary } from './dictionaries/en';
import { hiDictionary } from './dictionaries/hi';

const STORAGE_KEY = 'jansahayak_language';
const EXPLICIT_KEY = 'jansahayak_explicit_choice';
const COOKIE_NAME = 'jansahayak_lang';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
      if (typeof val !== 'string') {
        val = resolvePath(fallbackDict, key);
      }

      if (typeof val !== 'string') {
        return key;
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
      fallbackText,
      isReady: true,
    }),
    [language, setLanguage, t, fallbackText]
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
        const val = resolvePath(dictionaries.en as unknown as Record<string, unknown>, key);
        if (typeof val !== 'string') return key;
        if (params) {
          let str = val;
          for (const [k, v] of Object.entries(params)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
          }
          return str;
        }
        return val;
      },
      fallbackText: (hindiText?: string | null, englishText?: string | null) => englishText || '',
      isReady: true,
    };
  }
  return context;
}
