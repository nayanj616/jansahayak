import type { TranslationDictionary } from '../types';

export const enDictionary: TranslationDictionary = {
  common: {
    language: 'Language',
    english: 'English',
    hindi: 'हिन्दी',
    gwaliorMadhyaPradesh: 'Gwalior, Madhya Pradesh',
    appName: 'JanSahayak',
    appTagline: 'Civic Grievance Redressal & Scheme Discovery Platform',
    academicDemarcation: 'Academic Demonstration Prototype',
    academicDisclaimer:
      'JanSahayak is an academic demonstration developed for Gwalior, MP. It does not replace official government channels or portals.',
    officialPortalNotice:
      'Information is curated from publicly accessible official government registries. Refer to official portals for formal submissions.',
    viewDetails: 'View Details',
    explore: 'Explore',
    contact: 'Contact',
    status: 'Status',
    phaseTarget: 'Target Phase',
    learnMore: 'Learn More',
    close: 'Close',
    underImplementation: 'Under Implementation',
    searchPlaceholder: 'Search schemes, services, or topics...',
    allCategories: 'All Categories',
    noTranslationIndicator: '(No Hindi translation available)',
  },
  nav: {
    home: 'Home',
    swachhGwalior: 'Swachh Gwalior',
    schemeExploration: 'Scheme Exploration',
    about: 'About',
    demoRoles: 'Demo Roles',
    selectDemoRole: 'Select Demo Role',
    welcomeCitizen: 'Welcome, Citizen',
    welcomeWorker: 'Welcome, Worker',
    welcomeOfficer: 'Welcome, Officer',
  },
  schemeExploration: {
    pageTitle: 'Scheme Exploration',
    pageSubtitle:
      'Discover government welfare schemes, navigate civic services, and access grievance redressal channels for Gwalior and Madhya Pradesh.',
    sectionTitle: 'Scheme & Civic Support',
    sectionDescription:
      'Explore researched welfare schemes, civic municipal services, grievance escalation routes, and official source documentation across five structured sections.',
    tabs: {
      finder: 'Scheme Finder',
      assistant: 'Civic Assistant',
      grievances: 'Grievances',
      services: 'Civic Services',
      verification: 'Verification & Sources',
    },
    tabDescriptions: {
      finder: 'Search and explore 50 researched central and Madhya Pradesh government welfare schemes.',
      assistant: 'Conversational RAG assistant grounded in official scheme guidelines (Phase 6).',
      grievances: 'Informational directory of grievance redressal channels and escalation paths (Phase 3).',
      services: 'Directory of municipal delivery routes and digital services on e-NagarPalika (Phase 3).',
      verification: '82 researched government source registries, gazette citations, and research demarcation.',
    },
    finder: {
      searchPlaceholder:
        'Search 50 schemes by name, keyword, category or benefit (e.g. Ladli Behna, Pension, PM-JAY)...',
      searchLabel: 'Search Schemes',
      clearSearch: 'Clear search query',
      resultsCount: 'Showing {count} of {total} researched schemes',
      noResultsTitle: 'No Matching Schemes Found',
      noResultsDesc: 'Try adjusting your search keywords, scheme level, or eligibility filters.',
      clearAllFilters: 'Reset All Filters',
      filterByLevel: 'Filter by Scheme Level',
      filterByCategory: 'Filter by Category',
      mpProminenceBadge: 'Madhya Pradesh Focus',
      levels: {
        all: 'All Levels',
        state: 'Madhya Pradesh State',
        central: 'Central Government',
        central_state: 'Jointly Implemented',
      },
      categories: {
        all: 'All Categories',
        agriculture_farmers: 'Agriculture & Farmers',
        women_child_welfare: 'Women & Child Welfare',
        education_scholarships: 'Education & Scholarships',
        health_medical_assistance: 'Health & Medical',
        housing_urban_development: 'Housing & Urban',
        employment_skill_development: 'Employment & Skill',
        social_security_pensions: 'Social Security & Pensions',
        financial_inclusion_livelihoods: 'Financial Inclusion',
        other: 'Other Welfare',
      },
      eligibilityDrawer: {
        title: 'Rule-Based Eligibility Comparison',
        toggle: 'Criteria Comparison (Optional)',
        academicNotice:
          'Academic Demonstration: Evaluates structured conditions against researched dataset bounds. Unrecorded criteria remain "Cannot determine" rather than disqualifying you.',
        ageLabel: 'Age (Years)',
        agePlaceholder: 'e.g. 25',
        genderLabel: 'Gender',
        genderAll: 'All Genders',
        genderWomen: 'Women',
        genderMen: 'Men',
        incomeLabel: 'Annual Household Income (₹)',
        incomePlaceholder: 'e.g. 200000',
        bplLabel: 'BPL Card Status',
        bplAny: 'Any / Unspecified',
        bplYes: 'Hold BPL Card',
        bplNo: 'No BPL Card',
        disabilityLabel: 'Disability Status',
        disabilityAny: 'Any / Unspecified',
        disabilityYes: 'Person with Disability',
        disabilityNo: 'No Disability',
        categoryLabel: 'Social Category',
        statusFilter: 'Filter by Evaluation Status',
        statusAll: 'All Eligibility Outcomes',
        statusMeets: 'Meets Known Criteria',
        statusCannotDetermine: 'Cannot Determine / Info Unrecorded',
        resetEligibility: 'Clear Criteria',
      },
      card: {
        viewDetails: 'View Details & Sources',
        benefit: 'Benefit',
        meetsEligibility: 'Meets known criteria',
        doesNotMeetEligibility: 'Does not meet criteria',
        cannotDetermineEligibility: 'Criteria unrecorded',
        hindiFallbackNotice: '(No Hindi translation available)',
      },
      detail: {
        backToFinder: 'Back to Scheme Finder',
        overviewTab: 'Overview',
        benefitsTab: 'Benefits',
        eligibilityTab: 'Eligibility',
        documentsTab: 'Documents',
        applyTab: 'How to Apply',
        sourcesTab: 'Official Sources',
        faqsTab: 'FAQs',
        officialPortal: 'Official Application Portal',
        targetBeneficiaries: 'Target Beneficiaries',
        objectives: 'Key Objectives',
        unrecorded: 'Not recorded in official source records',
        mandatoryDocs: 'Mandatory Documents',
        conditionalDocs: 'Conditional Documents',
        noDocsListed: 'No specific document checklist recorded in source records.',
        applicationSteps: 'Application Steps',
        statusCheck: 'How to Check Status',
        demarcationNotice:
          'Academic Demarcation: JanSahayak is an academic demonstration prototype. Facts are compiled from official government gazettes and portals as of the research date. Always confirm critical eligibility on the respective official government portal.',
        sourcesTitle: 'Researched Official Sources & Citations',
        evidenceTrail: 'Field-Level Evidence Trail',
        sourceAuthority: 'Issuing Authority',
        locator: 'Source Locator',
        verifiedLink: 'Visit Official Portal',
        noFaqsAvailable: 'No specific FAQs recorded for this scheme.',
        explanatoryContentNotice:
          'Citizen-facing summaries are explanatory and compiled from researched government records, not formal government proclamations.',
      },
    },
    assistant: {
      title: 'Civic Assistant (RAG)',
      badge: 'Academic Demo Prototype',
      ragSubtitle: 'Source-Grounded Gemini RAG',
      description:
        'Ask questions about 50 researched Madhya Pradesh & Central welfare schemes. Answers are formulated strictly using retrieved official source evidence.',
      inputPlaceholder:
        'Ask in English, Hindi, or Romanized Hindi (e.g., How to apply for Ladli Behna? KCC loan rules...)',
      askButton: 'Ask Question',
      askingButton: 'Retrieving & Generating...',
      clearButton: 'Clear',
      suggestedQuestionsTitle: 'Sample Questions to Try',
      suggestedQuestions: [
        'How to apply for Ladli Behna scheme?',
        'KCC ka loan kitna hota hai?',
        'मनरेगा में काम कैसे माँगूँ?',
        'PM Surya Ghar ki subsidy kitni milegi?',
        'What documents are needed for Pratibha Kiran?',
      ],
      emptyTitle: 'Ask Any Question About Welfare Schemes',
      emptyDescription:
        'Inquire about benefits, eligibility, required documents, application procedures, and deadlines for 50 researched central and Madhya Pradesh schemes.',
      answerTitle: 'Grounded Answer',
      relevantSchemesTitle: 'Matched Researched Schemes',
      sourcesTitle: 'Retrieved Official Source Evidence',
      issuingAuthorityLabel: 'Issuing Authority',
      locatorLabel: 'Source Locator',
      officialLinkText: 'Visit Official Portal',
      uncertaintyTitle: 'Evidence Limitation & Uncertainty Notice',
      uncertaintyDefaultNotice:
        'The verified research dataset does not establish complete details for this specific inquiry. Please verify directly with official department portals or the MP CM Helpline (181).',
      partialEvidenceTitle: 'Partial Evidence / Unanswered Topics Notice',
      partialEvidenceNotice:
        'Information for some requested topics is unestablished in the verified dataset. Only supported facts are shown.',
      noEvidenceTitle: 'No Matching Scheme Records Found',
      noEvidenceNotice:
        'No matching government scheme records were retrieved from the verified 50-scheme dataset. Please check your spelling or search by scheme name.',
      academicDemarcation:
        'Academic Demonstration: Answers are synthesized from retrieved scheme records without external web access or hallucination. JanSahayak does not accept or approve applications.',
      unconfiguredNotice:
        'Civic Assistant service is currently unconfigured. Set GEMINI_CHATBOT_API_KEY in the environment to activate conversational completions.',
      errorNotice:
        'An unexpected error occurred while processing your question. Please try again shortly.',
      charCount: '{count}/500 characters',
    },
    placeholders: {
      finderTitle: 'Scheme Finder & Catalog',
      finderDescription:
        'A comprehensive repository of 50 researched state and central welfare schemes with structured eligibility criteria, application routes, and benefit breakdowns.',
      finderBadge: 'Phase 2 Implementation',
      finderBadgeCount: '50 Researched Schemes',
      finderFeature1Title: 'Category & Keyword Filtering',
      finderFeature1Desc:
        'Instant multi-parameter filtering across Agriculture, Social Security, Healthcare, Housing, Education, and Employment.',
      finderFeature2Title: 'Explicit Eligibility Assessment',
      finderFeature2Desc:
        'Evaluate demographic criteria with strict unknown-state preservation rather than negative inferences.',
      finderFeature3Title: 'Canonical Shared Scheme Detail',
      finderFeature3Desc:
        'Unified scheme view with official portal links, required documentation checklists, and benefit amounts based on researched source records.',

      assistantTitle: 'Civic Assistant (RAG)',
      assistantDescription:
        'An upcoming conversational assistant powered by Google Gemini, grounded strictly in curated municipal records and scheme guidelines without hallucinations.',
      assistantBadge: 'Phase 6 Implementation',
      assistantNotice:
        'The Civic Assistant is currently in active preparation. The dual-key Gemini architecture foundation is initialized, and retrieval datasets (282 RAG chunks, 379 FAQs) are staged for integration in Phase 6.',
      assistantNoSimulationNotice:
        'In accordance with project integrity standards, live AI responses are not simulated or mocked. Real Gemini RAG completions will be activated once retrieval pipelines are verified.',
      assistantPlannedCapabilitiesTitle: 'Planned Capabilities',
      assistantCap1: 'Bilingual Devanagari and Romanized Hindi natural language query understanding.',
      assistantCap2: 'Strict source citations with direct references to official government gazettes and portals.',
      assistantCap3: 'Explicit fallback to official helplines (CM Helpline 181) whenever queries exceed researched data.',

      grievancesTitle: 'Civic Grievance Redressal Directory',
      grievancesDescription:
        'Informational overview of formal grievance channels, turnaround SLAs, and escalation paths to be connected in Phase 3.',
      grievancesBadge: 'Phase 3 Implementation',
      grievanceFeature1Title: 'Researched Redressal Channels',
      grievanceFeature1Desc:
        'Structured catalog of state-level (CM Helpline 181) and municipal grievance channels with researched operating scopes.',
      grievanceFeature2Title: 'SLA & Turnaround Standards',
      grievanceFeature2Desc:
        'Researched resolution timelines and administrative escalation levels without presenting them as an active filing desk.',
      grievanceFeature3Title: 'Scheme-Grievance Linkages',
      grievanceFeature3Desc:
        'Direct mapping between welfare schemes and corresponding redressal authorities based on researched relationship datasets.',
      grievanceSeparationNotice:
        'Swachh Gwalior Sanitation Grievance Separation: Local municipal sanitation complaints (solid waste, garbage dumps, drainage) are managed and resolved independently within the dedicated Swachh Gwalior module.',

      servicesTitle: 'Municipal Civic Services Directory',
      servicesDescription:
        'Informational directory of official Gwalior Municipal Corporation (GMC) digital delivery routes hosted on e-NagarPalika.',
      servicesBadge: 'Phase 3 Implementation',
      serviceFeature1Title: 'Researched Municipal Directory',
      serviceFeature1Desc:
        'Structured index of municipal services (birth/death certificates, property tax, piped water supply, trade licenses) to be connected in Phase 3.',
      serviceFeature2Title: 'Direct Routing vs General Portals',
      serviceFeature2Desc:
        'Clear distinction between verified direct online application routes and general informational department portals based on source research.',
      serviceFeature3Title: 'Scheme-Service Linkages',
      serviceFeature3Desc:
        'Bidirectional navigation connecting civic municipal services with relevant welfare schemes from researched dataset relationships.',
      serviceIntegrationNotice:
        'Directory Integration Status: Civic service listings and direct application routes will be formally connected with the researched dataset in Phase 3. No live application forms are submitted here.',

      verificationTitle: 'Official Sources & Research Demarcation',
      verificationDescription:
        'Complete transparency regarding data provenance, official source registries, and academic prototype boundaries.',
      verificationBadge: 'Phase 4 Implementation',
      verificationBadgeCount: '82 Researched Sources',
      registryTitle: '82 Researched Government Sources',
      registryDesc:
        'Scheme facts are anchored to researched official government portals (.gov.in / .nic.in), official gazette notifications, and ministry executive orders.',
      gazetteTitle: 'Distinction of Facts, Explanations & Unknowns',
      gazetteDesc:
        'Preserves strict separation between source-supported facts, generated citizen explanations, and unresolved information with explicit evidence locators.',
      noBadgeNotice:
        'Note: Public-facing verified/unverified badges are intentionally omitted to avoid misleading citizens into treating academic research labels as formal government certification.',
      demarcationNotice:
        'Academic Boundary: JanSahayak is a demonstration prototype. Information is verified as of the dataset release date; always confirm critical eligibility on the respective official government portal.',
    },
  },
};

