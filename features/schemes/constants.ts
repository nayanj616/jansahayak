import type { GovernmentScheme, SchemeCategory } from '@/types';

export const SCHEME_CATEGORIES: {
  id: SchemeCategory;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'agriculture',
    label: 'Agriculture & Farmers',
    description: 'Crop insurance, input subsidies, irrigation, and Kisan credit support.',
    color: 'emerald',
  },
  {
    id: 'healthcare',
    label: 'Health & Medical',
    description: 'Health insurance coverage, maternity benefits, and free medical treatment.',
    color: 'rose',
  },
  {
    id: 'housing',
    label: 'Housing & Urban Development',
    description: 'Pucca houses, urban shelter, sanitation, and subsidized housing loans.',
    color: 'blue',
  },
  {
    id: 'education',
    label: 'Education & Scholarships',
    description: 'Post-matric scholarships, girl child education support, and fee waivers.',
    color: 'indigo',
  },
  {
    id: 'social_welfare',
    label: 'Social Welfare & Pensions',
    description: 'Old-age pension, widow pensions, disability support, and social security.',
    color: 'purple',
  },
  {
    id: 'employment',
    label: 'Skills & Self-Employment',
    description: 'Youth skill development, MSME loan subsidies, and livelihood schemes.',
    color: 'amber',
  },
];

export const REPRESENTATIVE_SCHEMES: GovernmentScheme[] = [
  {
    id: 'ladli-bahna',
    title: 'Mukhyamantri Ladli Bahna Yojana',
    shortDescription: 'Financial empowerment and monthly financial support for women in Madhya Pradesh.',
    category: 'social_welfare',
    stateOrCentral: 'Madhya Pradesh',
    targetAudience: 'Women aged 21-60 residing in Madhya Pradesh',
    benefitsSummary: 'Direct Benefit Transfer (DBT) of ₹1,250 per month into beneficiary bank accounts.',
    officialUrl: 'https://cmladlibahna.mp.gov.in',
  },
  {
    id: 'pm-kisan',
    title: 'PM Kisan Samman Nidhi & MP Kisan Kalyan',
    shortDescription: 'Income support for landholding farmer families across Madhya Pradesh.',
    category: 'agriculture',
    stateOrCentral: 'Madhya Pradesh',
    targetAudience: 'Small and marginal farmers holding cultivable land',
    benefitsSummary: 'Combined annual financial grant of ₹12,000 (₹6,000 Central + ₹6,000 MP State).',
    officialUrl: 'https://pmkisan.gov.in',
  },
  {
    id: 'ayushman-bharat-mp',
    title: 'Ayushman Bharat - Niramayam MP',
    shortDescription: 'Cashless secondary and tertiary healthcare coverage at empaneled hospitals.',
    category: 'healthcare',
    stateOrCentral: 'Madhya Pradesh',
    targetAudience: 'Vulnerable and low-income families identified under SECC & Sambal schemes',
    benefitsSummary: 'Cashless healthcare cover of up to ₹5,00,000 per family per annum.',
    officialUrl: 'https://ayushmanbharat.mp.gov.in',
  },
  {
    id: 'pm-awas-urban',
    title: 'Pradhan Mantri Awas Yojana (Urban) - Gwalior',
    shortDescription: 'Housing assistance for urban poor and economically weaker sections in Gwalior.',
    category: 'housing',
    stateOrCentral: 'Madhya Pradesh',
    targetAudience: 'Eligible urban homeless or kucha house residents of Gwalior Municipal area',
    benefitsSummary: 'Financial subsidy up to ₹2.5 Lakh for house construction or purchase.',
    officialUrl: 'https://pmay-urban.gov.in',
  },
  {
    id: 'sambal-yojana',
    title: 'Mukhya Mantri Jan Kalyan (Sambal 2.0) Yojana',
    shortDescription: 'Comprehensive social security cover for unorganized sector workers.',
    category: 'social_welfare',
    stateOrCentral: 'Madhya Pradesh',
    targetAudience: 'Unorganized workers registered in Madhya Pradesh',
    benefitsSummary: 'Accident insurance, maternity assistance, education support, and funeral grants.',
    officialUrl: 'https://sambal.mp.gov.in',
  },
];

