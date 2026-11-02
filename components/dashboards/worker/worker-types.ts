export const WORKER_CATEGORY_LABELS: Record<string, { en: string; hi: string }> = {
  garbage_dump: { en: 'Garbage Dump / Open Pile', hi: 'खुला कचरा डंप / ढेर' },
  overflowing_bin: { en: 'Overflowing Waste Bin', hi: 'कचरा पेटी ओवरफ्लो' },
  drain_blockage: { en: 'Blocked Drainage / Nullah', hi: 'नाली / नाला अवरोध' },
  dead_animal: { en: 'Dead Animal Carcass Removal', hi: 'मृत पशु निस्तारण' },
  construction_debris: { en: 'Construction Debris (C&D)', hi: 'निर्माण मलबा (C&D)' },
  open_defecation: { en: 'Open Defecation Area', hi: 'खुले में शौच क्षेत्र' },
  sweeping_needed: { en: 'Street Sweeping Required', hi: 'सड़क सफाई / झाड़ू' },
  street_cleaning: { en: 'Street Sanitation & Litter', hi: 'सड़क एवं कचरा सफाई' },
  water_logging: { en: 'Water Logging & Sludge', hi: 'जलभराव एवं कीचड़' },
  sewage_overflow: { en: 'Sewage Overflow', hi: 'सीवेज ओवरफ्लो' },
  solid_waste: { en: 'Solid Waste Accumulation', hi: 'ठोस कचरा जमाव' },
  other: { en: 'General Sanitation Issue', hi: 'सामान्य स्वच्छता कार्य' },
};

export type WorkerBadgeVariant =
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'outline'
  | 'default'
  | 'secondary';

export const WORKER_STATUS_CONFIG: Record<
  string,
  { en: string; hi: string; variant: WorkerBadgeVariant }
> = {
  assigned: { en: 'Assigned', hi: 'सौंपा गया', variant: 'assigned' },
  in_progress: { en: 'In Progress', hi: 'प्रगति पर', variant: 'in_progress' },
  completed: { en: 'Completed', hi: 'पूर्ण (समीक्षाधीन)', variant: 'resolved' },
  cancelled: { en: 'Cancelled', hi: 'रद्द', variant: 'rejected' },
};

export const WORKER_PRIORITY_BADGES: Record<
  string,
  { en: string; hi: string; variant: 'destructive' | 'warning' | 'default' | 'secondary' }
> = {
  urgent: { en: 'Urgent', hi: 'अति आवश्यक', variant: 'destructive' },
  high: { en: 'High', hi: 'उच्च', variant: 'warning' },
  normal: { en: 'Normal', hi: 'सामान्य', variant: 'default' },
  low: { en: 'Low', hi: 'निम्न', variant: 'secondary' },
};

export interface WorkerPhotoPreviewState {
  url: string;
  title: string;
  subtitle?: string;
}
