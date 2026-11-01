# Research and evidence coverage

As of 2026-10-31, the final catalogue has **50 records** and **78 sources**. **48 records** cite at least one official source other than an official summary; **2 records** rely only on an official summary: pm_kisan_mandhan, pm_svanidhi. An official source may still be old or scheme-summary-level, so source presence alone is not a claim that every rule is current.

The nine materially improved existing records and six additions are detailed in `scheme-research-notes.md`. All populated material fields have an evidence reference. However, among 1,193 evidence entries, 1,039 lack a locator and 222 use generic summary language; this materially limits auditability, especially in the 35 retained records not substantively researched in this pass. Only 6 records (the six additions) have locators and non-generic summaries on all of their recorded evidence entries. These are evidence-quality gaps, not affirmative evidence that claims are false.

The current dataset contains no public verification status or badge field. The reports track sourcing quality internally. It is not accurate to call the catalogue fully verified: current cycle windows remain unconfirmed for several schemes, some records rely on summaries, and field-level locators and specific evidence summaries are incomplete for many inherited values.

## Authority and cycle caveats

- Direct checks were made against official MoE CSSS FAQ, MP scholarship pages/portal, MoTA scholarship pages/guidelines/sanction records, MoE PM-Vidyalaxmi guidelines, MP CM Helpline scheme details, a 2026-updated MP district page, DFPD PMGKAY pages, NHA senior FAQ, MSME PM Vishwakarma FAQ/booklet, DFS/RBI KCC sources and other source URLs listed in the registry.
- Official summary-only records are reported in `dataset-completeness-report.json`; they should not be displayed as though each claim were grounded in an operative department order.
- The MMVY 2025 corrigendum URL was not accessible. Its contents were not used to claim current rules.
- The PM-Vidyalaxmi portal notice checked on 2026-10-31 explicitly reports the FY 2025–26 interest-subvention claim window as 2026-09-01 through 2026-12-31; this is not a new loan application deadline. No other application window is called open based only on an old date or a general portal.

See `unresolved-information.md` and `validation/validation-report.json` for field and record details.


## Final content QA addendum (2026-11-01)

The scheme catalogue remains at 50. Four official source records were added and all 78 source IDs at QA start remain present. The validation report’s strict primary evidence count is 17 schemes where a field-level citation resolves to a source typed `official_government_primary`, `official_government_guideline`, or `official_government_notification`; this narrow count is not equivalent to the older “official source other than summary” count of 48, which also includes the general `official_government` and official application portal source types. Neither count alone proves every field is current.

The field-level gap fell from 31 to five populated fields; 463 evidence entries still have no locator, and 115 match the validator’s generic-summary wording heuristic. These are traceability indicators, not semantic-verification claims. See `field-level-evidence-remediation.md` and `validation/validation-report.json`.
