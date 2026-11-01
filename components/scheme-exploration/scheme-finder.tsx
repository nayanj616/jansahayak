'use client';

import * as React from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/lib/i18n';
import type {
  SchemeRecord,
  SchemeLevel,
  UserEligibilityProfile,
} from '@/types/schemes';
import {
  searchSchemes,
  SchemeSearchResultItem,
} from '@/lib/schemes/search';
import {
  getCategoryCounts,
  getSchemeLevelCounts,
  getSchemeDisplaySummary,
  getSchemeById,
} from '@/lib/schemes/data';
import { SchemeDetailModal } from './scheme-detail-modal';

export function SchemeFinder() {
  const { t, language } = useLanguage();

  // Search & Filter States
  const [query, setQuery] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('q') || '';
    }
    return '';
  });
  const [selectedLevel, setSelectedLevel] = React.useState<SchemeLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Eligibility drawer state & profile
  const [eligibilityOpen, setEligibilityOpen] = React.useState(false);
  const [profile, setProfile] = React.useState<UserEligibilityProfile>({
    age: null,
    gender: null,
    annualIncome: null,
    isBpl: null,
    hasDisability: null,
    socialCategory: null,
  });
  const [eligibilityFilterStatus, setEligibilityFilterStatus] = React.useState<
    'all' | 'meets' | 'cannot_determine'
  >('all');

  // Modal Detail State (supports optional deep-link ?scheme=<id>)
  const [selectedScheme, setSelectedScheme] = React.useState<SchemeRecord | null>(() => {
    if (typeof window !== 'undefined') {
      const schemeId = new URLSearchParams(window.location.search).get('scheme');
      return schemeId ? getSchemeById(schemeId) || null : null;
    }
    return null;
  });
  const [detailModalOpen, setDetailModalOpen] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const schemeId = new URLSearchParams(window.location.search).get('scheme');
      return Boolean(schemeId && getSchemeById(schemeId));
    }
    return false;
  });

  // Category & Level Counts from data
  const categoryCounts = React.useMemo(() => getCategoryCounts(), []);
  const levelCounts = React.useMemo(() => getSchemeLevelCounts(), []);

  // Compute search results deterministically
  const results: SchemeSearchResultItem[] = React.useMemo(() => {
    return searchSchemes({
      query,
      schemeLevel: selectedLevel,
      category: selectedCategory,
      eligibilityProfile: profile,
      eligibilityFilterStatus,
      mpPriority: true,
    });
  }, [query, selectedLevel, selectedCategory, profile, eligibilityFilterStatus]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedLevel !== 'all' ||
    selectedCategory !== 'all' ||
    eligibilityFilterStatus !== 'all' ||
    Object.values(profile).some((v) => v !== null && v !== undefined && v !== '');

  const handleResetFilters = () => {
    setQuery('');
    setSelectedLevel('all');
    setSelectedCategory('all');
    setEligibilityFilterStatus('all');
    setProfile({
      age: null,
      gender: null,
      annualIncome: null,
      isBpl: null,
      hasDisability: null,
      socialCategory: null,
    });
  };

  const handleOpenDetail = (scheme: SchemeRecord) => {
    setSelectedScheme(scheme);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
  };

  // Helper for Level Pill count
  const getLevelCount = (lvl: SchemeLevel | 'all') => {
    if (lvl === 'all') return 50;
    const found = levelCounts.find((item) => item.level === lvl);
    return found ? found.count : 0;
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. TOP CONTROLS & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs space-y-5 max-w-full">
        {/* Search Input Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('schemeExploration.finder.searchPlaceholder')}
            className="pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 w-full"
            aria-label={t('schemeExploration.finder.searchLabel')}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={t('schemeExploration.finder.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Level Filters Pills */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {t('schemeExploration.finder.filterByLevel')}
            </span>
            <span className="text-xs text-amber-700 font-medium hidden sm:inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              {t('schemeExploration.finder.mpProminenceBadge')}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(['all', 'state', 'central', 'central_state'] as const).map((lvl) => {
              const isSelected = selectedLevel === lvl;
              const label = t(`schemeExploration.finder.levels.${lvl}`);
              const count = getLevelCount(lvl);

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-blue-700 text-white shadow-2xs'
                      : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/90'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Selector & Eligibility Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 shrink-0">
              {t('schemeExploration.finder.filterByCategory')}:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 max-w-full truncate cursor-pointer"
            >
              <option value="all">
                {t('schemeExploration.finder.categories.all')} (50)
              </option>
              {categoryCounts.map((item) => (
                <option key={item.category} value={item.category}>
                  {t(`schemeExploration.finder.categories.${item.category}`)} ({item.count})
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility Drawer Toggle */}
          <button
            type="button"
            onClick={() => setEligibilityOpen(!eligibilityOpen)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
              eligibilityOpen ||
              Object.values(profile).some((v) => v !== null && v !== undefined && v !== '')
                ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>{t('schemeExploration.finder.eligibilityDrawer.toggle')}</span>
          </button>
        </div>

        {/* 2. OPTIONAL ELIGIBILITY CRITERIA DRAWER (Conservative Rule-Based) */}
        {eligibilityOpen && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5 space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-700 shrink-0" />
                  {t('schemeExploration.finder.eligibilityDrawer.title')}
                </h4>
                <p className="text-[11px] sm:text-xs text-indigo-800/90 leading-relaxed">
                  {t('schemeExploration.finder.eligibilityDrawer.academicNotice')}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setProfile({
                    age: null,
                    gender: null,
                    annualIncome: null,
                    isBpl: null,
                    hasDisability: null,
                    socialCategory: null,
                  })
                }
                className="text-xs text-indigo-700 hover:text-indigo-900 underline font-medium shrink-0 cursor-pointer"
              >
                {t('schemeExploration.finder.eligibilityDrawer.resetEligibility')}
              </button>
            </div>

            {/* Criteria Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
              {/* Age */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.ageLabel')}
                </label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={profile.age ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      age: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder={t('schemeExploration.finder.eligibilityDrawer.agePlaceholder')}
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.genderLabel')}
                </label>
                <select
                  value={profile.gender ?? 'all'}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      gender: e.target.value === 'all' ? null : (e.target.value as 'women' | 'men'),
                    })
                  }
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="all">
                    {t('schemeExploration.finder.eligibilityDrawer.genderAll')}
                  </option>
                  <option value="women">
                    {t('schemeExploration.finder.eligibilityDrawer.genderWomen')}
                  </option>
                  <option value="men">
                    {t('schemeExploration.finder.eligibilityDrawer.genderMen')}
                  </option>
                </select>
              </div>

              {/* Annual Income */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.incomeLabel')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={profile.annualIncome ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      annualIncome: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder={t('schemeExploration.finder.eligibilityDrawer.incomePlaceholder')}
                  className="h-8 text-xs bg-white rounded-lg"
                />
              </div>

              {/* BPL Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.bplLabel')}
                </label>
                <select
                  value={
                    profile.isBpl === true ? 'yes' : profile.isBpl === false ? 'no' : 'any'
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      isBpl: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null,
                    })
                  }
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="any">
                    {t('schemeExploration.finder.eligibilityDrawer.bplAny')}
                  </option>
                  <option value="yes">
                    {t('schemeExploration.finder.eligibilityDrawer.bplYes')}
                  </option>
                  <option value="no">
                    {t('schemeExploration.finder.eligibilityDrawer.bplNo')}
                  </option>
                </select>
              </div>

              {/* Disability Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.disabilityLabel')}
                </label>
                <select
                  value={
                    profile.hasDisability === true
                      ? 'yes'
                      : profile.hasDisability === false
                        ? 'no'
                        : 'any'
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      hasDisability:
                        e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null,
                    })
                  }
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="any">
                    {t('schemeExploration.finder.eligibilityDrawer.disabilityAny')}
                  </option>
                  <option value="yes">
                    {t('schemeExploration.finder.eligibilityDrawer.disabilityYes')}
                  </option>
                  <option value="no">
                    {t('schemeExploration.finder.eligibilityDrawer.disabilityNo')}
                  </option>
                </select>
              </div>

              {/* Social Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  {t('schemeExploration.finder.eligibilityDrawer.categoryLabel')}
                </label>
                <select
                  value={profile.socialCategory ?? 'all'}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      socialCategory:
                        e.target.value === 'all'
                          ? null
                          : (e.target.value as 'SC' | 'ST' | 'OBC' | 'General' | 'EWS'),
                    })
                  }
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                >
                  <option value="all">All / Any</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                  <option value="General">General</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>
            </div>

            {/* Filter by Evaluation Status */}
            <div className="pt-2 border-t border-indigo-100 flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-950 shrink-0">
                {t('schemeExploration.finder.eligibilityDrawer.statusFilter')}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'meets', 'cannot_determine'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setEligibilityFilterStatus(st)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                      eligibilityFilterStatus === st
                        ? 'bg-indigo-700 text-white'
                        : 'bg-white text-indigo-900 border border-indigo-200'
                    }`}
                  >
                    {st === 'all' && t('schemeExploration.finder.eligibilityDrawer.statusAll')}
                    {st === 'meets' && t('schemeExploration.finder.eligibilityDrawer.statusMeets')}
                    {st === 'cannot_determine' &&
                      t('schemeExploration.finder.eligibilityDrawer.statusCannotDetermine')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. RESULTS STATUS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <span>
            {t('schemeExploration.finder.resultsCount')
              .replace('{count}', String(results.length))
              .replace('{total}', '50')}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-medium text-blue-700 hover:text-blue-900 underline cursor-pointer w-fit"
          >
            {t('schemeExploration.finder.clearAllFilters')}
          </button>
        )}
      </div>

      {/* 4. SCHEME CARDS GRID (Citizen-Facing Catalogue Layout) */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map(({ scheme, eligibility }) => {
            const display = getSchemeDisplaySummary(scheme, language);
            const catLabel = t(`schemeExploration.finder.categories.${scheme.category}`);

            const levelStyle =
              scheme.scheme_level === 'state'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : scheme.scheme_level === 'central'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-purple-100 text-purple-800 border-purple-200';

            const levelText =
              scheme.scheme_level === 'state'
                ? t('schemeExploration.finder.levels.state')
                : scheme.scheme_level === 'central'
                  ? t('schemeExploration.finder.levels.central')
                  : t('schemeExploration.finder.levels.central_state');

            return (
              <Card
                key={scheme.scheme_id}
                className="group border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all duration-150 flex flex-col justify-between overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${levelStyle}`}
                        >
                          <Building className="h-3 w-3" />
                          {levelText}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {catLabel}
                        </span>
                      </div>

                      {/* Eligibility Evaluation Badge (if active) */}
                      {eligibility && (
                        <div>
                          {eligibility.overallStatus === 'meets' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('schemeExploration.finder.card.meetsEligibility')}
                            </span>
                          )}
                          {eligibility.overallStatus === 'does_not_meet' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[11px] font-bold">
                              <AlertCircle className="h-3 w-3" />
                              {t('schemeExploration.finder.card.doesNotMeetEligibility')}
                            </span>
                          )}
                          {eligibility.overallStatus === 'cannot_determine' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[11px] font-medium">
                              <HelpCircle className="h-3 w-3" />
                              {t('schemeExploration.finder.card.cannotDetermineEligibility')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Scheme Title */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-800 transition-colors leading-snug break-words">
                        {display.title}
                      </h3>
                      {display.isTitleFallback && (
                        <span className="text-[11px] text-amber-700 italic block mt-0.5">
                          {t('schemeExploration.finder.card.hindiFallbackNotice')}
                        </span>
                      )}
                    </div>

                    {/* Short Citizen Summary */}
                    <div>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed break-words">
                        {display.summary}
                      </p>
                      {display.isSummaryFallback && (
                        <span className="text-[10px] text-amber-700 italic block mt-0.5">
                          {t('schemeExploration.finder.card.hindiFallbackNotice')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Benefit preview & Action Button */}
                  <div className="pt-3 border-t border-slate-100 space-y-3 mt-4">
                    {/* Benefit Preview Pill */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium shrink-0">
                        {t('schemeExploration.finder.card.benefit')}:
                      </span>
                      <span className="font-semibold text-slate-900 truncate ml-2 text-right">
                        {display.benefitsPreview}
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(scheme)}
                      className="w-full justify-between text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-2xs group/btn cursor-pointer"
                    >
                      <span>{t('schemeExploration.finder.card.viewDetails')}</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* 5. EMPTY STATE */
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {t('schemeExploration.finder.noResultsTitle')}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {t('schemeExploration.finder.noResultsDesc')}
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={handleResetFilters}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium"
          >
            {t('schemeExploration.finder.clearAllFilters')}
          </Button>
        </div>
      )}

      {/* 6. CANONICAL DETAIL MODAL */}
      <SchemeDetailModal
        scheme={selectedScheme}
        isOpen={detailModalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
