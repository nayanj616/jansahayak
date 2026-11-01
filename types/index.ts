/**
 * JanSahayak Core TypeScript Definitions
 */

export * from './database';

export type DemoRole = 'citizen' | 'worker' | 'officer';

export interface DemoSessionUser {
  role: DemoRole;
  name: string;
  email: string;
  designation: string;
  ward?: string;
  zone?: string;
  avatarInitials: string;
  dbUserId?: string;
}

export interface DemoSessionPayload {
  user: DemoSessionUser;
  issuedAt: number;
  expiresAt: number;
}

export interface GwaliorWard {
  wardNumber: number;
  wardName: string;
  zone: string;
  supervisorName: string;
  supervisorContact: string;
  latitude: number;
  longitude: number;
}

export interface ComplaintSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  wardNumber: number;
  address: string;
  landmark?: string;
  reportedAt: string;
  assignedWorkerName?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  aiVerificationScore?: number;
  aiConfidencePercent?: number;
}

// AI Vision Verification Types (Phase 4B.2 - Observational Contract)
export type VisionConfidenceLevel =
  | 'high'
  | 'medium'
  | 'low'
  | 'inconclusive';

export interface VisionVerificationMetrics {
  beforeObservations: {
    wasteIdentified: string[];
    approximateSpread: string;
    obstructionsOrHazards: string[];
  };

  afterObservations: {
    visibleSurfaces: string[];
    remainingDebris: string[];
    cleanlinessApparent: boolean | null;
  };

  comparativeFindings: {
    primaryWasteRemoved: boolean | null;
    siteConsistent: boolean | null;
    changesObserved: string[];
  };

  comparisonLimitations: {
    angleMismatched: boolean;
    lightingMismatched: boolean;
    occlusionPresent: boolean;
    limitationNotes: string[];
  };

  evaluation: {
    confidenceLevel: VisionConfidenceLevel;
    isComparisonReliable: boolean;
    wasteReductionEstimate: number | null;
    estimateRationale: string | null;
  };

  officerSummary: string;
  disclaimer: string;
}

export interface AnalyzeCleanlinessResult {
  metrics: VisionVerificationMetrics;
  modelVersion: string;
  modelName: string;
  processedAt: string;
}

/**
 * @deprecated Legacy AI recommendation contract from Phase 4B foundation.
 * Superseded in Phase 4B.2 by `VisionVerificationMetrics` (observational evidence only).
 * AI must never make authoritative resolution recommendations.
 */
export interface CleanlinessAnalysisResult {
  isCleaned: boolean;
  confidenceScore: number; // 0 to 1
  cleanlinessScoreBefore: number; // 0 to 10
  cleanlinessScoreAfter: number; // 0 to 10
  observations: string[];
  recommendation: 'approve' | 'manual_review' | 'rework';
  processedAt: string;
  modelUsed: string;
  rawResponse?: Record<string, unknown>;
  errorMessage?: string;
}

export interface CivicSourceReference {
  sourceId: string;
  title: string;
  issuingAuthority: string;
  url?: string;
  locator?: string;
  sourceType?: string;
  evidenceSummary?: string;
}

export interface CivicAnswerResult {
  answer: string;
  sources: string[];
  sourceReferences?: CivicSourceReference[];
  relevantSchemes: string[];
  departmentContact?: string;
  disclaimer: string;
  modelUsed: string;
  isUncertain?: boolean;
  sufficiencyStatus?: 'sufficient' | 'partial' | 'insufficient';
  supportedTopics?: string[];
  unsupportedTopics?: string[];
  unestablishedFields?: string[];
}

// Scheme Domain Types
export type SchemeCategory =
  | 'agriculture'
  | 'healthcare'
  | 'housing'
  | 'education'
  | 'social_welfare'
  | 'employment';

export interface GovernmentScheme {
  id: string;
  title: string;
  shortDescription: string;
  category: SchemeCategory;
  stateOrCentral: 'Madhya Pradesh' | 'Central' | 'Municipal';
  targetAudience: string;
  benefitsSummary: string;
  officialUrl?: string;
}

export interface CivicService {
  id: string;
  name: string;
  department: string;
  category: string;
  description: string;
  estimatedDays: string;
  portalUrl?: string;
}

// Researched 50-Scheme Domain Types
export * from './schemes';
