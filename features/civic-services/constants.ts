import type { CivicService } from '@/types';

export const CIVIC_SERVICES_DIRECTORY: CivicService[] = [
  {
    id: 'birth-death-cert',
    name: 'Birth & Death Certificate',
    department: 'Gwalior Municipal Corporation - Health Branch',
    category: 'Vital Records',
    description: 'Apply for official issuance or copy of birth and death certificates.',
    estimatedDays: '7 Working Days',
    portalUrl: 'https://mpenagarpalika.gov.in',
  },
  {
    id: 'property-tax',
    name: 'Property Tax Assessment & Payment',
    department: 'Gwalior Municipal Corporation - Revenue Department',
    category: 'Taxation & Revenue',
    description: 'Self-assessment, calculation, and online payment of urban property tax.',
    estimatedDays: 'Instant Online',
    portalUrl: 'https://mpenagarpalika.gov.in',
  },
  {
    id: 'water-connection',
    name: 'New Water Supply Connection',
    department: 'Public Health Engineering (PHE) & Municipal Water Works',
    category: 'Utilities',
    description: 'Apply for residential or commercial domestic piped water connection.',
    estimatedDays: '15 Working Days',
    portalUrl: 'https://mpenagarpalika.gov.in',
  },
  {
    id: 'trade-license',
    name: 'Municipal Trade & Commercial License',
    department: 'GMC License Department',
    category: 'Business & Commerce',
    description: 'Issuance and renewal of business establishment licenses within Gwalior.',
    estimatedDays: '10 Working Days',
    portalUrl: 'https://mpenagarpalika.gov.in',
  },
  {
    id: 'street-light-repair',
    name: 'Street Light & Electrical Maintenance',
    department: 'GMC Electrical Department',
    category: 'Public Infrastructure',
    description: 'Report non-functioning streetlights or electrical hazards in public areas.',
    estimatedDays: '48 Hours',
    portalUrl: 'https://mpenagarpalika.gov.in',
  },
];

