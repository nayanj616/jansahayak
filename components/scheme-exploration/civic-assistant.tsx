'use client';

import * as React from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  FileText,
  RotateCcw,
  Building,
  Info,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { formatFrontendError } from '@/lib/errors';
import type { CivicAnswerResult, CivicSourceReference } from '@/types';

const TOPIC_LABELS: Record<string, { en: string; hi: string }> = {
  deadlines: { en: 'Application Deadlines & Dates', hi: 'आवेदन की अंतिम तिथि व समय-सीमा' },
  eligibility: { en: 'Specific Eligibility Criteria', hi: 'विशिष्ट पात्रता शर्तें' },
  documents: { en: 'Required Document Checklist', hi: 'आवश्यक दस्तावेज़ सूची' },
  benefits: { en: 'Benefit Amount / Financial Aid', hi: 'सहायता राशि व वित्तीय लाभ' },
  application: { en: 'Application Procedure & Portal', hi: 'आवेदन प्रक्रिया व पोर्टल' },
  status: { en: 'Status Tracking Mechanism', hi: 'आवेदन स्थिति जाँच' },
  overview: { en: 'General Scheme Overview', hi: 'योजना का सामान्य विवरण' },
  selection: { en: 'Selection & Scrutiny Process', hi: 'चयन व स्वीकृति प्रक्रिया' },
  conditions: { en: 'Mandatory Rules & Conditions', hi: 'अनिवार्य नियम व शर्तें' },
};

