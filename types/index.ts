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

// AI Service Types (Preparation)
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

export interface CivicAnswerResult {
  answer: string;
  sources: string[];
  relevantSchemes: string[];
  departmentContact?: string;
  disclaimer: string;
  modelUsed: string;
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
