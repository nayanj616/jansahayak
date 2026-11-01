# Change report — 2026-10-31

## Summary

- Final catalogue: **50 schemes**; six added to the original 44.
- Nine existing records received material research improvements; 35 existing records were retained without material fact edits.
- No schema or enum changes were made.
- 48 records cite at least one non-summary official source; 2 remain summary-only.

## Existing records improved

CSSS, Kisan Credit Card, Gaon Ki Beti, MP ST Student Welfare, MP Kalyani Sahayata, PMSS for State/UT Police wards, PM Shram Yogi Maandhan, PM Vishwakarma and PM-JAY.

## New records

ST Post-Matric Scholarship; ST Pre-Matric Scholarship (Classes IX–X); PM-Vidyalaxmi; Pratibha Kiran; MMVY; PMGKAY.

## Deliberately unchanged

The remaining 35 original records remain in the catalogue. They were not materially rewritten in this pass; their known gaps remain in the completeness/verification files.

## Unknowns and conflicts

KCC operative credit cap; state-specific/annual scholarship documents and 2026–27 deadlines; MMVY current amended course rules; Pratibha Kiran technical/medical rate validity; PM-Vidyalaxmi current QHEI list and FY 2026–27 claim notice; and PM-JAY MP workflow details remain unconfirmed. The FY 2025–26 PM-Vidyalaxmi claim notice is cited and the portal lists 1 Sep–31 Dec 2026. See `unresolved-information.md`.

## Civic relationships

12 service edges across 12 schemes and 24 grievance edges across 24 schemes. Broad CPGRAMS links were removed; MP CM Helpline relations are explicitly general public-grievance routes. PM-JAY and PMFBY retain specific routes.

## Validation

All output JSON parses; custom schema-shape, vocabulary, source/evidence, relationship and duplicate checks report zero errors and zero normalized alias collisions. All populated material fields have at least one evidence reference, but 1,039 evidence entries have no locator and 222 inherited summaries are generic. These are material source-traceability gaps. No formal JSON Schema validator ran because `jsonschema` is unavailable. Two legacy source records have unknown checked dates. No public verification badge fields are present.

## Final content QA pass — 2026-11-01


- Preserved all 50 scheme IDs, all 78 pre-existing source IDs, and the existing service/grievance IDs and relationships. Added four source registry entries for directly inspected official evidence.
- No schemes were added. `scheme.schema.json` and `enums.json` are unchanged.
- Resolved 26 of the 31 previously listed populated fields without field-level evidence; 5 remain unresolved.
- Evidence gap counts: locators absent 493 → 463; generic-summary heuristic 131 → 115. These are traceability metrics, not a semantic accuracy score.
- Citizen content: all 50 English card summaries revised; 50 Hindi summaries retained/reviewed. FAQs changed 54 removed, 196 revised, 183 added. RAG chunks: 282; exact duplicate sentences across same-scheme chunks: 0.
- Chunk cleanup: starting corpus had 44 chunks with within-chunk repeated sentences and 66 cross-topic repeated-sentence groups; final corpus has no exact repeated sentences. Final chunk IDs: 70 replaced/retired, 88 added, 184 retained (text refreshed in 184).
- Generated text contains 1079 evidence-referenced statements and 553 explicit unknown-information notes; reference presence does not prove entailment.
- Added 42 retrieval expected-answer cases (21 Hindi; 6 expected unknown). No live retrieval system was tested.
- Custom validation reports zero parse, schema-shape/type, cross-reference, FAQ-duplicate and duplicate-chunk-sentence errors. Formal JSON Schema validation was unavailable (`jsonschema` package is not installed). Semantic entailment remains outside automated validation.
- Backup of the pre-pass `outputs/` tree: `work/backups/final-qa-2026-11-01/outputs/`.

See `content-quality-report.md`, `field-level-evidence-remediation.md`, `retrieval-test-questions.json` and the latest `validation/validation-report.json`.
