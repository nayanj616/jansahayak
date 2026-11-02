import type { VisionVerificationMetrics } from '@/types';

export const CATEGORY_LABELS: Record<string, string> = {
  garbage_dump: 'Garbage Dump / Open Pile',
  overflowing_bin: 'Overflowing Waste Bin',
  drain_blockage: 'Blocked Drainage / Nullah',
  dead_animal: 'Dead Animal Carcass',
  construction_debris: 'Construction Debris (C&D)',
  open_defecation: 'Open Defecation Area',
  sweeping_needed: 'Street Sweeping Required',
  street_cleaning: 'Street Sanitation & Litter',
  water_logging: 'Water Logging & Sludge',
  sewage_overflow: 'Sewage Overflow',
  solid_waste: 'Solid Waste Accumulation',
  other: 'General Sanitation Issue',
};

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'outline'
      | 'success'
      | 'warning'
      | 'destructive'
      | 'purple'
      | 'civic'
      | 'submitted'
      | 'assigned'
      | 'in_progress'
      | 'under_review'
      | 'resolved'
      | 'rework_required'
      | 'rejected';
  }
> = {
  submitted: { label: 'New / Unassigned', variant: 'submitted' },
  assigned: { label: 'Assigned', variant: 'assigned' },
  in_progress: { label: 'In Progress', variant: 'in_progress' },
  under_review: { label: 'Needs Review', variant: 'under_review' },
  rework_required: { label: 'Rework Required', variant: 'rework_required' },
  resolved: { label: 'Resolved', variant: 'resolved' },
  rejected: { label: 'Rejected', variant: 'rejected' },
};

export const PRIORITY_BADGES: Record<
  string,
  'default' | 'secondary' | 'warning' | 'destructive'
> = {
  low: 'secondary',
  normal: 'default',
  high: 'warning',
  urgent: 'destructive',
};

export interface PhotoPreviewState {
  url: string;
  title: string;
  subtitle?: string;
}

export interface OfficerNotificationState {
  type: 'success' | 'error';
  message: string;
}

export interface Worker {
  id: string;
  display_name: string;
  ward_id?: string | null;
}

export type { VisionVerificationMetrics };

