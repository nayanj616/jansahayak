'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  MapPin,
  Clock,
  Search,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n';
import { hiDictionary } from '@/lib/i18n/dictionaries/hi';
import type { DemoSessionPayload } from '@/types';

export function CitizenQuickActionsHeader({
  onOpenReportModal,
  language,
}: {
  onOpenReportModal: () => void;
  language?: 'en' | 'hi';
}) {
  const { t, language: contextLang } = useLanguage();
  const isHi = (language || contextLang) === 'hi';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
          {isHi ? hiDictionary.citizen.dashboardTitle : t('citizen.dashboardTitle')}
        </h1>
        <p className="text-sm text-slate-500">
          {isHi ? hiDictionary.citizen.dashboardSubtitle : t('citizen.dashboardSubtitle')}
        </p>
      </div>

      <div>
        <Button
          onClick={onOpenReportModal}
          className="w-full sm:w-auto bg-civic-700 hover:bg-civic-800 text-white font-medium shadow-xs gap-2"
        >
          <Plus className="h-4 w-4" />
          {isHi ? hiDictionary.citizen.reportComplaint : t('citizen.reportComplaint')}
        </Button>
      </div>
    </div>
  );
}

export function CitizenScopeBanner({
  session,
}: {
  session: DemoSessionPayload;
  language?: 'en' | 'hi';
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-civic-100 bg-civic-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-civic-900">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-civic-600 shrink-0" />
        <span>
          {t('citizen.scopeArea')}{' '}
          <strong>{session.user.ward || 'Demonstration Sector: Lashkar Area'}</strong> &bull;{' '}
          {session.user.zone || 'Lashkar Demonstration Zone'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-civic-700">
        <Clock className="h-3.5 w-3.5" />
        <span>
          {t('citizen.activeSession')}
        </span>
      </div>
    </div>
  );
}

export interface CitizenExplorationCardsProps {
  language?: 'en' | 'hi';
}

export const CitizenExplorationCards: React.FC<CitizenExplorationCardsProps> = (props) => {
  void props;
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Explore Government Schemes */}
      <Card className="hover:border-civic-300 transition-all group shadow-2xs">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-100 text-civic-700 group-hover:scale-105 transition-transform">
              <Search className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">
              {t('citizen.exploreSchemesTitle')}
            </CardTitle>
          </div>
          <CardDescription>
            {t('citizen.exploreSchemesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/scheme-exploration"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-civic-700 group-hover:text-civic-800 transition-colors"
          >
            {t('citizen.browseSchemes')}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardContent>
      </Card>

      {/* AI Civic Assistant */}
      <Card className="hover:border-cyan-300 transition-all group shadow-2xs">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                {t('citizen.civicAssistantTitle')}
              </CardTitle>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                <Sparkles className="h-2.5 w-2.5" />
                Gemini
              </span>
            </div>
          </div>
          <CardDescription>
            {t('citizen.civicAssistantDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/scheme-exploration#assistant"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-700 group-hover:text-cyan-800 transition-colors"
          >
            {t('citizen.askAssistant')}
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
