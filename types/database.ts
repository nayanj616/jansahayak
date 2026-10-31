/**
 * JanSahayak Live Database TypeScript Models
 * Mapped to the 8 existing Supabase PostgreSQL tables.
 */

// Core Enums & Literal Types matching live database constraints
export type ComplaintStatus =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'under_review'
  | 'rework_required'
  | 'resolved'
  | 'rejected';

export type ComplaintPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ComplaintCategory =
  | 'garbage_dump'
  | 'overflowing_bin'
  | 'drain_blockage'
  | 'dead_animal'
  | 'construction_debris'
  | 'open_defecation'
  | 'sweeping_needed'
  | 'street_cleaning'
  | 'water_logging'
  | 'sewage_overflow'
  | 'solid_waste'
  | 'other';

export type ImageType =
  | 'before'
  | 'after'
  | 'annotated'
  | 'comparison'
  | 'original';

export type StorageBucket =
  | 'complaint-originals'
  | 'cleanup-evidence'
  | 'ai-annotated'
  | 'verification-comparisons';

export type AssignmentStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type AiProcessingStatus = 'pending' | 'completed' | 'failed';

export type HumanReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'rework_required';

export type DemoUserRole = 'citizen' | 'worker' | 'officer';

// 1. wards Table Record
export interface WardRecord {
  ward_id: string; // PK: e.g. 'GWL-W-001'
  ward_no: number; // 1 to 66
  ward_name: string;
  ward_name_original: string;
  lgd_code: string | null;
  city: string;
  state: string;
  country: string;
  ulb_name: string;
  ulb_lgd_code: string | null;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: Record<string, unknown> | null;
  boundary_status: string;
  center_source: string | null;
  councillor_name: string | null;
  supervisor_name: string | null;
  sanitary_inspector_name: string | null;
  sanitation_zone: string | null;
  is_active: boolean;
  verification_status: string;
  source_name: string | null;
  source_url: string | null;
  source_updated_at: string | null;
  last_verified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 2. demo_users Table Record
export interface DemoUserRecord {
  id: string; // PK: UUID
  display_name: string;
  role: DemoUserRole;
  ward_id: string | null; // FK -> wards.ward_id
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 3. complaints Table Record
export interface ComplaintRecord {
  id: string; // PK: UUID
  complaint_code: string; // Unique: e.g. 'GWL-2026-0001'
  reporter_id: string | null; // FK -> demo_users.id
  ward_id: string | null; // FK -> wards.ward_id
  category: ComplaintCategory | string;
  description: string | null;
  priority: ComplaintPriority;
  location_description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy_m: number | null;
  location_source: string | null;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
}

// 4. complaint_images Table Record
export interface ComplaintImageRecord {
  id: string; // PK: UUID
  complaint_id: string; // FK -> complaints.id
  image_type: ImageType;
  bucket_name: StorageBucket;
  object_path: string;
  content_type: string | null;
  file_size_bytes: number | null;
  uploaded_by: string | null; // FK -> demo_users.id
  created_at: string;
  signed_url?: string;
}

// 5. assignments Table Record
export interface AssignmentRecord {
  id: string; // PK: UUID
  complaint_id: string; // FK -> complaints.id
  worker_id: string; // FK -> demo_users.id
  assigned_by: string | null; // FK -> demo_users.id
  status: AssignmentStatus;
  assigned_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

// 6. complaint_history Table Record
export interface ComplaintHistoryRecord {
  id: string; // PK: UUID
  complaint_id: string; // FK -> complaints.id
  actor_id: string | null; // FK -> demo_users.id
  old_status: string | null;
  new_status: string | null;
  action: string;
  remarks: string | null;
  created_at: string;
}

// 7. ai_verifications Table Record
export interface AiVerificationRecord {
  id: string; // PK: UUID
  complaint_id: string; // FK -> complaints.id
  before_image_id: string | null; // FK -> complaint_images.id
  after_image_id: string | null; // FK -> complaint_images.id
  processing_status: AiProcessingStatus;
  model_name: string | null;
  model_version: string | null;
  metrics: Record<string, unknown> | null;
  waste_reduction_percentage: number | null;
  processing_error: string | null;
  processed_at: string | null;
  human_review_status: HumanReviewStatus;
  reviewed_by: string | null; // FK -> demo_users.id
  review_remarks: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// 8. notifications Table Record
export interface NotificationRecord {
  id: string; // PK: UUID
  recipient_id: string; // FK -> demo_users.id
  complaint_id: string | null; // FK -> complaints.id
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

// Composite Joined Types for Application Views
export interface ComplaintWithDetails extends ComplaintRecord {
  ward?: WardRecord | null;
  reporter?: DemoUserRecord | null;
  images?: ComplaintImageRecord[];
  /**
   * Current active assignment ('in_progress' or 'assigned') or the most recent historical assignment.
   * Null if the complaint has never been assigned.
   */
  current_or_latest_assignment?: (AssignmentRecord & { worker?: DemoUserRecord | null }) | null;
  /**
   * @deprecated Backward-compatible alias for `current_or_latest_assignment`.
   */
  active_assignment?: (AssignmentRecord & { worker?: DemoUserRecord | null }) | null;
  ai_verification?: AiVerificationRecord | null;
  history?: ComplaintHistoryRecord[];
}

export interface AssignmentWithDetails extends AssignmentRecord {
  complaint?: ComplaintWithDetails | null;
  worker?: DemoUserRecord | null;
  assigned_by_user?: DemoUserRecord | null;
}

