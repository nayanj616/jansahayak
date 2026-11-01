/**
 * JanSahayak Scheme Exploration Domain Types
 * Based on the researched 50-scheme standalone government dataset
 */

export type SchemeLevel = 'central' | 'state' | 'central_state';

export interface EvidenceRef {
  scheme_id: string;
  field: string;
  source_id: string;
  evidence_summary: string;
  locator: string;
  source_authority: string;
  source_type: string;
  url: string;
}

export interface GeneratedStatement {
  text: string;
  language: 'en' | 'hi';
  content_origin: string;
  fact_fields: string[];
  evidence_refs: EvidenceRef[];
}

export interface SchemeContentSections {
  short_summary?: GeneratedStatement[];
  detailed_description?: GeneratedStatement[];
  who_may_benefit?: GeneratedStatement[];
  key_benefits?: GeneratedStatement[];
  eligibility_summary?: GeneratedStatement[];
  application_documents?: GeneratedStatement[];
  application_summary?: GeneratedStatement[];
  application_timing?: GeneratedStatement[];
  selection_and_processing?: GeneratedStatement[];
  important_conditions?: GeneratedStatement[];
  status_guidance?: GeneratedStatement[];
}

export interface CitizenContentRecord {
  scheme_id: string;
  official_name: string;
  short_name: string;
  content_origin: string;
  content_en?: SchemeContentSections;
  content_hi?: SchemeContentSections;
  unknown_information: string[];
}

export interface SchemeRecord {
  scheme_id: string;
  official_name: string;
  short_name: string;
  aliases: string[];
  category: string;
  description: string;
  objectives: string | string[];
  scheme_level: SchemeLevel;
  jurisdiction: string;
  ministry: string | null;
  department: string | null;
  implementing_agency: string | null;
  benefit_type: string[];
  benefits: string | string[];
  benefit_amount: string | null;
  benefit_frequency: string | null;
  coverage: string | null;
  duration: string | null;
  beneficiary_groups: string[];
  age_min: number | null;
  age_max: number | null;
  gender_eligibility: string | null;
  income_limit: string | number | null;
  social_categories: string[] | null;
  residency_requirement: string | null;
  bpl_required: boolean | null;
  disability_eligibility: boolean | string | null;
  occupation_or_profession: string | string[] | null;
  education_criteria: string | null;
  other_eligibility_conditions: string[] | null;
  exclusions: string[] | null;
  mandatory_documents: string[];
  conditional_documents: string[];
  document_notes: string | null;
  application_mode: string[];
  application_steps: string[];
  application_portal: string | null;
  registration_process: string | null;
  application_fee: string | null;
  application_period: string | null;
  renewal_process: string | null;
  deadlines: string | null;
  selection_process: string | null;
  processing_time: string | null;
  terms_and_conditions: string[] | null;
  common_rejection_reasons: string[] | null;
  how_to_check_status: string | null;
  related_civic_service_ids: string[];
  grievance_channel_ids: string[];
  related_scheme_ids: string[];
  assistant_keywords: string[];
  sources: string[];
  research_notes: string | null;
  source_authorities: string[];
  research_date: string;
  evidence_by_field?: Record<
    string,
    { source_id: string; evidence_summary: string; locator: string }
  >;
}

export interface SourceRecord {
  source_id: string;
  title: string;
  issuing_authority: string;
  url: string;
  source_type: string;
  checked_date: string;
  scope_note: string | null;
}

export interface SchemeFAQ {
  faq_id: string;
  scheme_id: string;
  language: string;
  question: string;
  question_hi: string | null;
  answer: string | null;
  answer_hi: string | null;
  answer_status: string;
  unknown_reason: string | null;
  evidence_refs: EvidenceRef[];
  content_origin: string;
  answer_hi_status?: string;
  answer_hi_reason?: string | null;
  answer_hi_evidence_refs?: EvidenceRef[];
}

export interface SearchTermsItem {
  scheme_id: string;
  official_name: string;
  aliases: string[];
  search_terms: string[];
  term_role: string;
  languages: string[];
}

export interface CivicServiceItem {
  service_id: string;
  name: string;
  department: string;
  service_category: string;
  description: string;
  estimated_sla_days: string;
  online_route: string;
  portal_type: string;
}

export interface SchemeServiceLink {
  scheme_id: string;
  service_id: string;
  relationship_type: string;
  notes: string;
}

export interface GrievanceChannelItem {
  channel_id: string;
  name: string;
  issuing_authority: string;
  helpline_number: string;
  channel_scope: string;
  operational_sla: string;
  portal_url: string;
}

export interface SchemeGrievanceLink {
  scheme_id: string;
  channel_id: string;
  escalation_level: string;
  redressal_scope: string;
}

// ============================================================================
// ELIGIBILITY EVALUATION INTERFACES (3-State Rule Based)
// ============================================================================

export type EligibilityStatus = 'meets' | 'does_not_meet' | 'cannot_determine';

export interface CriterionEvaluation {
  status: EligibilityStatus;
  criterion: string;
  userValue: string | number | boolean | null;
  schemeValue: string | number | boolean | null;
  reasonEn: string;
  reasonHi: string;
}

export interface SchemeEligibilityEvaluation {
  schemeId: string;
  overallStatus: EligibilityStatus;
  criteria: Record<string, CriterionEvaluation>;
  meetsCount: number;
  doesNotMeetCount: number;
  cannotDetermineCount: number;
}

export interface UserEligibilityProfile {
  age?: number | null;
  gender?: 'women' | 'men' | 'all' | null;
  annualIncome?: number | null;
  isBpl?: boolean | null;
  hasDisability?: boolean | null;
  socialCategory?: 'SC' | 'ST' | 'OBC' | 'General' | 'EWS' | null;
}

