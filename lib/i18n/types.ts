/**
 * Internationalization (i18n) Type Definitions for JanSahayak
 * Supports bilingual English (default) and Hindi (Devanagari).
 */

export type Language = 'en' | 'hi';

export interface TranslationDictionary {
  common: {
    language: string;
    english: string;
    hindi: string;
    gwaliorMadhyaPradesh: string;
    appName: string;
    appTagline: string;
    academicDemarcation: string;
    academicDisclaimer: string;
    officialPortalNotice: string;
    viewDetails: string;
    explore: string;
    contact: string;
    status: string;
    phaseTarget: string;
    learnMore: string;
    close: string;
    underImplementation: string;
    searchPlaceholder: string;
    allCategories: string;
    noTranslationIndicator: string;
  };
  nav: {
    home: string;
    swachhGwalior: string;
    schemeExploration: string;
    about: string;
    demoRoles: string;
    selectDemoRole: string;
    welcomeCitizen: string;
    welcomeWorker: string;
    welcomeOfficer: string;
  };
  schemeExploration: {
    pageTitle: string;
    pageSubtitle: string;
    sectionTitle: string;
    sectionDescription: string;
    tabs: {
      finder: string;
      assistant: string;
      grievances: string;
      services: string;
      verification: string;
    };
    tabDescriptions: {
      finder: string;
      assistant: string;
      grievances: string;
      services: string;
      verification: string;
    };
    finder: {
      searchPlaceholder: string;
      searchLabel: string;
      clearSearch: string;
      resultsCount: string;
      noResultsTitle: string;
      noResultsDesc: string;
      clearAllFilters: string;
      filterByLevel: string;
      filterByCategory: string;
      mpProminenceBadge: string;
      levels: {
        all: string;
        state: string;
        central: string;
        central_state: string;
      };
      categories: {
        all: string;
        agriculture_farmers: string;
        women_child_welfare: string;
        education_scholarships: string;
        health_medical_assistance: string;
        housing_urban_development: string;
        employment_skill_development: string;
        social_security_pensions: string;
        financial_inclusion_livelihoods: string;
        other: string;
      };
      eligibilityDrawer: {
        title: string;
        toggle: string;
        academicNotice: string;
        ageLabel: string;
        agePlaceholder: string;
        genderLabel: string;
        genderAll: string;
        genderWomen: string;
        genderMen: string;
        incomeLabel: string;
        incomePlaceholder: string;
        bplLabel: string;
        bplAny: string;
        bplYes: string;
        bplNo: string;
        disabilityLabel: string;
        disabilityAny: string;
        disabilityYes: string;
        disabilityNo: string;
        categoryLabel: string;
        statusFilter: string;
        statusAll: string;
        statusMeets: string;
        statusCannotDetermine: string;
        resetEligibility: string;
      };
      card: {
        viewDetails: string;
        benefit: string;
        meetsEligibility: string;
        doesNotMeetEligibility: string;
        cannotDetermineEligibility: string;
        hindiFallbackNotice: string;
      };
      detail: {
        backToFinder: string;
        overviewTab: string;
        benefitsTab: string;
        eligibilityTab: string;
        documentsTab: string;
        applyTab: string;
        sourcesTab: string;
        faqsTab: string;
        officialPortal: string;
        targetBeneficiaries: string;
        objectives: string;
        unrecorded: string;
        mandatoryDocs: string;
        conditionalDocs: string;
        noDocsListed: string;
        applicationSteps: string;
        statusCheck: string;
        demarcationNotice: string;
        sourcesTitle: string;
        evidenceTrail: string;
        sourceAuthority: string;
        locator: string;
        verifiedLink: string;
        noFaqsAvailable: string;
        explanatoryContentNotice: string;
      };
    };
    placeholders: {
      finderTitle: string;
      finderDescription: string;
      finderBadge: string;
      finderBadgeCount: string;
      finderFeature1Title: string;
      finderFeature1Desc: string;
      finderFeature2Title: string;
      finderFeature2Desc: string;
      finderFeature3Title: string;
      finderFeature3Desc: string;

      assistantTitle: string;
      assistantDescription: string;
      assistantBadge: string;
      assistantNotice: string;
      assistantNoSimulationNotice: string;
      assistantPlannedCapabilitiesTitle: string;
      assistantCap1: string;
      assistantCap2: string;
      assistantCap3: string;

      grievancesTitle: string;
      grievancesDescription: string;
      grievancesBadge: string;
      grievanceFeature1Title: string;
      grievanceFeature1Desc: string;
      grievanceFeature2Title: string;
      grievanceFeature2Desc: string;
      grievanceFeature3Title: string;
      grievanceFeature3Desc: string;
      grievanceSeparationNotice: string;

      servicesTitle: string;
      servicesDescription: string;
      servicesBadge: string;
      serviceFeature1Title: string;
      serviceFeature1Desc: string;
      serviceFeature2Title: string;
      serviceFeature2Desc: string;
      serviceFeature3Title: string;
      serviceFeature3Desc: string;
      serviceIntegrationNotice: string;

      verificationTitle: string;
      verificationDescription: string;
      verificationBadge: string;
      verificationBadgeCount: string;
      registryTitle: string;
      registryDesc: string;
      gazetteTitle: string;
      gazetteDesc: string;
      noBadgeNotice: string;
      demarcationNotice: string;
    };
  };
}

