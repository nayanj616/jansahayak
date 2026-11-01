import type {
  SchemeRecord,
  UserEligibilityProfile,
  SchemeEligibilityEvaluation,
  CriterionEvaluation,
  EligibilityStatus,
} from '@/types/schemes';

/**
 * Parses numeric income ceiling from income_limit value
 */
function parseIncomeCeiling(limit: string | number | null): number | null {
  if (limit === null || limit === undefined) return null;
  if (typeof limit === 'number') return limit;
  // If string, extract numbers e.g. "₹2,50,000 per annum" -> 250000
  const cleaned = limit.replace(/,/g, '');
  const match = cleaned.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    // If mentioned "lakh" or "lac"
    if (/lakh|lac/i.test(limit)) {
      return num < 100 ? num * 100000 : num;
    }
    return num;
  }
  return null;
}

/**
 * Evaluates a single scheme against a user eligibility profile.
 * STRICT THREE-STATE RULE SYSTEM:
 * 1. 'meets': Explicit recorded criteria satisfied.
 * 2. 'does_not_meet': Explicit recorded boundary violated.
 * 3. 'cannot_determine': Record has null/unestablished data.
 *
 * Missing fields are NEVER coerced to false, zero, or automatic qualification.
 */
export function evaluateSchemeEligibility(
  scheme: SchemeRecord,
  profile: UserEligibilityProfile
): SchemeEligibilityEvaluation {
  const criteria: Record<string, CriterionEvaluation> = {};
  let evaluatedCount = 0;
  let meetsCount = 0;
  let doesNotMeetCount = 0;
  let cannotDetermineCount = 0;

  // 1. AGE EVALUATION
  if (profile.age !== null && profile.age !== undefined && profile.age > 0) {
    evaluatedCount++;
    const userAge = profile.age;
    const hasMin = scheme.age_min !== null && scheme.age_min !== undefined;
    const hasMax = scheme.age_max !== null && scheme.age_max !== undefined;

    if (!hasMin && !hasMax) {
      criteria.age = {
        status: 'cannot_determine',
        criterion: 'age',
        userValue: userAge,
        schemeValue: null,
        reasonEn: 'Age criteria are unrecorded in official source records for this scheme.',
        reasonHi: 'इस योजना के लिए स्रोत डेटासेट में कोई विशिष्ट आयु सीमा दर्ज नहीं है।',
      };
      cannotDetermineCount++;
    } else if (hasMin && userAge < (scheme.age_min as number)) {
      criteria.age = {
        status: 'does_not_meet',
        criterion: 'age',
        userValue: userAge,
        schemeValue: `Min ${scheme.age_min}`,
        reasonEn: `Age ${userAge} is below the recorded minimum of ${scheme.age_min} years.`,
        reasonHi: `आपकी आयु (${userAge} वर्ष) निर्धारित न्यूनतम आयु (${scheme.age_min} वर्ष) से कम है।`,
      };
      doesNotMeetCount++;
    } else if (hasMax && userAge > (scheme.age_max as number)) {
      criteria.age = {
        status: 'does_not_meet',
        criterion: 'age',
        userValue: userAge,
        schemeValue: `Max ${scheme.age_max}`,
        reasonEn: `Age ${userAge} exceeds the recorded maximum of ${scheme.age_max} years.`,
        reasonHi: `आपकी आयु (${userAge} वर्ष) निर्धारित अधिकतम आयु (${scheme.age_max} वर्ष) से अधिक है।`,
      };
      doesNotMeetCount++;
    } else {
      criteria.age = {
        status: 'meets',
        criterion: 'age',
        userValue: userAge,
        schemeValue: `${scheme.age_min || 'Open'} to ${scheme.age_max || 'Open'}`,
        reasonEn: `Age ${userAge} falls within recorded bounds (${scheme.age_min || 'Open'}–${scheme.age_max || 'Open'} years).`,
        reasonHi: `आपकी आयु (${userAge} वर्ष) योजना की पात्रता सीमा के अनुकूल है।`,
      };
      meetsCount++;
    }
  }

  // 2. GENDER EVALUATION
  if (profile.gender && profile.gender !== 'all') {
    evaluatedCount++;
    const userGender = profile.gender;
    const schemeGender = scheme.gender_eligibility;

    if (schemeGender === null || schemeGender === undefined) {
      criteria.gender = {
        status: 'cannot_determine',
        criterion: 'gender',
        userValue: userGender,
        schemeValue: null,
        reasonEn: 'Gender conditions are not explicitly recorded in dataset.',
        reasonHi: 'लिंग संबंधी पात्रता शर्तें स्रोत डेटासेट में स्पष्ट रूप से दर्ज नहीं हैं।',
      };
      cannotDetermineCount++;
    } else if (
      schemeGender === 'all_genders' ||
      schemeGender.toLowerCase().startsWith('all') ||
      schemeGender.toLowerCase().includes('all gender')
    ) {
      criteria.gender = {
        status: 'meets',
        criterion: 'gender',
        userValue: userGender,
        schemeValue: schemeGender,
        reasonEn: 'Scheme is officially open to all genders.',
        reasonHi: 'यह योजना सभी लिंगों के लाभार्थियों के लिए खुली है।',
      };
      meetsCount++;
    } else if (/\b(women|woman|female|girl|widow|bride)\b/i.test(schemeGender)) {
      if (userGender === 'women') {
        criteria.gender = {
          status: 'meets',
          criterion: 'gender',
          userValue: userGender,
          schemeValue: schemeGender,
          reasonEn: 'Meets targeted women beneficiary condition.',
          reasonHi: 'महिला लाभार्थी पात्रता शर्त पूरी होती है।',
        };
        meetsCount++;
      } else {
        criteria.gender = {
          status: 'does_not_meet',
          criterion: 'gender',
          userValue: userGender,
          schemeValue: schemeGender,
          reasonEn: 'Scheme is restricted to women beneficiaries in official records.',
          reasonHi: 'स्रोत अभिलेखों के अनुसार यह योजना केवल महिलाओं के लिए लक्षित है।',
        };
        doesNotMeetCount++;
      }
    } else if (/\b(men|man|male)\b/i.test(schemeGender) && !/\b(women|female)\b/i.test(schemeGender)) {
      if (userGender === 'men') {
        criteria.gender = {
          status: 'meets',
          criterion: 'gender',
          userValue: userGender,
          schemeValue: schemeGender,
          reasonEn: 'Meets targeted men beneficiary condition.',
          reasonHi: 'पुरुष लाभार्थी पात्रता शर्त पूरी होती है।',
        };
        meetsCount++;
      } else {
        criteria.gender = {
          status: 'does_not_meet',
          criterion: 'gender',
          userValue: userGender,
          schemeValue: schemeGender,
          reasonEn: 'Scheme is restricted to men beneficiaries in official records.',
          reasonHi: 'स्रोत अभिलेखों के अनुसार यह योजना केवल पुरुषों के लिए लक्षित है।',
        };
        doesNotMeetCount++;
      }
    } else {
      criteria.gender = {
        status: 'cannot_determine',
        criterion: 'gender',
        userValue: userGender,
        schemeValue: schemeGender,
        reasonEn: `Conditional gender rule recorded: "${schemeGender}". Further official verification recommended.`,
        reasonHi: `विशेष लिंग शर्त दर्ज है: "${schemeGender}"। आधिकारिक पोर्टल पर पुष्टि अनुशंसित है।`,
      };
      cannotDetermineCount++;
    }
  }

  // 3. ANNUAL INCOME EVALUATION
  if (profile.annualIncome !== null && profile.annualIncome !== undefined && profile.annualIncome >= 0) {
    evaluatedCount++;
    const userIncome = profile.annualIncome;
    const schemeIncome = scheme.income_limit;

    if (schemeIncome === null || schemeIncome === undefined) {
      criteria.income = {
        status: 'cannot_determine',
        criterion: 'income',
        userValue: `₹${userIncome.toLocaleString('en-IN')}`,
        schemeValue: null,
        reasonEn: 'Income limit is unrecorded in source dataset for this scheme.',
        reasonHi: 'इस योजना के लिए स्रोत डेटासेट में कोई आय सीमा दर्ज नहीं है।',
      };
      cannotDetermineCount++;
    } else {
      const ceiling = parseIncomeCeiling(schemeIncome);
      if (ceiling !== null) {
        if (userIncome <= ceiling) {
          criteria.income = {
            status: 'meets',
            criterion: 'income',
            userValue: `₹${userIncome.toLocaleString('en-IN')}`,
            schemeValue: `Up to ₹${ceiling.toLocaleString('en-IN')}`,
            reasonEn: `Annual income is within recorded ceiling (up to ₹${ceiling.toLocaleString('en-IN')}).`,
            reasonHi: `आपकी वार्षिक आय निर्धारित सीमा (अधिकतम ₹${ceiling.toLocaleString('en-IN')}) के भीतर है।`,
          };
          meetsCount++;
        } else {
          criteria.income = {
            status: 'does_not_meet',
            criterion: 'income',
            userValue: `₹${userIncome.toLocaleString('en-IN')}`,
            schemeValue: `Up to ₹${ceiling.toLocaleString('en-IN')}`,
            reasonEn: `Annual income exceeds recorded ceiling of ₹${ceiling.toLocaleString('en-IN')}.`,
            reasonHi: `आपकी वार्षिक आय निर्धारित सीमा (₹${ceiling.toLocaleString('en-IN')}) से अधिक है।`,
          };
          doesNotMeetCount++;
        }
      } else {
        criteria.income = {
          status: 'cannot_determine',
          criterion: 'income',
          userValue: `₹${userIncome.toLocaleString('en-IN')}`,
          schemeValue: String(schemeIncome),
          reasonEn: `Descriptive income condition recorded: "${schemeIncome}". Requires official verification.`,
          reasonHi: `विशिष्ट आय शर्त दर्ज है: "${schemeIncome}"। कृपया आधिकारिक पोर्टल पर पुष्टि करें।`,
        };
        cannotDetermineCount++;
      }
    }
  }

  // 4. BPL REQUIREMENT EVALUATION
  if (profile.isBpl !== null && profile.isBpl !== undefined) {
    evaluatedCount++;
    const userBpl = profile.isBpl;
    const schemeBpl = scheme.bpl_required;

    if (schemeBpl === null || schemeBpl === undefined) {
      criteria.bpl = {
        status: 'cannot_determine',
        criterion: 'bpl',
        userValue: userBpl ? 'Has BPL Card' : 'No BPL Card',
        schemeValue: null,
        reasonEn: 'BPL requirement is unestablished in source records for this scheme.',
        reasonHi: 'इस योजना के लिए बीपीएल (BPL) अनिवार्यता स्रोत अभिलेखों में अनिर्धारित है।',
      };
      cannotDetermineCount++;
    } else if (schemeBpl === true) {
      if (userBpl === true) {
        criteria.bpl = {
          status: 'meets',
          criterion: 'bpl',
          userValue: 'Has BPL Card',
          schemeValue: 'BPL Required',
          reasonEn: 'Meets mandatory Below Poverty Line (BPL) requirement.',
          reasonHi: 'अनिवार्य गरीबी रेखा से नीचे (BPL) शर्त पूरी होती है।',
        };
        meetsCount++;
      } else {
        criteria.bpl = {
          status: 'does_not_meet',
          criterion: 'bpl',
          userValue: 'No BPL Card',
          schemeValue: 'BPL Required',
          reasonEn: 'Scheme officially requires a valid BPL card or certificate.',
          reasonHi: 'आधिकारिक नियमों के अनुसार बीपीएल राशन कार्ड अथवा प्रमाण पत्र अनिवार्य है।',
        };
        doesNotMeetCount++;
      }
    } else {
      criteria.bpl = {
        status: 'meets',
        criterion: 'bpl',
        userValue: userBpl ? 'Has BPL Card' : 'No BPL Card',
        schemeValue: 'Not Required',
        reasonEn: 'BPL status is not required for this scheme.',
        reasonHi: 'इस योजना के लिए बीपीएल कार्ड अनिवार्य नहीं है।',
      };
      meetsCount++;
    }
  }

  // 5. DISABILITY STATUS EVALUATION
  if (profile.hasDisability !== null && profile.hasDisability !== undefined) {
    evaluatedCount++;
    const userDisability = profile.hasDisability;
    const schemeDisability = scheme.disability_eligibility;

    if (schemeDisability === null || schemeDisability === undefined) {
      criteria.disability = {
        status: 'cannot_determine',
        criterion: 'disability',
        userValue: userDisability ? 'Yes' : 'No',
        schemeValue: null,
        reasonEn: 'Disability eligibility criteria not recorded in dataset.',
        reasonHi: 'दिव्यांगता पात्रता मानदंड डेटासेट में दर्ज नहीं हैं।',
      };
      cannotDetermineCount++;
    } else if (schemeDisability === true) {
      if (userDisability) {
        criteria.disability = {
          status: 'meets',
          criterion: 'disability',
          userValue: 'Yes',
          schemeValue: 'Persons with Disabilities',
          reasonEn: 'Meets targeted disability beneficiary condition.',
          reasonHi: 'दिव्यांग लाभार्थी पात्रता शर्त पूरी होती है।',
        };
        meetsCount++;
      } else {
        criteria.disability = {
          status: 'does_not_meet',
          criterion: 'disability',
          userValue: 'No',
          schemeValue: 'Persons with Disabilities only',
          reasonEn: 'Scheme is dedicated exclusively to persons with benchmark disabilities.',
          reasonHi: 'यह योजना केवल दिव्यांग नागरिकों के लिए लक्षित है।',
        };
        doesNotMeetCount++;
      }
    } else {
      criteria.disability = {
        status: 'meets',
        criterion: 'disability',
        userValue: userDisability ? 'Yes' : 'No',
        schemeValue: 'Not exclusive',
        reasonEn: 'Scheme does not exclude beneficiaries based on disability.',
        reasonHi: 'इस योजना में दिव्यांगता के आधार पर कोई रोक नहीं है।',
      };
      meetsCount++;
    }
  }

  // 6. SOCIAL CATEGORY EVALUATION
  if (profile.socialCategory) {
    evaluatedCount++;
    const userCat = profile.socialCategory;
    const schemeCats = scheme.social_categories;

    if (schemeCats === null || schemeCats === undefined || schemeCats.length === 0) {
      criteria.socialCategory = {
        status: 'cannot_determine',
        criterion: 'socialCategory',
        userValue: userCat,
        schemeValue: null,
        reasonEn: 'Social category criteria are not recorded in official records.',
        reasonHi: 'सामाजिक वर्ग संबंधी पात्रता शर्तें डेटासेट में अनिर्धारित हैं।',
      };
      cannotDetermineCount++;
    } else {
      const normalizedCats = schemeCats.map((c) => c.toLowerCase());
      if (
        normalizedCats.includes('all') ||
        normalizedCats.includes('all categories') ||
        normalizedCats.includes('general') ||
        normalizedCats.includes(userCat.toLowerCase())
      ) {
        criteria.socialCategory = {
          status: 'meets',
          criterion: 'socialCategory',
          userValue: userCat,
          schemeValue: schemeCats.join(', '),
          reasonEn: `Social category (${userCat}) matches scheme scope (${schemeCats.join(', ')}).`,
          reasonHi: `आपका सामाजिक वर्ग (${userCat}) योजना के लक्षित वर्ग (${schemeCats.join(', ')}) से मेल खाता है।`,
        };
        meetsCount++;
      } else {
        criteria.socialCategory = {
          status: 'does_not_meet',
          criterion: 'socialCategory',
          userValue: userCat,
          schemeValue: schemeCats.join(', '),
          reasonEn: `Scheme is targeted exclusively for ${schemeCats.join(', ')} beneficiaries.`,
          reasonHi: `यह योजना विशेष रूप से ${schemeCats.join(', ')} वर्ग के लिए आरक्षित है।`,
        };
        doesNotMeetCount++;
      }
    }
  }

  // Compute Overall Evaluation Status
  let overallStatus: EligibilityStatus = 'cannot_determine';
  if (evaluatedCount === 0) {
    overallStatus = 'cannot_determine';
  } else if (doesNotMeetCount > 0) {
    overallStatus = 'does_not_meet';
  } else if (cannotDetermineCount > 0) {
    overallStatus = 'cannot_determine';
  } else if (meetsCount > 0) {
    overallStatus = 'meets';
  }

  return {
    schemeId: scheme.scheme_id,
    overallStatus,
    criteria,
    meetsCount,
    doesNotMeetCount,
    cannotDetermineCount,
  };
}
