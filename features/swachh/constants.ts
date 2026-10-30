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

/**
 * DEMONSTRATION GEOGRAPHIC SECTORS
 *
 * IMPORTANT ACADEMIC DEMARCATION:
 * The coordinates and sector boundaries below are demonstration approximations
 * representing general geographic sectors across Gwalior for academic prototyping.
 * They do NOT represent verified official municipal ward boundaries or official
 * employee rosters of the Gwalior Municipal Corporation (GMC).
 * Verified GIS shapefiles and official administrative wards will be integrated in Phase 2.
 */
export const GWALIOR_REPRESENTATIVE_WARDS: GwaliorWard[] = [
  {
    wardNumber: 1,
    wardName: 'Hazira Area (Demonstration Zone 1)',
    zone: 'Gwalior Fort Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2332,
    longitude: 78.1812,
  },
  {
    wardNumber: 12,
    wardName: 'Morar Area (Demonstration Zone 12)',
    zone: 'Morar Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2255,
    longitude: 78.2289,
  },
  {
    wardNumber: 24,
    wardName: 'Maharaj Bada Area (Demonstration Zone 24)',
    zone: 'Lashkar Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2081,
    longitude: 78.1636,
  },
  {
    wardNumber: 35,
    wardName: 'Thatipur Area (Demonstration Zone 35)',
    zone: 'Thatipur Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2198,
    longitude: 78.2045,
  },
  {
    wardNumber: 48,
    wardName: 'City Center Area (Demonstration Zone 48)',
    zone: 'Lashkar East Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2052,
    longitude: 78.1923,
  },
  {
    wardNumber: 66,
    wardName: 'Gwalior Fort Area (Demonstration Zone 66)',
    zone: 'Heritage Sector (Demo)',
    supervisorName: 'Demonstration Supervisor (Unverified)',
    supervisorContact: 'GMC Central Helpline: 0751-2438300',
    latitude: 26.2307,
    longitude: 78.1691,
  },
];
