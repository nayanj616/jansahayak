'use client';

import * as React from 'react';
import {
  Search,
  Bot,
  FileQuestion,
  Building2,
  ShieldCheck,
  Info,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { SchemeFinder } from './scheme-finder';
import { CivicAssistant } from './civic-assistant';

export type SchemeTabId = 'finder' | 'assistant' | 'grievances' | 'services' | 'verification';

interface TabDefinition {
  id: SchemeTabId;
  labelKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  {
    id: 'finder',
    labelKey: 'schemeExploration.tabs.finder',
    descKey: 'schemeExploration.tabDescriptions.finder',
    icon: Search,
  },
  {
    id: 'assistant',
    labelKey: 'schemeExploration.tabs.assistant',
    descKey: 'schemeExploration.tabDescriptions.assistant',
    icon: Bot,
  },
  {
    id: 'grievances',
    labelKey: 'schemeExploration.tabs.grievances',
    descKey: 'schemeExploration.tabDescriptions.grievances',
    icon: FileQuestion,
  },
  {
    id: 'services',
    labelKey: 'schemeExploration.tabs.services',
    descKey: 'schemeExploration.tabDescriptions.services',
    icon: Building2,
  },
  {
    id: 'verification',
    labelKey: 'schemeExploration.tabs.verification',
    descKey: 'schemeExploration.tabDescriptions.verification',
    icon: ShieldCheck,
  },
];

export function SchemeSupportShell() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<SchemeTabId>('finder');

  // Sync initial tab with URL hash if present (e.g. #assistant from citizen dashboard)
  React.useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash.replace('#', '');
      if (TABS.some((tab) => tab.id === hash)) {
        setActiveTab(hash as SchemeTabId);
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  const handleTabChange = (tabId: SchemeTabId) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`);
    }
  };

  const activeTabDef = TABS.find((tab) => tab.id === activeTab) || TABS[0];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-full">
      {/* SECTION HEADER */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                {t('schemeExploration.sectionTitle')}
              </span>
              <span className="text-xs text-slate-400 font-mono">Gwalior & MP</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 break-words">
              {t('schemeExploration.pageTitle')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-600 max-w-3xl leading-relaxed break-words">
              {t('schemeExploration.sectionDescription')}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-slate-500 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 shrink-0 max-w-full">
            <span className="font-semibold text-slate-700 flex items-center gap-1 flex-wrap">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>{t('common.academicDemarcation')}</span>
            </span>
            <span className="text-[11px] sm:text-xs">Gwalior Municipal Demo Scope</span>
          </div>
        </div>

        {/* 5-TAB HORIZONTAL BAR (Responsive with keyboard navigation) */}
        <div className="mt-6 sm:mt-8 border-t border-slate-100 pt-5 sm:pt-6">
          <div
            role="tablist"
            aria-label="Scheme and Civic Support Sections"
            className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-slate-200 pb-2 sm:pb-3"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/30 shrink-0',
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors shrink-0',
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'
                    )}
                  />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="font-semibold text-slate-700 shrink-0">{t(activeTabDef.labelKey)}:</span>
            <span className="text-slate-600 break-words leading-relaxed">{t(activeTabDef.descKey)}</span>
          </div>
        </div>
      </div>

      {/* TAB CONTENT PANELS (Phase 1 Placeholders & Demarcations) */}
      <div className="relative max-w-full">
        {/* TAB 1: SCHEME FINDER */}
        {activeTab === 'finder' && (
          <div
            id="tabpanel-finder"
            role="tabpanel"
            aria-labelledby="tab-finder"
            className="space-y-6 animate-in fade-in-50 duration-200 max-w-full"
          >
            <SchemeFinder />
          </div>
        )}

        {/* TAB 2: CIVIC ASSISTANT */}
        {activeTab === 'assistant' && (
          <div
            id="tabpanel-assistant"
            role="tabpanel"
            aria-labelledby="tab-assistant"
            className="space-y-6 animate-in fade-in-50 duration-200 max-w-full"
          >
            <CivicAssistant />
          </div>
        )}

        {/* TAB 3: GRIEVANCES */}
        {activeTab === 'grievances' && (
          <div
            id="tabpanel-grievances"
            role="tabpanel"
            aria-labelledby="tab-grievances"
            className="space-y-6 animate-in fade-in-50 duration-200 max-w-full"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xs space-y-5 sm:space-y-6 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="warning" className="text-xs shrink-0">
                      {t('schemeExploration.placeholders.grievancesBadge')}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">Madhya Pradesh & GMC</span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
                    {t('schemeExploration.placeholders.grievancesTitle')}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl break-words leading-relaxed">
                    {t('schemeExploration.placeholders.grievancesDescription')}
                  </p>
                </div>
              </div>

              {/* Grievance Informational Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-2 shrink-0">
                      <FileQuestion className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.grievanceFeature1Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.grievanceFeature1Desc')}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-2 shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.grievanceFeature2Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.grievanceFeature2Desc')}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-2 shrink-0">
                      <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.grievanceFeature3Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.grievanceFeature3Desc')}
                  </CardContent>
                </Card>
              </div>

              {/* Swachh Gwalior Grievance Separation Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed break-words">
                  {t('schemeExploration.placeholders.grievanceSeparationNotice')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CIVIC SERVICES */}
        {activeTab === 'services' && (
          <div
            id="tabpanel-services"
            role="tabpanel"
            aria-labelledby="tab-services"
            className="space-y-6 animate-in fade-in-50 duration-200 max-w-full"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xs space-y-5 sm:space-y-6 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="warning" className="text-xs shrink-0">
                      {t('schemeExploration.placeholders.servicesBadge')}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">GMC e-NagarPalika</span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
                    {t('schemeExploration.placeholders.servicesTitle')}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl break-words leading-relaxed">
                    {t('schemeExploration.placeholders.servicesDescription')}
                  </p>
                </div>
              </div>

              {/* Civic Services Informational Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-2 shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.serviceFeature1Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.serviceFeature1Desc')}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-2 shrink-0">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.serviceFeature2Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.serviceFeature2Desc')}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2 shrink-0">
                      <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.serviceFeature3Title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.serviceFeature3Desc')}
                  </CardContent>
                </Card>
              </div>

              {/* Service Directory Integration Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 sm:p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-2.5 sm:gap-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed break-words">
                  {t('schemeExploration.placeholders.serviceIntegrationNotice')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VERIFICATION & SOURCES */}
        {activeTab === 'verification' && (
          <div
            id="tabpanel-verification"
            role="tabpanel"
            aria-labelledby="tab-verification"
            className="space-y-6 animate-in fade-in-50 duration-200 max-w-full"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xs space-y-5 sm:space-y-6 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {t('schemeExploration.placeholders.verificationBadge')}
                    </Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      {t('schemeExploration.placeholders.verificationBadgeCount')}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words">
                    {t('schemeExploration.placeholders.verificationTitle')}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl break-words leading-relaxed">
                    {t('schemeExploration.placeholders.verificationDescription')}
                  </p>
                </div>
              </div>

              {/* Sources Registry Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-2 shrink-0">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.registryTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.registryDesc')}
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/50 w-full max-w-full overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-2 shrink-0">
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-900 break-words">
                      {t('schemeExploration.placeholders.gazetteTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed break-words">
                    {t('schemeExploration.placeholders.gazetteDesc')}
                  </CardContent>
                </Card>
              </div>

              {/* No Badges Policy Notice */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-900">
                  <ShieldAlert className="h-4 w-4 text-slate-700 shrink-0" />
                  <span className="break-words">
                    {language === 'hi' ? 'सार्वजनिक सत्यापन बैज नीति:' : 'No Public Verification Badges Policy:'}
                  </span>
                </div>
                <p className="leading-relaxed break-words">
                  {t('schemeExploration.placeholders.noBadgeNotice')}
                </p>
                <p className="text-slate-500 text-[11px] pt-1 break-words">
                  &bull; {t('schemeExploration.placeholders.demarcationNotice')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

