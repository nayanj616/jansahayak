'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Users2, ArrowRight } from 'lucide-react';
import { GwaliorMonumentLogo } from '@/components/shared/gwalior-fort-art';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.swachhGwalior'), href: '/swachh-gwalior' },
    { label: t('nav.schemeExploration'), href: '/scheme-exploration' },
    { label: t('nav.about'), href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <NextLink href="/" className="flex items-center gap-2 sm:gap-3 group shrink min-w-0">
          <GwaliorMonumentLogo className="h-8 w-8 sm:h-9 sm:w-9 text-amber-700 transition-transform group-hover:scale-105 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-800 transition-colors truncate">
              JanSahayak
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-wide uppercase truncate">
              Gwalior, Madhya Pradesh
            </span>
          </div>
        </NextLink>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.href);

            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-700 relative py-1',
                  isActive
                    ? 'text-blue-700 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-700 after:rounded-full'
                    : 'text-slate-600'
                )}
              >
                {item.label}
              </NextLink>
            );
          })}
        </nav>

        {/* Right Actions: Language Switcher & Demo Role Selector */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <NextLink href="/demo-role">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-700 hover:bg-blue-800 text-white font-medium shadow-xs"
            >
              <Users2 className="h-4 w-4 mr-1" />
              {t('nav.demoRoles')}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </NextLink>
        </div>

        {/* Mobile menu button and switcher */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSwitcher showIcon={false} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 focus:outline-none shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-5 space-y-2 shadow-lg">
          {navLinks.map((item) => (
            <NextLink
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2 text-base font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {item.label}
            </NextLink>
          ))}
          <div className="pt-2 border-t border-slate-100">
            <NextLink
              href="/demo-role"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs"
            >
              <Users2 className="h-4 w-4" />
              {t('nav.selectDemoRole')}
            </NextLink>
          </div>
        </div>
      )}
    </header>
  );
}

