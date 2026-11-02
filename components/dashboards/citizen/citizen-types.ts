export interface CitizenCategoryOption {
  id: string;
  label: string;
  labelHi: string;
  desc: string;
  descHi: string;
}

export const CATEGORY_OPTIONS: CitizenCategoryOption[] = [
  {
    id: 'garbage_dump',
    label: 'Open Garbage Dump',
    labelHi: 'खुला कचरा डंप',
    desc: 'Accumulation of uncollected waste or roadside pile',
    descHi: 'सड़क किनारे या खाली जगह पर जमा कचरा',
  },
  {
    id: 'overflowing_bin',
    label: 'Overflowing Dustbin',
    labelHi: 'कचरा पेटी ओवरफ्लो',
    desc: 'Public community waste bin filled beyond capacity',
    descHi: 'सार्वजनिक कचरा पेटी पूरी भरी हुई',
  },
  {
    id: 'drain_blockage',
    label: 'Blocked Drain / Nala',
    labelHi: 'नाली / नाला अवरोध',
    desc: 'Choked storm drain causing water stagnation',
    descHi: 'नाली बंद होने से गंदा पानी रुकना',
  },
  {
    id: 'dead_animal',
    label: 'Dead Animal Carcass',
    labelHi: 'मृत पशु निस्तारण',
    desc: 'Urgent removal required for public hygiene',
    descHi: 'सार्वजनिक स्वच्छता हेतु त्वरित हटाना आवश्यक',
  },
  {
    id: 'construction_debris',
    label: 'Construction Debris (C&D)',
    labelHi: 'निर्माण मलबा (C&D)',
    desc: 'Dumping of building rubble, cement, or bricks',
    descHi: 'भवन निर्माण सामग्री, ईंट या सीमेंट का मलबा',
  },
  {
    id: 'sweeping_needed',
    label: 'Street Sweeping Required',
    labelHi: 'सड़क सफाई की आवश्यकता',
    desc: 'Heavy litter or un-swept public thoroughfare',
    descHi: 'सड़क पर झाड़ू लगाने एवं सफाई की आवश्यकता',
  },
  {
    id: 'water_logging',
    label: 'Water Logging',
    labelHi: 'जलभराव / कीचड़',
    desc: 'Roadside water logging or drainage overflow',
    descHi: 'सड़क पर जलभराव या गंदे पानी का ठहराव',
  },
  {
    id: 'sewage_overflow',
    label: 'Sewage Overflow',
    labelHi: 'सीवेज ओवरफ्लो',
    desc: 'Manhole or sewage pipe overflow',
    descHi: 'सीवर लाइन या मैनहोल से गंदा पानी बहना',
  },
  {
    id: 'other',
    label: 'Other Sanitation Issue',
    labelHi: 'अन्य स्वच्छता समस्या',
    desc: 'General municipal sanitation and cleanliness issue',
    descHi: 'सामान्य नगर निगम स्वच्छता संबंधी समस्या',
  },
];

export type CitizenBadgeVariant =
  | 'submitted'
  | 'assigned'
  | 'in_progress'
  | 'under_review'
  | 'rework_required'
  | 'resolved'
  | 'rejected'
  | 'outline'
  | 'default'
  | 'secondary';

export const STATUS_LABELS: Record<string, { en: string; hi: string; variant: CitizenBadgeVariant }> = {
  submitted: { en: 'Submitted', hi: 'दर्ज हुई', variant: 'submitted' },
  assigned: { en: 'Worker Assigned', hi: 'सफाईकर्मी नियुक्त', variant: 'assigned' },
  in_progress: { en: 'In Progress', hi: 'प्रगति पर', variant: 'in_progress' },
  under_review: { en: 'Under Review', hi: 'समीक्षाधीन', variant: 'under_review' },
  rework_required: { en: 'Rework Required', hi: 'पुनः सफाई अपेक्षित', variant: 'rework_required' },
  resolved: { en: 'Resolved', hi: 'निस्तारित', variant: 'resolved' },
  rejected: { en: 'Rejected', hi: 'अस्वीकृत', variant: 'rejected' },
};
