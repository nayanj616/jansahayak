export interface GrievanceChannel {
  id: string;
  name: string;
  authority: string;
  scope: string;
  contact: string;
  portalUrl: string;
  turnaroundDays: string;
}

export const GRIEVANCE_CHANNELS: GrievanceChannel[] = [
  {
    id: 'cm-helpline',
    name: 'CM Helpline 181 (Madhya Pradesh)',
    authority: 'Government of Madhya Pradesh',
    scope: 'State-wide citizen grievance redressal across all government departments.',
    contact: 'Toll-free 181',
    portalUrl: 'https://cmhelpline.mp.gov.in',
    turnaroundDays: '7 - 14 Days',
  },
  {
    id: 'gmc-callcenter',
    name: 'Gwalior Municipal Corporation Helpline',
    authority: 'Nagar Nigam Gwalior',
    scope: 'Civic sanitation, solid waste, water supply, sewage, and streetlight complaints.',
    contact: '0751-2438300 / 1800-233-1314',
    portalUrl: 'https://mpenagarpalika.gov.in',
    turnaroundDays: '2 - 5 Days',
  },
  {
    id: 'mp-pgms',
    name: 'MP Public Grievance Redressal Portal',
    authority: 'Department of Public Grievances, MP',
    scope: 'Formal escalations, administrative delays, and appeals.',
    contact: 'pgms@mp.gov.in',
    portalUrl: 'https://pgms.mp.gov.in',
    turnaroundDays: '15 - 30 Days',
  },
];

