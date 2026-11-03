/**
 * Internationalization (i18n) Type Definitions for JanSahayak
 * Supports bilingual English (default) and Hindi (Devanagari).
 */

export type Language = 'en' | 'hi';

export interface CategoryTranslation {
  label: string;
  desc: string;
}

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
    filter: string;
    refresh: string;
    viewTracking: string;
    trackComplaint: string;
    auditTrail: string;
    enlargePhoto: string;
    imageUnavailable: string;
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
    commandCenter: string;
    cityAnalytics: string;
    complaintQueue: string;
    welfareDirectory: string;
    sanitationGuidelines: string;
    platformArchitecture: string;
    fieldTasksQueue: string;
    workerWelfareSchemes: string;
    civicAssistant: string;
    grievanceGuidance: string;
    civicServicesPortal: string;
    citizenDashboard: string;
  };

  public: {
    header: {
      portalTitle: string;
      portalSubtitle: string;
      monumentBadge: string;
    };
    footer: {
      rightsReserved: string;
      academicNotice: string;
      disclaimer: string;
      madeWith: string;
      forGwalior: string;
    };
    home: {
      heroTitle: string;
      heroSubtitle: string;
      fileGrievanceCta: string;
      exploreSchemesCta: string;
      swachhGwaliorCta: string;
    };
  };

  citizen: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    reportComplaint: string;
    scopeArea: string;
    activeSession: string;
    recentComplaints: string;
    complaintsLogged: string;
    noComplaintsTitle: string;
    noComplaintsDesc: string;
    fileFirstComplaint: string;
    timeline: string;
    browseSchemes: string;
    askAssistant: string;
    exploreSchemesTitle: string;
    exploreSchemesDesc: string;
    civicAssistantTitle: string;
    civicAssistantDesc: string;
    reportModal: {
      title: string;
      subtitle: string;
      categoryLabel: string;
      wardLabel: string;
      landmarkLabel: string;
      landmarkPlaceholder: string;
      descLabel: string;
      descPlaceholder: string;
      gpsTitle: string;
      detecting: string;
      detectLocation: string;
      redetectLocation: string;
      gpsNotSupported: string;
      gpsAcquiring: string;
      photoLabel: string;
      photoUploadPrompt: string;
      photoUploadHelp: string;
      removePhoto: string;
      cancel: string;
      submit: string;
      submitting: string;
      successMessage: string;
    };
    historyModal: {
      title: string;
      subtitle: string;
      emptyTitle: string;
      emptyDesc: string;
      close: string;
      statusLabel: string;
    };
  };

  worker: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    refreshTasks: string;
    refreshing: string;
    personaBadge: string;
    beatSector: string;
    division: string;
    stats: {
      assigned: string;
      assignedDesc: string;
      inProgress: string;
      inProgressDesc: string;
      completed: string;
      completedDesc: string;
    };
    tasksTitle: string;
    tasksSubtitle: string;
    tabs: {
      all: string;
      assigned: string;
      inProgress: string;
      completed: string;
    };
    empty: {
      title: string;
      desc: string;
    };
    card: {
      assignedOn: string;
      landmark: string;
      workStarted: string;
      cleanupCompleted: string;
      beforeCleanup: string;
      afterProof: string;
      noBeforePhoto: string;
      uploadProof: string;
      queuedDesc: string;
      inProgressDesc: string;
      completedDesc: string;
      startTask: string;
      starting: string;
      completeTaskProof: string;
      completedBadge: string;
    };
    completeModal: {
      title: string;
      subtitle: string;
      afterPhotoLabel: string;
      takePhotoPrompt: string;
      photoFormatHelp: string;
      removePhoto: string;
      remarksLabel: string;
      remarksPlaceholder: string;
      charCount: string;
      cancel: string;
      submitProof: string;
      submittingProof: string;
      photoRequiredError: string;
    };
    photoModal: {
      closeAria: string;
      beforeTitle: string;
      beforeSubtitle: string;
      afterTitle: string;
      afterSubtitle: string;
    };
  };

  officer: {
    dashboardTitle: string;
    dashboardSubtitle: string;
    refreshQueue: string;
    refreshing: string;
    underReviewBadge: string;
    designationLabel: string;
    scopeSector: string;
    stats: {
      total: string;
      totalDesc: string;
      needsReview: string;
      needsReviewDesc: string;
      activeInProgress: string;
      activeInProgressDesc: string;
      resolved: string;
      resolvedDesc: string;
    };
    analytics: {
      title: string;
      subtitle: string;
      timeframeLabel: string;
      last7Days: string;
      last30Days: string;
      thisQuarter: string;
    };
    queue: {
      title: string;
      subtitle: string;
      countOfTotal: string;
      tabs: {
        all: string;
        underReview: string;
        unassigned: string;
        inProgress: string;
        resolved: string;
      };
      searchPlaceholder: string;
      allStatuses: string;
      allWards: string;
      allCategories: string;
      noMatchTitle: string;
      noMatchDesc: string;
      resetFilters: string;
      inspect: string;
      assign: string;
      reassign: string;
      reviewVerify: string;
    };
    verification: {
      title: string;
      model: string;
      subtitle: string;
      runVerification: string;
      analyzing: string;
      observationalSummary: string;
      wasteReduction: string;
      confidence: string;
      beforeObservations: string;
      afterObservations: string;
      visibleSurfaces: string;
      remainingDebris: string;
      noneRemaining: string;
      deltasObserved: string;
      limitationsTitle: string;
      advisoryTitle: string;
      advisoryDisclaimer: string;
      recheckConfirmTitle: string;
      recheckConfirmDesc: string;
      recheckButton: string;
      cancelRecheck: string;
    };
    assignModal: {
      titleNew: string;
      titleReassign: string;
      complaintPrefix: string;
      selectWorkerLabel: string;
      noWorkers: string;
      workerSectorHelp: string;
      remarksLabel: string;
      remarksPlaceholder: string;
      remarksAuditHelp: string;
      cancel: string;
      dispatching: string;
      confirmDispatch: string;
    };
    reviewDialog: {
      title: string;
      complaintPrefix: string;
      aiAdvisoryLabel: string;
      aiAdvisoryDisclaimer: string;
      decisionLabel: string;
      approve: string;
      approveTarget: string;
      rework: string;
      reworkTarget: string;
      reject: string;
      rejectTarget: string;
      remarksLabel: string;
      remarksPlaceholderApprove: string;
      remarksPlaceholderRework: string;
      remarksPlaceholderReject: string;
      remarksAuditHelp: string;
      cancel: string;
      submitting: string;
      submitDecision: string;
      mandatoryError: string;
    };
    detailModal: {
      closeView: string;
      reviewAction: string;
      assignAction: string;
      reassignAction: string;
      inspectionTitle: string;
      inspectionSubtitle: string;
      evidenceTitle: string;
      citizenBeforePhoto: string;
      workerAfterPhoto: string;
      noPhotoUploaded: string;
      workerAllocated: string;
      noWorkerAssigned: string;
      historyTimeline: string;
    };
  };

  complaints: {
    categories: {
      garbage_dump: CategoryTranslation;
      overflowing_bin: CategoryTranslation;
      drain_blockage: CategoryTranslation;
      dead_animal: CategoryTranslation;
      construction_debris: CategoryTranslation;
      open_defecation: CategoryTranslation;
      sweeping_needed: CategoryTranslation;
      street_cleaning: CategoryTranslation;
      water_logging: CategoryTranslation;
      sewage_overflow: CategoryTranslation;
      solid_waste: CategoryTranslation;
      other: CategoryTranslation;
    };
    statuses: {
      submitted: string;
      assigned: string;
      in_progress: string;
      under_review: string;
      rework_required: string;
      resolved: string;
      rejected: string;
      completed: string;
      cancelled: string;
    };
    priorities: {
      urgent: string;
      high: string;
      normal: string;
      low: string;
    };
  };

  notifications: {
    title: string;
    emptyTitle: string;
    emptyDesc: string;
    markAllRead: string;
    unreadCount: string;
    bellAria: string;
    closeAria: string;
  };

  validation: {
    photoRequired: string;
    wardRequired: string;
    invalidFileType: string;
    fileTooLarge: string;
    remarksRequired: string;
  };

  errors: {
    refreshFailed: string;
    submissionFailed: string;
    taskStartFailed: string;
    unexpectedError: string;
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
    assistant: {
      title: string;
      badge: string;
      ragSubtitle: string;
      description: string;
      inputPlaceholder: string;
      askButton: string;
      askingButton: string;
      clearButton: string;
      suggestedQuestionsTitle: string;
      suggestedQuestions: string[];
      emptyTitle: string;
      emptyDescription: string;
      answerTitle: string;
      relevantSchemesTitle: string;
      sourcesTitle: string;
      issuingAuthorityLabel: string;
      locatorLabel: string;
      officialLinkText: string;
      uncertaintyTitle: string;
      uncertaintyDefaultNotice: string;
      partialEvidenceTitle: string;
      partialEvidenceNotice: string;
      noEvidenceTitle: string;
      noEvidenceNotice: string;
      academicDemarcation: string;
      unconfiguredNotice: string;
      errorNotice: string;
      charCount: string;
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

  tracking: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    backToSwachh: string;
    citizenScope: string;
    workerScope: string;
    officerScope: string;
    unauthorizedTitle: string;
    unauthorizedDesc: string;
    forbiddenTitle: string;
    forbiddenDesc: string;
    selectRole: string;
    overviewTitle: string;
    reportedOn: string;
    complaintNumber: string;
    wardAndLocation: string;
    evidenceTitle: string;
    citizenBeforePhoto: string;
    workerAfterPhoto: string;
    awaitingCleanup: string;
    fieldSanitationTitle: string;
    assignedWorker: string;
    workerContactBeat: string;
    assignedOn: string;
    workStartedOn: string;
    cleanupCompletedOn: string;
    unassignedWorker: string;
    unassignedWorkerDesc: string;
    aiVerificationTitle: string;
    aiVerificationSubtitle: string;
    notTriggeredTitle: string;
    notTriggeredDesc: string;
    wasteReduction: string;
    confidence: string;
    beforeObservations: string;
    afterObservations: string;
    visibleChanges: string;
    limitations: string;
    advisoryNotice: string;
    humanReviewTitle: string;
    humanAuthorityNote: string;
    humanAuthorityDesc: string;
    decisionPending: string;
    decisionApproved: string;
    decisionRework: string;
    decisionRejected: string;
    officerRemarks: string;
    auditTimelineTitle: string;
    nextStepsTitle: string;
    nextStepsSubmitted: string;
    nextStepsAssigned: string;
    nextStepsInProgress: string;
    nextStepsUnderReview: string;
    nextStepsRework: string;
    nextStepsResolved: string;
    nextStepsRejected: string;
  };
}
