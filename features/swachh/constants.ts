import type { ComplaintCategory, GwaliorWard } from '@/types';

export const COMPLAINT_CATEGORIES: {
  id: ComplaintCategory;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'garbage_dump',
    label: 'Open Garbage Dump',
    description: 'Accumulation of uncollected waste or illegal roadside dumping.',
    color: 'amber',
  },
  {
    id: 'overflowing_bin',
    label: 'Overflowing Dustbin',
    description: 'Public community waste bin filled beyond capacity.',
    color: 'blue',
  },
  {
    id: 'drain_blockage',
    label: 'Blocked Drain / Nala',
    description: 'Choked storm drain or roadside drainage causing stagnant water.',
    color: 'red',
  },
  {
    id: 'dead_animal',
    label: 'Dead Animal Carcass',
    description: 'Urgent removal required for public hygiene and health.',
    color: 'rose',
  },
  {
    id: 'construction_debris',
    label: 'Construction Debris (C&D)',
    description: 'Dumping of building rubble, cement, or bricks blocking roads.',
    color: 'orange',
  },
  {
    id: 'sweeping_needed',
    label: 'Street Sweeping Required',
    description: 'Heavy litter or un-swept public thoroughfare.',
    color: 'emerald',
  },
  {
    id: 'other',
    label: 'Other Sanitation Issue',
    description: 'General municipal sanitation and cleanliness issue.',
    color: 'slate',
  },
];

// Representative Gwalior Municipal Corporation Administrative Wards
export const GWALIOR_REPRESENTATIVE_WARDS: GwaliorWard[] = [
  {
    wardNumber: 1,
    wardName: 'Hazira & Resham Mill',
    zone: 'Gwalior Fort Zone',
    supervisorName: 'R. K. Sharma',
    supervisorContact: '+91 751-2400101',
    latitude: 26.2332,
    longitude: 78.1812,
  },
  {
    wardNumber: 12,
    wardName: 'Morar Cantt & Station Road',
    zone: 'Morar Zone',
    supervisorName: 'V. S. Chauhan',
    supervisorContact: '+91 751-2400112',
    latitude: 26.2255,
    longitude: 78.2289,
  },
  {
    wardNumber: 24,
    wardName: 'Maharaj Bada & Sarafa Bazar',
    zone: 'Lashkar Zone',
    supervisorName: 'A. K. Verma',
    supervisorContact: '+91 751-2400124',
    latitude: 26.2081,
    longitude: 78.1636,
  },
  {
    wardNumber: 35,
    wardName: 'Thatipur & Balwant Nagar',
    zone: 'Thatipur Zone',
    supervisorName: 'D. N. Tomar',
    supervisorContact: '+91 751-2400135',
    latitude: 26.2198,
    longitude: 78.2045,
  },
  {
    wardNumber: 48,
    wardName: 'City Center & University Road',
    zone: 'Lashkar East Zone',
    supervisorName: 'P. K. Mishra',
    supervisorContact: '+91 751-2400148',
    latitude: 26.2052,
    longitude: 78.1923,
  },
  {
    wardNumber: 66,
    wardName: 'Gwalior Fort & Tansen Nagar',
    zone: 'Heritage Zone',
    supervisorName: 'M. S. Kushwah',
    supervisorContact: '+91 751-2400166',
    latitude: 26.2307,
    longitude: 78.1691,
  },
];

