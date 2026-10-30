'use client';

import * as React from 'react';
import {
  Search,
  Bot,
  FileQuestion,
  Building2,
  Info,
  Sparkles,
  ExternalLink,
  Phone,
  Clock,
} from 'lucide-react';
import { PublicHeader } from '@/components/layout/public-header';
import { PublicFooter } from '@/components/layout/public-footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  SCHEME_CATEGORIES,
  REPRESENTATIVE_SCHEMES,
} from '@/features/schemes/constants';
import { CIVIC_SERVICES_DIRECTORY } from '@/features/civic-services/constants';
import { GRIEVANCE_CHANNELS } from '@/features/grievances/constants';
import type { SchemeCategory } from '@/types';

export default function SchemeExplorationPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<SchemeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [assistantModalOpen, setAssistantModalOpen] = React.useState(false);
  const [assistantInput, setAssistantInput] = React.useState('');

  const filteredSchemes = REPRESENTATIVE_SCHEMES.filter((scheme) => {
    const matchesCategory =
      selectedCategory === 'all' || scheme.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      scheme.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 text-slate-900">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Title Section matching visual reference image */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Scheme Exploration
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Discover government schemes, get eligibility guidance and access civic services.
            </p>
          </div>

          {/* 2x2 PROMINENT ENTRY CARDS matching visual reference image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Scheme Finder (Purple) */}
            <div className="rounded-2xl border border-purple-200 bg-white p-7 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 mb-4">
                  <Search className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Scheme Finder</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Search and explore government schemes across different categories.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#scheme-catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                >
                  Explore Schemes &rarr;
                </a>
              </div>
            </div>

            {/* Card 2: AI Civic Assistant (Blue) */}
            <div className="rounded-2xl border border-blue-200 bg-white p-7 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Bot className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                    <Sparkles className="h-2.5 w-2.5" />
                    Gemini AI
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">AI Civic Assistant</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Get answers to your questions about schemes and civic services.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssistantModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors cursor-pointer"
                >
                  Ask a Question &rarr;
                </button>
              </div>
            </div>

            {/* Card 3: Grievance Assistance (Green) */}
            <div className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
                  <FileQuestion className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Grievance Assistance</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Understand the grievance process and get guidance on filing complaints.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#grievances-section"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  Get Help &rarr;
                </a>
              </div>
            </div>

            {/* Card 4: Civic Services (Orange) */}
            <div className="rounded-2xl border border-amber-200 bg-white p-7 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Civic Services</h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Access important civic services and department information.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <a
                  href="#civic-services-section"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  View Services &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* INFORMATIONAL BANNER matching visual reference image */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-3 shadow-2xs">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Information is based on publicly available government sources. Please refer to
              official government websites for the latest details.
            </div>
          </div>

          {/* SCHEME CATALOG BROWSER */}
          <section id="scheme-catalog" className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Representative Scheme Catalog</h3>
                <p className="text-xs text-slate-500">
                  Madhya Pradesh welfare and empowerment initiatives
                </p>
              </div>

              {/* Search bar */}
              <div className="w-full sm:w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search schemes..."
                    className="pl-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {SCHEME_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Scheme Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchemes.map((scheme) => (
                <Card key={scheme.id} className="hover:border-slate-300 transition-all">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-snug">
                        {scheme.title}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {scheme.stateOrCentral}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs pt-1">
                      {scheme.shortDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 text-xs space-y-2">
                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-1">
                      <p className="font-semibold text-slate-700">Target Beneficiaries:</p>
                      <p className="text-slate-600">{scheme.targetAudience}</p>
                      <p className="font-semibold text-slate-700 pt-1">Key Benefit:</p>
                      <p className="text-slate-600">{scheme.benefitsSummary}</p>
                    </div>
                    {scheme.officialUrl && (
                      <div className="pt-1">
                        <a
                          href={scheme.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline"
                        >
                          Official Portal
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* GRIEVANCE ASSISTANCE SECTION */}
          <section id="grievances-section" className="pt-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Grievance Assistance Channels</h3>
              <p className="text-xs text-slate-500">
                Official grievance redressal mechanisms for Madhya Pradesh residents
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GRIEVANCE_CHANNELS.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-sm font-bold">{item.name}</CardTitle>
                    <CardDescription className="text-xs">{item.authority}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 text-xs space-y-2">
                    <p className="text-slate-600">{item.scope}</p>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-emerald-900 space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold">
                        <Phone className="h-3.5 w-3.5 text-emerald-700" />
                        <span>Contact: {item.contact}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700">
                        <Clock className="h-3 w-3" />
                        <span>SLA: {item.turnaroundDays}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CIVIC SERVICES DIRECTORY */}
          <section id="civic-services-section" className="pt-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Civic Services Directory</h3>
              <p className="text-xs text-slate-500">
                Gwalior Municipal Corporation e-NagarPalika portals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CIVIC_SERVICES_DIRECTORY.map((service) => (
                <Card key={service.id}>
                  <CardHeader className="p-5 pb-2">
                    <Badge variant="outline" className="w-fit text-[10px] mb-1">
                      {service.category}
                    </Badge>
                    <CardTitle className="text-sm font-bold">{service.name}</CardTitle>
                    <CardDescription className="text-xs">{service.department}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 text-xs space-y-2">
                    <p className="text-slate-600">{service.description}</p>
                    <p className="text-[11px] text-slate-400">
                      Processing Time: <strong>{service.estimatedDays}</strong>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* AI Civic Assistant Modal Dialog (Phase 1 Placeholder) */}
        {assistantModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">AI Civic Assistant</h3>
                    <p className="text-[11px] text-slate-400">Phase 1 Integration Scaffolding</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssistantModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-900 space-y-1">
                  <p className="font-semibold">Phase 1 Gemini Service Preparation:</p>
                  <p>
                    Per the Phase 1 specification exclusions, live Gemini conversational model calls
                    and fake AI generation are not executed in this phase.
                  </p>
                  <p>
                    The server-only service handler in <code>lib/gemini/service.ts</code> is ready to
                    bind to the Google Gemini API in Phase 2.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-800">
                    Sample Citizen Inquiry Preview:
                  </label>
                  <Input
                    placeholder="e.g. Am I eligible for Mukhyamantri Ladli Bahna Yojana in Gwalior?"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button size="sm" onClick={() => setAssistantModalOpen(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
