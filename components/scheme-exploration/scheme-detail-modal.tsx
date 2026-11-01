'use client';

import * as React from 'react';
import {
  X,
  ExternalLink,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import type { SchemeRecord, SchemeContentSections } from '@/types/schemes';
import {
  getCitizenContent,
  getSchemeFaqs,
  getSourceById,
  getSchemeDisplaySummary,
  getVerifiedApplicationPortal,
  getSchemeScopeBadge,
} from '@/lib/schemes/data';

interface SchemeDetailModalProps {
  scheme: SchemeRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

type DetailTab = 'overview' | 'benefits' | 'eligibility' | 'documents' | 'apply' | 'sources' | 'faqs';

export function SchemeDetailModal({
  scheme,
  isOpen,
  onClose,
}: SchemeDetailModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<DetailTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('modalTab');
      if (
        p === 'overview' ||
        p === 'benefits' ||
        p === 'eligibility' ||
        p === 'documents' ||
        p === 'apply' ||
        p === 'sources' ||
        p === 'faqs'
      ) {
        return p;
      }
    }
    return 'overview';
  });
  const [expandedFaqId, setExpandedFaqId] = React.useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset tab when scheme changes
  const [prevSchemeId, setPrevSchemeId] = React.useState<string | null>(scheme?.scheme_id ?? null);
  if (scheme && scheme.scheme_id !== prevSchemeId) {
    setPrevSchemeId(scheme.scheme_id);
    setActiveTab('overview');
    setExpandedFaqId(null);
  }

  if (!isOpen || !scheme) return null;

  const display = getSchemeDisplaySummary(scheme, language);
  const citizenContent = getCitizenContent(scheme.scheme_id);
  const faqs = getSchemeFaqs(scheme.scheme_id);
  const verifiedPortal = getVerifiedApplicationPortal(scheme);
  const scopeBadge = getSchemeScopeBadge(scheme, language);

  const scopeColors = {
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
  }[scopeBadge.variant];

  const levelColor =
    scheme.scheme_level === 'state'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : scheme.scheme_level === 'central'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : 'bg-purple-100 text-purple-800 border-purple-200';

  const levelLabel =
    scheme.scheme_level === 'state'
      ? t('schemeExploration.finder.levels.state')
      : scheme.scheme_level === 'central'
        ? t('schemeExploration.finder.levels.central')
        : t('schemeExploration.finder.levels.central_state');

  // Category translation
  const catKey = `schemeExploration.finder.categories.${scheme.category}`;
  const categoryLabel = t(catKey);

  // Content sections with fallback handling
  const enSections = citizenContent?.content_en;
  const hiSections = citizenContent?.content_hi;

  const getSectionText = (sec: keyof SchemeContentSections) => {
    if (language === 'hi' && hiSections?.[sec]?.[0]?.text) {
      return {
        text: hiSections[sec]![0].text,
        isFallback: false,
      };
    }
    const fallback = enSections?.[sec]?.[0]?.text || '';
    return {
      text: fallback,
      isFallback: language === 'hi' && fallback.length > 0,
    };
  };

  const overviewText = getSectionText('detailed_description').text || display.summary;
  const isOverviewFallback = getSectionText('detailed_description').isFallback;

  const detailTabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: t('schemeExploration.finder.detail.overviewTab') },
    { id: 'benefits', label: t('schemeExploration.finder.detail.benefitsTab') },
    { id: 'eligibility', label: t('schemeExploration.finder.detail.eligibilityTab') },
    { id: 'documents', label: t('schemeExploration.finder.detail.documentsTab') },
    { id: 'apply', label: t('schemeExploration.finder.detail.applyTab') },
    { id: 'sources', label: t('schemeExploration.finder.detail.sourcesTab') },
    { id: 'faqs', label: `${t('schemeExploration.finder.detail.faqsTab')} (${faqs.length})` },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheme-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0 duration-200"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-200/90 bg-slate-50/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${levelColor}`}
                >
                  <Building className="h-3 w-3" />
                  {levelLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {categoryLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${scopeColors}`}
                >
                  {scopeBadge.label}
                </span>
              </div>

              <h2
                id="scheme-detail-title"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight break-words"
              >
                {display.title}
                {display.isTitleFallback && (
                  <span className="ml-2 text-xs font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {t('schemeExploration.finder.card.hindiFallbackNotice')}
                  </span>
                )}
              </h2>

              {scheme.short_name && scheme.short_name !== scheme.official_name && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>
                    {scheme.short_name} &bull; {scheme.official_name}
                  </span>
                  {language === 'hi' && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {t('schemeExploration.finder.card.hindiFallbackNotice')}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* TAB BAR NAVIGATION */}
          <div
            role="tablist"
            className="flex items-center gap-1 overflow-x-auto pt-4 mt-2 border-t border-slate-200/60 no-scrollbar"
          >
            {detailTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-base">
                  {language === 'hi' ? 'योजना का परिचय' : 'Scheme Summary'}
                </h3>
                <p className="text-slate-700 leading-relaxed break-words bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                  {overviewText}
                </p>
                {isOverviewFallback && (
                  <p className="text-xs text-amber-700">
                    {t('schemeExploration.finder.card.hindiFallbackNotice')}
                  </p>
                )}
              </div>

              {/* Target Beneficiaries */}
              {scheme.beneficiary_groups && scheme.beneficiary_groups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {t('schemeExploration.finder.detail.targetBeneficiaries')}
                    </h4>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scheme.beneficiary_groups.map((group, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 border border-blue-100"
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative Implementing Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    {language === 'hi' ? 'मंत्रालय / विभाग' : 'Ministry / Department'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-800">
                      {scheme.ministry || scheme.department || (language === 'hi' ? 'आधिकारिक स्रोत में दर्ज नहीं है' : 'Not recorded')}
                    </p>
                    {language === 'hi' && (scheme.ministry || scheme.department) && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-1">
                  <span className="text-xs font-semibold text-slate-500 block">
                    {language === 'hi' ? 'क्रियान्वयन एजेंसी' : 'Implementing Agency'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-xs font-medium text-slate-800">
                      {scheme.implementing_agency || (language === 'hi' ? 'आधिकारिक स्रोत में दर्ज नहीं है' : 'Not recorded in official sources')}
                    </p>
                    {language === 'hi' && scheme.implementing_agency && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Objectives */}
              {scheme.objectives && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {t('schemeExploration.finder.detail.objectives')}
                    </h4>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed pl-4 border-l-2 border-blue-600 space-y-1">
                    {Array.isArray(scheme.objectives) ? (
                      scheme.objectives.map((obj, i) => <p key={i}>&bull; {obj}</p>)
                    ) : (
                      <p>{scheme.objectives}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Demarcation Note */}
              <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3.5 text-xs text-amber-900">
                <p>{t('schemeExploration.finder.detail.explanatoryContentNotice')}</p>
              </div>
            </div>
          )}

          {/* TAB 2: BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    {language === 'hi' ? 'लाभ राशि' : 'Benefit Amount'}
                  </span>
                  <p className="text-base font-bold text-emerald-950">
                    {scheme.benefit_amount || display.benefitsPreview}
                  </p>
                  {scheme.benefit_frequency && (
                    <span className="text-xs text-emerald-700 font-medium block">
                      Frequency: {scheme.benefit_frequency}
                    </span>
                  )}
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-1">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    {language === 'hi' ? 'कवरेज एवं अवधि' : 'Coverage & Duration'}
                  </span>
                  <p className="text-sm font-semibold text-blue-950">
                    Coverage: {scheme.coverage || t('schemeExploration.finder.detail.unrecorded')}
                  </p>
                  <p className="text-xs text-blue-700">
                    Duration: {scheme.duration || t('schemeExploration.finder.detail.unrecorded')}
                  </p>
                </div>
              </div>

              {/* Full Benefits Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {language === 'hi' ? 'विस्तृत सहायता विवरण' : 'Detailed Assistance Breakdown'}
                  </h4>
                  {language === 'hi' && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {t('schemeExploration.finder.card.hindiFallbackNotice')}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2 text-xs text-slate-700 leading-relaxed">
                  {Array.isArray(scheme.benefits) ? (
                    scheme.benefits.map((b, i) => <p key={i}>&bull; {b}</p>)
                  ) : (
                    <p>{scheme.benefits || (language === 'hi' ? 'नियम अनुसार शासकीय सहायता।' : 'Standard benefits as per scheme guidelines.')}</p>
                  )}
                </div>
              </div>

              {/* Benefit Types */}
              {scheme.benefit_type && scheme.benefit_type.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      {language === 'hi' ? 'लाभ के प्रकार' : 'Benefit Types'}
                    </span>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scheme.benefit_type.map((type, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-800"
                      >
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STRUCTURED ELIGIBILITY */}
          {activeTab === 'eligibility' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  {language === 'hi'
                    ? 'अकादमिक शुचिता: अनिश्चित या खाली फ़ील्ड का अर्थ अयोग्यता नहीं है। यदि स्रोत में कोई शर्त दर्ज नहीं है, तो उसे निष्पक्ष रूप से अनिर्धारित दर्शाया गया है।'
                    : 'Dataset Integrity: Unrecorded criteria indicate the official records do not specify a constraint; missing data is never converted into disqualification.'}
                </p>
              </div>

              {/* Structured Criteria Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Age Limits */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '1. आयु सीमा' : '1. Age Bounds'}
                  </span>
                  <p className="font-semibold text-slate-900">
                    {scheme.age_min !== null || scheme.age_max !== null
                      ? `${scheme.age_min ?? (language === 'hi' ? 'न्यूनतम नहीं' : 'No min')} - ${scheme.age_max ?? (language === 'hi' ? 'अधिकतम नहीं' : 'No max')} ${language === 'hi' ? 'वर्ष' : 'years'}`
                      : (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                  </p>
                </div>

                {/* Gender Eligibility */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '2. लिंग पात्रता' : '2. Gender Eligibility'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-900">
                      {scheme.gender_eligibility || (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                    </p>
                    {language === 'hi' && scheme.gender_eligibility && !/[\u0900-\u097F]/.test(scheme.gender_eligibility) && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Income Limit */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '3. आय सीमा' : '3. Income Ceiling'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-900">
                      {scheme.income_limit
                        ? `₹${scheme.income_limit}`
                        : (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                    </p>
                    {language === 'hi' && scheme.income_limit && typeof scheme.income_limit === 'string' && !/[\u0900-\u097F]/.test(scheme.income_limit) && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>

                {/* BPL Requirement */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '4. बीपीएल स्थिति' : '4. BPL Card Requirement'}
                  </span>
                  <p className="font-semibold text-slate-900">
                    {scheme.bpl_required === true
                      ? (language === 'hi' ? 'अनिवार्य (बीपीएल आवश्यक)' : 'Mandatory (BPL Required)')
                      : scheme.bpl_required === false
                        ? (language === 'hi' ? 'आवश्यक नहीं' : 'Not Required')
                        : (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                  </p>
                </div>

                {/* Social Categories */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '5. सामाजिक वर्ग' : '5. Social Categories'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-900">
                      {scheme.social_categories && scheme.social_categories.length > 0
                        ? scheme.social_categories.join(', ')
                        : (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                    </p>
                    {language === 'hi' && scheme.social_categories && scheme.social_categories.length > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Disability Status */}
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block mb-1">
                    {language === 'hi' ? '6. दिव्यांगता पात्रता' : '6. Disability Eligibility'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-slate-900">
                      {scheme.disability_eligibility !== null
                        ? (scheme.disability_eligibility === true ? (language === 'hi' ? 'हाँ (दिव्यांगता आवश्यक)' : 'Yes (Disability Required)') : String(scheme.disability_eligibility))
                        : (language === 'hi' ? 'आधिकारिक दस्तावेज में निर्दिष्ट नहीं है' : 'Not specified in official documentation')}
                    </p>
                    {language === 'hi' && scheme.disability_eligibility !== null && typeof scheme.disability_eligibility === 'string' && !/[\u0900-\u097F]/.test(scheme.disability_eligibility) && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Conditions & Exclusions */}
              {scheme.other_eligibility_conditions &&
                scheme.other_eligibility_conditions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">
                        {language === 'hi' ? 'अन्य पात्रता शर्तें' : 'Additional Conditions'}
                      </h4>
                      {language === 'hi' && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {t('schemeExploration.finder.card.hindiFallbackNotice')}
                        </span>
                      )}
                    </div>
                    <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                      {scheme.other_eligibility_conditions.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {scheme.exclusions && scheme.exclusions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-rose-900 text-xs">
                      {language === 'hi' ? 'अपवाद एवं अपात्रता (Exclusions)' : 'Exclusions & Disqualifications'}
                    </h4>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <ul className="list-disc pl-5 text-xs text-rose-800 space-y-1">
                    {scheme.exclusions.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Mandatory Documents */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {t('schemeExploration.finder.detail.mandatoryDocs')}
                  </h4>
                  {language === 'hi' && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                      {t('schemeExploration.finder.card.hindiFallbackNotice')}
                    </span>
                  )}
                </div>
                {scheme.mandatory_documents && scheme.mandatory_documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {scheme.mandatory_documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 text-xs text-emerald-950 font-medium flex items-center gap-2"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {t('schemeExploration.finder.detail.noDocsListed')}
                  </p>
                )}
              </div>

              {/* Conditional Documents */}
              {scheme.conditional_documents && scheme.conditional_documents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      {t('schemeExploration.finder.detail.conditionalDocs')}
                    </h4>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {scheme.conditional_documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-xs text-amber-950 font-medium flex items-center gap-2"
                      >
                        <FileText className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Notes */}
              {scheme.document_notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 block">
                      {language === 'hi' ? 'दस्तावेज संबंधी टिप्पणी:' : 'Document Notes:'}
                    </span>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <p>{scheme.document_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HOW TO APPLY */}
          {activeTab === 'apply' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Application Portal Action Card */}
              {verifiedPortal ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        {language === 'hi' ? 'आधिकारिक आवेदन पोर्टल' : 'Official Portal Route'}
                      </span>
                      <p className="text-sm font-semibold text-blue-950 break-all">
                        {verifiedPortal.url}
                      </p>
                    </div>

                    <a
                      href={verifiedPortal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold shadow-xs shrink-0 cursor-pointer"
                    >
                      <span>{t('schemeExploration.finder.detail.verifiedLink')}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    {language === 'hi' ? 'आवेदन पोर्टल स्थिति' : 'Application Portal Status'}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {language === 'hi'
                      ? 'इस योजना के लिए आधिकारिक अभिलेखों में प्रत्यक्ष ऑनलाइन स्व-सेवा आवेदन पोर्टल उपलब्ध नहीं है। आवेदन प्रक्रिया निर्दिष्ट ऑफ़लाइन माध्यमों (जैसे ग्राम पंचायत, नगर निगम जोनल कार्यालय, बैंक शाखा या लोक सेवा केंद्र) द्वारा पूरी की जाती है जैसा कि आवेदन चरणों में उल्लेखित है।'
                      : 'A direct online self-service application portal route is not established in official records for this scheme. Application is processed through designated offline channels (e.g., Gram Panchayat, municipal ward office, bank branch, or Lok Seva Kendra) as specified under Application Steps.'}
                  </p>
                </div>
              )}

              {/* Application Modes */}
              {scheme.application_mode && scheme.application_mode.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      {language === 'hi' ? 'आवेदन के माध्यम' : 'Application Modes'}
                    </span>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scheme.application_mode.map((mode, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800"
                      >
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Application Process */}
              {scheme.application_steps && scheme.application_steps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {t('schemeExploration.finder.detail.applicationSteps')}
                    </h4>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <ol className="space-y-2.5">
                    {scheme.application_steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 bg-slate-50/40 text-xs text-slate-800"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-[11px] font-bold text-white mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Status Checking Guidance */}
              {scheme.how_to_check_status && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 block">
                      {t('schemeExploration.finder.detail.statusCheck')}:
                    </span>
                    {language === 'hi' && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        {t('schemeExploration.finder.card.hindiFallbackNotice')}
                      </span>
                    )}
                  </div>
                  <p>{scheme.how_to_check_status}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SOURCES & EVIDENCE */}
          {activeTab === 'sources' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  {t('schemeExploration.finder.detail.sourcesTitle')}
                </h4>
                <p className="text-xs text-slate-500">
                  {language === 'hi'
                    ? 'योजना के समस्त तथ्य आधिकारिक सरकारी पोर्टलों (.gov.in / .nic.in) एवं राजपत्रों पर आधारित हैं।'
                    : 'All scheme criteria are grounded in researched government portals and official gazettes.'}
                </p>
              </div>

              {/* Sources Registry List */}
              <div className="space-y-3">
                {scheme.sources && scheme.sources.length > 0 ? (
                  scheme.sources.map((srcId) => {
                    const src = getSourceById(srcId);
                    if (!src) return null;

                    return (
                      <div
                        key={src.source_id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-semibold text-blue-700 font-mono">
                              {src.source_id} &bull; {src.source_type}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-900">{src.title}</h5>
                              {language === 'hi' && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  {t('schemeExploration.finder.card.hindiFallbackNotice')}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{src.issuing_authority}</p>
                          </div>

                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 shrink-0 cursor-pointer"
                          >
                            <span>Open Source</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {src.scope_note && (
                          <div className="text-xs text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-2">
                            <span>Note: {src.scope_note}</span>
                            {language === 'hi' && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {t('schemeExploration.finder.card.hindiFallbackNotice')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">No sources recorded.</p>
                )}
              </div>

              {/* Academic Demarcation Banner */}
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-xs text-slate-700 leading-relaxed">
                {t('schemeExploration.finder.detail.demarcationNotice')}
              </div>
            </div>
          )}

          {/* TAB 7: FAQS */}
          {activeTab === 'faqs' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {language === 'hi' ? 'योजना से संबंधित सामान्य प्रश्न' : 'Frequently Asked Questions'}
                </h4>
                <p className="text-xs text-slate-500">
                  {faqs.length} {language === 'hi' ? 'शोधित प्रश्न उपलब्ध' : 'researched FAQs recorded'}
                </p>
              </div>

              {faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.faq_id;
                    const question =
                      language === 'hi' && faq.question_hi ? faq.question_hi : faq.question;
                    const answer =
                      language === 'hi' && faq.answer_hi ? faq.answer_hi : faq.answer;
                    const isFaqFallback = language === 'hi' && !faq.answer_hi;
                    const isQuestionFallback = language === 'hi' && !faq.question_hi;

                    return (
                      <div
                        key={faq.faq_id}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.faq_id)}
                          className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900">
                              {question}
                            </span>
                            {isQuestionFallback && (
                              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {t('schemeExploration.finder.card.hindiFallbackNotice')}
                              </span>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-slate-100 text-xs text-slate-700 space-y-2 bg-slate-50/50">
                            <p className="leading-relaxed whitespace-pre-line">{answer}</p>
                            {isFaqFallback && (
                              <span className="text-[11px] text-amber-700 block">
                                {t('schemeExploration.finder.card.hindiFallbackNotice')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  {t('schemeExploration.finder.detail.noFaqsAvailable')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200/90 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 font-mono">
            ID: {scheme.scheme_id}
          </span>

          <div className="flex items-center gap-2">
            {verifiedPortal && (
              <a
                href={verifiedPortal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <span>{t('schemeExploration.finder.detail.officialPortal')}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <Button
              size="sm"
              variant="default"
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium cursor-pointer"
            >
              {language === 'hi' ? 'बंद करें' : 'Close Details'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