export function CivicAssistant() {
  const { t, tArray, language } = useLanguage();
  const [question, setQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUnconfigured, setIsUnconfigured] = React.useState(false);
  const [result, setResult] = React.useState<CivicAnswerResult | null>(null);

  const defaultQuestions = [
    'How to apply for Ladli Behna scheme?',
    'KCC ka loan kitna hota hai?',
    'मनरेगा में काम कैसे माँगूँ?',
    'PM Surya Ghar ki subsidy kitni milegi?',
    'What documents are needed for Pratibha Kiran?',
  ];

  const loadedQuestions = typeof tArray === 'function' ? tArray('schemeExploration.assistant.suggestedQuestions') : [];
  const suggestedQuestions: string[] = loadedQuestions.length > 0 ? loadedQuestions : defaultQuestions;

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk ?? question).trim();
    if (!q || q.length < 2 || isLoading) return;

    if (queryToAsk) {
      setQuestion(queryToAsk);
    }

    setIsLoading(true);
    setError(null);
    setIsUnconfigured(false);
    setResult(null);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 503 && data.isConfigured === false) {
          setIsUnconfigured(true);
          setError(
            t('schemeExploration.assistant.unconfiguredNotice') ||
              (language === 'hi'
                ? 'नागरिक सहायक सेवा वर्तमान में अनुपलब्ध है। कृपया बाद में प्रयास करें।'
                : 'Civic Assistant service is currently unavailable. Please try again later.')
          );
        } else {
          setError(
            formatFrontendError(
              data.error || 'Unable to process your question at this time. Please try again.',
              language,
              'schemeExploration.assistant.errorNotice'
            )
          );
        }
        return;
      }

      if (data.success && data.data) {
        setResult(data.data as CivicAnswerResult);
      } else {
        setError(
          t('schemeExploration.assistant.errorNotice') ||
            (language === 'hi'
              ? 'वर्तमान में आपके प्रश्न को संसाधित करने में असमर्थ। कृपया पुनः प्रयास करें।'
              : 'Unable to process your question at this time. Please try again.')
        );
      }
    } catch (err) {
      console.error('[CivicAssistant Client Error]', err);
      setError(
        formatFrontendError(err, language, 'schemeExploration.assistant.errorNotice')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleClear = () => {
    setQuestion('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-xs space-y-6 max-w-full overflow-hidden">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="purple" className="text-xs shrink-0">
              {t('schemeExploration.assistant.badge') || 'Academic Demo Prototype'}
            </Badge>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shrink-0">
              {t('schemeExploration.assistant.ragSubtitle') || 'Source-Grounded Gemini RAG'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 break-words flex items-center gap-2">
            <Bot className="h-6 w-6 text-indigo-600 shrink-0" />
            {t('schemeExploration.assistant.title') || 'Civic Assistant (RAG)'}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl break-words leading-relaxed">
            {t('schemeExploration.assistant.description') ||
              'Ask questions about 50 researched Madhya Pradesh & Central welfare schemes. Answers are formulated strictly using retrieved official source evidence.'}
          </p>
        </div>
      </div>

      {/* PROJECT DEMARCATION & GROUNDING NOTICE */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 sm:p-4 text-blue-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-900">
          <Info className="h-4 w-4 text-blue-700 shrink-0" />
          <span>
            {language === 'hi'
              ? 'अकादमिक प्रदर्शन एवं साक्ष्य-आधारित सीमा'
              : 'Academic Demonstration & Strict Source Grounding'}
          </span>
        </div>
        <p className="text-xs text-blue-900/90 leading-relaxed break-words">
          {t('schemeExploration.assistant.academicDemarcation') ||
            'Academic Demonstration: Answers are synthesized exclusively from researched government records without speculative hallucination. JanSahayak does not accept or approve applications.'}
        </p>
      </div>

      {/* QUESTION INPUT SECTION */}
      <div className="space-y-3">
        <div className="relative rounded-xl border border-slate-300 bg-white shadow-xs focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20 transition-all">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder={
              t('schemeExploration.assistant.inputPlaceholder') ||
              'Ask in English, Hindi, or Romanized Hindi (e.g. How to apply for Ladli Behna? KCC loan rules...)'
            }
            rows={3}
            disabled={isLoading}
            className="w-full resize-none rounded-xl p-3.5 sm:p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            aria-label="Civic Assistant question"
          />

          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 bg-slate-50/60 rounded-b-xl">
            <span className="text-xs text-slate-500 font-mono">
              {question.length}/500{' '}
              {language === 'hi' ? 'वर्ण' : 'characters'}
            </span>

            <div className="flex items-center gap-2">
              {question && !isLoading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs text-slate-600 hover:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  {t('schemeExploration.assistant.clearButton') || 'Clear'}
                </Button>
              )}

              <Button
                type="button"
                variant="civic"
                size="sm"
                onClick={() => handleAsk()}
                disabled={isLoading || question.trim().length < 2}
                className="text-xs font-semibold px-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    {t('schemeExploration.assistant.askingButton') || 'Retrieving...'}
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {t('schemeExploration.assistant.askButton') || 'Ask Assistant'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* SUGGESTED SAMPLE QUESTIONS */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              {t('schemeExploration.assistant.suggestedQuestionsTitle') ||
                'Sample Questions to Try:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {suggestedQuestions.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAsk(sq)}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-colors text-left break-words disabled:opacity-50 cursor-pointer"
              >
                &ldquo;{sq}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ERROR / UNCONFIGURED ALERT */}
      {error && (
        <div
          role="alert"
          className={`rounded-xl border p-4 text-xs sm:text-sm space-y-1.5 animate-in fade-in-50 duration-200 ${
            isUnconfigured
              ? 'border-amber-300 bg-amber-50 text-amber-950'
              : 'border-red-300 bg-red-50 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle
              className={`h-4 w-4 shrink-0 ${
                isUnconfigured ? 'text-amber-700' : 'text-red-700'
              }`}
            />
            <span>
              {isUnconfigured
                ? language === 'hi'
                  ? 'सेवा कॉन्फ़िगरेशन सूचना'
                  : 'Service Configuration Notice'
                : language === 'hi'
                  ? 'त्रुटि सूचना'
                  : 'Assistant Error'}
            </span>
          </div>
          <p className="leading-relaxed break-words">{error}</p>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8 text-center space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 text-blue-700 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              {language === 'hi'
                ? 'सरकारी रिकॉर्ड की खोज एवं उत्तर निर्माण जारी है...'
                : 'Retrieving Verified Scheme Evidence & Generating Grounded Answer...'}
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {language === 'hi'
                ? '282 शोधित आरएजी अंशों में से साक्ष्य संकलित कर जेमिनी मॉडल द्वारा उत्तर तैयार किया जा रहा है।'
                : 'Extracting factual evidence across 282 verified RAG chunks to formulate an authoritative response.'}
            </p>
          </div>
        </div>
      )}

      {/* RESULT SECTION */}
      {result && !isLoading && (
        <div className="space-y-5 animate-in fade-in-50 duration-300">
          {/* PARTIAL EVIDENCE NOTICE */}
          {result.sufficiencyStatus === 'partial' && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 space-y-2"
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  {t('schemeExploration.assistant.partialEvidenceTitle') ||
                    'Partial Evidence / Unanswered Topics Notice'}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed break-words">
                {t('schemeExploration.assistant.partialEvidenceNotice') ||
                  'Information for some requested topics is unestablished in the verified dataset. Only supported facts are shown.'}
              </p>
              {result.unsupportedTopics && result.unsupportedTopics.length > 0 && (
                <div className="text-xs text-amber-800 pt-1.5 space-y-1.5 border-t border-amber-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">
                      {language === 'hi' ? 'अनुत्तरित / असत्यापित विषय: ' : 'Unanswered / unestablished topics: '}
                    </span>
                    {result.unsupportedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200/60"
                      >
                        {TOPIC_LABELS[topic]?.[language === 'hi' ? 'hi' : 'en'] || topic}
                      </span>
                    ))}
                  </div>
                  {result.unestablishedFields && result.unestablishedFields.length > 0 && (
                    <details className="text-[11px] text-amber-700/80 cursor-pointer pt-0.5">
                      <summary className="hover:text-amber-950 select-none">
                        {language === 'hi'
                          ? 'तकनीकी विवरण (डेटासेट फ़ील्ड संदर्भ)'
                          : 'Technical details (unestablished dataset fields)'}
                      </summary>
                      <div className="mt-1 font-mono text-[10px] bg-amber-100/60 p-1.5 rounded border border-amber-200/80 text-amber-900">
                        {result.unestablishedFields.join(', ')}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* UNCERTAINTY / EVIDENCE LIMITATION NOTICE FOR INSUFFICIENT EVIDENCE */}
          {result.isUncertain && result.sufficiencyStatus !== 'partial' && (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-amber-950 space-y-1.5"
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>
                  {t('schemeExploration.assistant.uncertaintyTitle') ||
                    'Evidence Limitation & Uncertainty Notice'}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed break-words">
                {t('schemeExploration.assistant.uncertaintyDefaultNotice') ||
                  'The verified research dataset does not establish complete details for this specific inquiry. Please verify directly with official department portals or the MP CM Helpline (181).'}
              </p>
            </div>
          )}

          {/* GROUNDED ANSWER CARD */}
          <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50/40 to-white shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-2 border-b border-indigo-100">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {t('schemeExploration.assistant.answerTitle') || 'Grounded Answer'}
                </CardTitle>
                <span className="text-xs text-slate-500 font-mono">
                  {result.modelUsed}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-3.5 space-y-4">
              {/* ANSWER TEXT */}
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words">
                {result.answer}
              </div>

              {/* RELEVANT SCHEMES TAGS */}
              {result.relevantSchemes && result.relevantSchemes.length > 0 && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600 mr-1">
                    {t('schemeExploration.assistant.relevantSchemesTitle') ||
                      'Matched Schemes:'}
                  </span>
                  {result.relevantSchemes.map((schemeId) => (
                    <span
                      key={schemeId}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-200/70"
                    >
                      {schemeId.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RETRIEVED OFFICIAL SOURCES SECTION */}
          {result.sourceReferences && result.sourceReferences.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-700 shrink-0" />
                {t('schemeExploration.assistant.sourcesTitle') ||
                  'Retrieved Official Source Evidence'}
                <span className="text-xs font-normal text-slate-500">
                  ({result.sourceReferences.length})
                </span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.sourceReferences.map((source: CivicSourceReference, idx: number) => (
                  <div
                    key={source.sourceId || idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-2 hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 break-words line-clamp-2">
                          {source.title}
                        </span>
                        <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 shrink-0">
                          {source.sourceId}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 flex items-center gap-1 break-words">
                        <Building className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{source.issuingAuthority}</span>
                      </p>

                      {source.locator && (
                        <p className="text-[11px] text-slate-500 font-mono pt-0.5 break-words line-clamp-2">
                          <span className="font-semibold text-slate-700">
                            {t('schemeExploration.assistant.locatorLabel') || 'Locator'}:
                          </span>{' '}
                          {source.locator}
                        </p>
                      )}
                    </div>

                    {/* OFFICIAL URL LINK */}
                    {source.url && (
                      <div className="pt-2 mt-auto">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {t('schemeExploration.assistant.officialLinkText') ||
                              'Visit Official Portal'}
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACADEMIC DISCLAIMER FOOTNOTE */}
          {result.disclaimer && (
            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100 break-words">
              &bull; {result.disclaimer}
            </p>
          )}
        </div>
      )}

      {/* EMPTY INITIAL STATE */}
      {!result && !isLoading && !error && (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 sm:p-8 text-center space-y-2.5 bg-slate-50/40">
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            {t('schemeExploration.assistant.emptyTitle') ||
              'Ask Any Question About Welfare Schemes'}
          </h4>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            {t('schemeExploration.assistant.emptyDescription') ||
              'Inquire about benefits, eligibility, required documents, application procedures, and deadlines for 50 researched central and Madhya Pradesh schemes.'}
          </p>
        </div>
      )}
    </div>
  );
}

