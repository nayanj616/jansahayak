# Research methodology

## Scope and input treatment

The research prioritized citizen usefulness for Madhya Pradesh and Gwalior. The friend-supplied ZIP (about 1,978 records) was treated as a discovery aid only; its imported eligibility rules were not accepted as evidence. The previously prepared curated set and current 44-record output were inspected before any dataset edits. The baseline is preserved in `baseline-report.md`.

## Selection and research

The existing records were reviewed individually. Nine records received material research updates: CSSS, Kisan Credit Card, Gaon Ki Beti, MP ST Student Welfare, MP Kalyani Sahayata, PMSS for State/UT Police personnel, PM Shram Yogi Maandhan, PM Vishwakarma and PM-JAY. Six schemes were added: ST Post-Matric Scholarship, ST Pre-Matric Scholarship (Classes IX–X), PM-Vidyalaxmi, Pratibha Kiran, MMVY and PMGKAY.

For additions and material updates, official ministry/state pages, guidelines, notifications, government portals and government district pages were preferred. Official summaries were retained as such and not treated as primary rules. A source with an inaccessible URL is explicitly described as inaccessible in the registry or record notes. Exact scheme-specific cycles, amounts, documents and eligibility were not extrapolated from general descriptions.

## Unknowns and conflicts

- Missing facts remain `null` or empty arrays; they are not converted to zero, false or ineligible.
- A source's general description is not used to infer a citizen's eligibility.
- Current open/closed status and 2026–27 windows are only stated when a current official notice was checked.
- Different scheme pathways are described in text where a single age/income filter would be misleading (e.g. PM-JAY standard and age-70+ pathways; PM-Vidyalaxmi loan vs interest subvention).
- The 2025 MMVY corrigendum URL was not retrievable in this research pass; no substantive claim relies on its unreviewed contents.
- Conflicting or dated information is disclosed in the record and unresolved reports, including KCC's announced credit limit versus the current operative cap, and course-specific Pratibha Kiran rates.

## Validation method

All JSON files were parsed. Custom checks compared record fields with the JSON Schema definition, checked enums and dates, IDs and source/evidence references, service/grievance edges and normalized name/alias collisions. `jsonschema` was not installed, so the report does not claim formal JSON Schema engine validation. Custom structure checks do not independently certify the truth or current force of claims. The validation report lists fields without field-specific evidence; generic inherited summaries and missing locators are counted separately.


## Evidence and RAG remediation addendum (2026-11-01)

The existing 50-scheme catalogue and all 78 source IDs were preserved. This pass directly inspected 21 Madhya Pradesh CM Helpline government summary/detail pages and four central government scheme pages, and attempted six additional sources that were inaccessible or timed out. Only page contents actually reviewed are described as inspected. Source summaries from MP CM Helpline are identified as government summaries rather than underlying scheme orders.

A total of 637 evidence entries were improved (546 locators and 91 evidence summaries). Remaining inherited gaps are detailed in `evidence-remediation-report.md`. Plain-language content, FAQs, search terms and focused retrieval chunks were generated into separate additive files, with field-specific evidence references and unknown answer states. Generated Hindi explanations are partial and not official translations. Automated checks verify reference presence and ID integrity; representative samples across all nine categories were manually checked for traceability and neutral wording. This does not establish semantic entailment for every sentence or current validity for every scheme in 2026–27.
