import type { Language, TranslationDictionary } from './types';
import { enDictionary } from './dictionaries/en';
import { hiDictionary } from './dictionaries/hi';

const dictionaries: Record<Language, TranslationDictionary> = {
  en: enDictionary,
  hi: hiDictionary,
};

export function resolvePath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string' || !path.trim()) {
    return undefined;
  }
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
 * Derives a safe localized fallback when a translation key cannot be resolved or is invalid.
 * Strictly prevents internal translation keys (e.g. 'errors.generic', 'officer.verification.failedTitle')
 * from reaching the UI and never humanizes internal identifier names.
 */
export function formatSafeFallback(key: unknown, language: Language): string {
  const isHi = language === 'hi';
  const strKey = typeof key === 'string' ? key.trim().toLowerCase() : '';

  if (strKey.startsWith('errors.') || strKey.includes('error')) {
    return isHi
      ? (hiDictionary.errors?.generic || 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।')
      : (enDictionary.errors?.generic || 'An unexpected error occurred. Please try again.');
  }

  return isHi ? 'उपलब्ध नहीं' : 'Not available';
}

/**
 * Pure translation function supporting bilingual English and Hindi lookup,
 * category label resolution, array suppression, and safe generic fallback.
 */
export function translate(
  language: Language,
  key: unknown,
  params?: Record<string, string | number>
): string {
  if (typeof key !== 'string' || !key.trim()) {
    return formatSafeFallback(key, language);
  }

  const dict = dictionaries[language] as unknown as Record<string, unknown>;
  const fallbackDict = dictionaries.en as unknown as Record<string, unknown>;

  let val = resolvePath(dict, key);

  // If val is a category/status object with a string .label, extract that label
  if (val && typeof val === 'object' && !Array.isArray(val) && 'label' in (val as Record<string, unknown>)) {
    const label = (val as Record<string, unknown>).label;
    if (typeof label === 'string' && label.trim().length > 0) {
      val = label;
    } else {
      val = undefined;
    }
  }

  // If val is not a string, check fallback dictionary (English)
  if (typeof val !== 'string' || val.trim().length === 0) {
    val = resolvePath(fallbackDict, key);
    if (val && typeof val === 'object' && !Array.isArray(val) && 'label' in (val as Record<string, unknown>)) {
      const label = (val as Record<string, unknown>).label;
      if (typeof label === 'string' && label.trim().length > 0) {
        val = label;
      } else {
        val = undefined;
      }
    }
  }

  // If val is still not a valid string (missing, array, object without label, null, etc.)
  if (typeof val !== 'string' || val.trim().length === 0) {
    return formatSafeFallback(key, language);
  }

  // Parameter interpolation
  if (params && typeof params === 'object') {
    let str = val;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return str;
  }

  return val;
}

/**
 * Pure array translation function returning string arrays (e.g. suggested questions).
 * Returns empty array for missing or invalid values, never returning strings or objects.
 */
export function translateArray(language: Language, key: unknown): string[] {
  if (typeof key !== 'string' || !key.trim()) {
    return [];
  }

  const dict = dictionaries[language] as unknown as Record<string, unknown>;
  const fallbackDict = dictionaries.en as unknown as Record<string, unknown>;

  let val = resolvePath(dict, key);
  if (!Array.isArray(val)) {
    val = resolvePath(fallbackDict, key);
  }

  if (!Array.isArray(val)) {
    return [];
  }

  return val.filter((item): item is string => typeof item === 'string');
}

