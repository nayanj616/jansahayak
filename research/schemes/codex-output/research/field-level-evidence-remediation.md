# Field-level evidence remediation — final QA, 2026-11-01

## Outcome

The previous validation snapshot listed 31 populated material fields without a field-level evidence reference. This pass added direct support for 26; five remain explicitly unresolved. The scheme records still contain all 50 original IDs. The backup made before this pass is at `work/backups/final-qa-2026-11-01/outputs/`.

| Metric | At start | After pass | Change |
|---|---:|---:|---:|
| Scheme records | 50 | 50 | no catalogue change |
| Registered source IDs | 78 | 82 | 4 added; all original IDs retained |
| Field evidence entries | 1193 | 1215 | +22 |
| Evidence entries without locators | 493 | 463 | 30 fewer |
| Generic-summary heuristic (`supports the recorded`) | 131 | 115 | 16 fewer |
| Populated material fields without field-level evidence | 31 | 5 | 26 resolved |

The locator and generic-summary figures are structural counts. A locator’s presence does not prove the full claim is semantically supported. New entries and field-level references account for some of the net reductions. The unresolved remainder was not assigned guessed locators or unrelated sources.

## Five unresolved populated fields

- `pm_vishwakarma.document_notes` — retained as unresolved; value: `MSME FAQ says no documents need to be uploaded at portal registration; applicants provide Aadhaar number and bank account details at CSC. Identity/trade are checked through biometr`. See unresolved-information report for source/access limitation.
- `pm_vidyalaxmi.renewal_process` — retained as unresolved; value: `Loan repayment follows lender agreement; interest subvention only during moratorium and once for UG/PG/integrated course.`. See unresolved-information report for source/access limitation.
- `mp_mmvy.renewal_process` — retained as unresolved; value: `Exact continuation/renewal conditions depend on current MMVY order and course; not fully established in detail here.`. See unresolved-information report for source/access limitation.
- `pmgkay.document_notes` — retained as unresolved; value: `No universal separate document list for PMGKAY; new NFSA inclusion/document checklist is state-specific and not asserted here.`. See unresolved-information report for source/access limitation.
- `pmgkay.renewal_process` — retained as unresolved; value: `No separate renewal; NFSA ration-card status and category are administered under state procedures.`. See unresolved-information report for source/access limitation.

## Evidence entries improved in this pass

- 25 previously unlocated existing evidence records gained a source locator after direct inspection.
- 23 existing evidence summaries were rewritten with source-specific descriptions; the generic-summary validator heuristic fell by 16 entries overall (131 to 115).
- Field-level references were added for the 26 resolved material fields. The complete field list, source IDs and locator descriptions are in the scheme records.

## Remediation carried out

- KCC document-note field now points to RBI Master Circular §13.3, which leaves documentation to bank policy; it is not a universal document checklist.
- PM-Vishwakarma document note remains unresolved because the official FAQ endpoint could not be inspected.
- ST Post-Matric and ST Pre-Matric identity/objective/document/registration/renewal fields now cite the relevant MoTA guidelines. The Pre-Matric guideline is expressly for 2021–22 through 2025–26; no 2026–27 extension was established from it.
- PM-Vidyalaxmi description, objective and document note now cite the 2024 Ministry guideline and the portal FAQ. Renewal remains unresolved: the record describes loan repayment/subvention duration, not renewal.
- Pratibha Kiran description/objective/documents/application fields cite MP department/CM Helpline and district government pages. Annual process is described; a separate renewal checklist is not established.
- MMVY description/objective/document/application fields cite the MP CM Helpline summary. The current checklist and renewal process are not established; the 2025 corrigendum fetch failed.
- PMGKAY description/objective/distribution process now cite the DFPD FY 2024–25 Annual Report. A separate document checklist and renewal procedure are not established.
- PM-SYM income wording is supported with the Ministry guideline: monthly income of ₹15,000 or less. The e-Shram card’s “below ₹15,000” wording was removed from that field’s evidence because it is narrower.

Directly inspected sources for this pass and section locators are recorded in `schemes.json` and `sources.json`. Failed source-access attempts and inherited evidence are not represented as direct checks.
