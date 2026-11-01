# Unresolved information and conflicts

## Significant gaps for included schemes

- **KCC:** DFS page and a later budget FAQ conflict on ₹3 lakh versus proposed ₹5 lakh limit. The current operative cap/circular was not found; benefit amount remains unknown. Banks set application document requirements under their own policies.
- **MMVY:** CM Helpline detail is dated 2022. The 2025 state corrigendum URL was inaccessible in this pass. Course-specific current eligibility, amounts and 2026–27 continuation must be confirmed from the operative order before detailed applicant advice.
- **Pratibha Kiran:** MP CM Helpline detail (updated 2022) describes ₹500/month for general graduation and ₹750/month for engineering/medical; the current MP district page (updated 2026) confirms ₹500/month x10 but does not restate the differential. Current validity of the higher rate is unresolved.
- **ST Pre-Matric:** published guidelines cover 2021–22 through 2025–26, while MoTA shows MP sanctions in FY 2025–26. No 2026–27 extension/application schedule was confirmed.
- **ST Post-Matric:** MoTA current summary supports core eligibility/benefits, but exact MP 2026–27 upload checklist and application dates are not confirmed.
- **PM-Vidyalaxmi:** the 2024 guidelines are primary evidence. QHEI selection is revised annually; current 2026 list, portal-specific document list and interest-subvention application dates were not independently checked.
- **CSSS/PMSS/MP scholarships:** older cycle deadlines must not be reused. Current 2026–27 notices were not confirmed for several schemes.
- **PM-JAY:** NHA senior-citizen rules were checked, but MP-specific enrollment workflow/package treatment for every district/provider may change. Verify eligibility and empanelled services using NHA/State Health Agency.
- **PMUY:** official pages previously reviewed exposed conflicting assistance figures; the final benefit amount remains withheld where the operative amount was not settled.
- **MP Kalyani Sahayata / MP ST Student Welfare:** scheme-level detail remains dependent on official summary; state listing/portal evidence confirms a route or listing but not every rule.
- **PM-SYM and PM-SVANidhi:** official scheme information exists, but current enrollment availability and lender/ULB processing remain applicant-specific.

## Source limitations

- The official portal-linked 2025 MMVY corrigendum PDF could not be retrieved by the research browser. Registry notes explicitly state that no claim uses its unreviewed content.
- Some older records retain inherited official pages with no section/page locators or generic evidence descriptions. The validator lists specific coverage and locator gaps.
- Annual crop, fee, portal and application windows vary and must be checked against current notices.

## Filter caution

`null` age/income/gender/BPL values mean unknown or not established, not “no limit” or “ineligible.” Records with multiple pathways (notably PM-JAY, PM-Vidyalaxmi) should not be collapsed into a single binary eligibility answer. Empty arrays are not negative eligibility evidence.

## Evidence remediation and content generation update (2026-11-01)

- 493 of 1193 field-level evidence entries still lack a locator. No locator was invented where source contents could not be inspected.
- 131 evidence summaries still use inherited generic wording; they were not upgraded as if checked.
- Direct inspection covered 25 sources (21 MP government scheme summary pages and four central scheme pages). Access attempts failed for MGNREGA (401 redirected endpoint), PM-KISAN (502), PM Surya Ghar (403), PMEGP guideline PDF (unavailable), PMFBY FAQ (timeout), and PMSBY FAQ (timeout). See `evidence-remediation-report.md`.
- Six of 50 schemes have no English short summary because the current record lacks sufficiently supported description/objective text. Their underlying unknown fields remain null/empty and are not treated as negative matches.
- 59 of 250 FAQ answers remain unknown because the evidence-linked record does not establish an answer. Hindi answers were prepared for 50 audience FAQs; 200 other Hindi answers remain explicitly unprepared.
- Semantic entailment and current 2026–27 continuation were not proven for every inherited claim by automated validation. Direct source checks and inherited research remain distinct.
- A cross-field audit found 31 populated material scheme fields with no field-specific evidence reference. They were not used to generate explanations where field evidence was absent; see `validation/validation-report.json` for the field list.

## Final content QA update (2026-11-01)


The final QA pass leaves five populated material fields without field-level evidence: `pm_vishwakarma.document_notes`, `pm_vidyalaxmi.renewal_process`, `mp_mmvy.renewal_process`, `pmgkay.document_notes`, `pmgkay.renewal_process`. This set is also listed with values and source limitations in `field-level-evidence-remediation.md`.

The field-level evidence gap decreased from 31 to 5. A total of 463 field-evidence entries still have no locator and 115 entries still match the generic-summary heuristic. These counts do not mean all such entries are unsupported; they remain weakly traceable until source inspection supplies a locator or a meaningful statement.

Unresolved current-year information remains, including whether older guideline periods were extended for 2026–27, current MP scholarship application windows/checklists, and whether an old deadline is still operative. The PM-Vidyalaxmi 1 Sep–31 Dec 2026 notice is a financing-bank claim-submission window for eligible FY 2025–26 interest-subvention claims, not a general student-loan application deadline. No current-period status was inferred for other schemes.

PM-SYM threshold wording was harmonized to the Ministry guideline’s ₹15,000-or-less wording. An e-Shram summary phrase saying “below ₹15,000” was not used as support for the inclusive threshold. See field evidence and source records for the exact locators.
