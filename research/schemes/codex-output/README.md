# JanSahayak Scheme Dataset

Application-oriented scheme reference dataset for citizens in Madhya Pradesh, including Gwalior. The deliverable is a standalone data workspace; it is not part of the JanSahayak application and has not been imported into an application database.

## Contents

- `data/schemes.json` — 50 scheme records using the current record contract.
- `data/sources.json` — 82 normalized source records with exact URLs, issuing authorities, checked dates and scope notes.
- `data/scheme-service-links.json` — civic service catalog and supported scheme relationships.
- `data/scheme-grievance-links.json` — grievance channel catalog and supported relationships.
- `data/citizen-content.json` — evidence-linked generated English citizen explanations and partial Hindi equivalents.
- `data/scheme-faqs.json` — scheme-specific evidence-referenced FAQs; unsupported answer fields remain unknown.
- `data/rag-chunks.json` — 282 focused retrieval chunks with scheme and evidence references.
- `data/search-terms.json` — aliases and bilingual retrieval terms, explicitly not eligibility evidence.
- `schema/proposed-application-data-contract.json` — additive integration proposal; not application code or an implemented schema change.
- `schema/scheme.schema.json` — JSON Schema record structure.
- `schema/enums.json` — controlled values and unknown/filter semantics.
- `research/retrieval-test-questions.json` — 42 offline expected-answer cases for a future retriever; not a live model evaluation.
- `research/content-quality-report.md` and `research/field-level-evidence-remediation.md` — final QA and evidence remediation results.
- `research/` — methodology, baseline, record research notes, completeness, unresolved and exclusion reports.
- `validation/` — structural/reference validation and duplicate analysis.

## Catalogue snapshot (2026-11-01)

- Scheme level: {'central': 16, 'central_state': 13, 'state': 21}.
- Categories: {'agriculture_farmers': 5, 'education_scholarships': 11, 'employment_skill_development': 3, 'financial_inclusion_livelihoods': 3, 'health_medical_assistance': 1, 'housing_urban_development': 2, 'other': 2, 'social_security_pensions': 17, 'women_child_welfare': 6}.
- Records with at least one non-summary official source: 48 of 50. Summary-only records: 2 (pm_kisan_mandhan, pm_svanidhi).
- Civic-service links: 12 edges across 12 schemes (9 service records).
- Grievance links: 24 edges across 24 schemes (5 grievance channels). MP CM Helpline links are labeled as general public grievance routes, not scheme-specific remedies.

## Data interpretation

Unknown scalar values are `null`; empty arrays mean no items were established, not that a person is ineligible. A `false` BPL value is only used where a source explicitly establishes that BPL status is not required. Current application windows and 2026–27 continuation are not assumed. Loan, insurance, scholarship, crop-season and sub-scheme benefits may have separate eligibility rules; read the record notes and source-linked evidence before advising an individual.

The scheme records do not contain public verified/unverified badges. Internal evidence coverage and research gaps are reported in `research/verification-report.md` and `validation/validation-report.json`.

## Source and evidence use

Use `sources` to resolve registry IDs. Use `evidence_by_field` to trace material scheme fields to source IDs, summaries and locators. Generated text is stored separately and marked `generated_explanation_not_official`; its statements carry references back to scheme fields and source records. Government summary pages are distinguished from primary guidelines, orders and operational pages. Direct inspection is recorded separately from inherited source references. This remediation pass added locators to directly inspected records where the page established a useful section/field locator; inaccessible sources are called out without guessed locators.

The earlier evidence-remediation pass (before the final content QA below) updated 637 evidence entries. A total of 493 evidence entries still lack locators, 131 retain inherited generic summary wording, and 31 populated material fields lack a field-specific evidence entry. Twenty-five sources were directly inspected and six access attempts failed; see `research/evidence-remediation-report.md`. A byte-for-byte pre-edit snapshot is kept under `work/backups/outputs-2026-11-01/outputs/` outside the deliverable bundle.

## Validation status

All output JSON parsed. Custom structural, scheme/source/evidence and relationship-reference checks, generated-content evidence-reference checks and duplicate ID checks reported zero errors. The `jsonschema` package is unavailable, so no formal JSON Schema engine validation is claimed; manual required-key and declared primitive-type checks were performed. The validator cannot prove semantic entailment or current legal force of every paraphrase. The dataset is not claimed fully verified. See `validation/validation-report.json`, `research/evidence-remediation-report.md` and `research/unresolved-information.md`.


## Final content QA snapshot (2026-11-01)

The dataset still has 50 schemes. The final QA pass preserved all scheme IDs, all 78 source IDs present at its start, and existing civic relationship IDs; four additional official source records were registered. Of the 31 populated material fields previously lacking field-level evidence, 26 now have references and five remain unresolved. The dataset has 50 English and 50 Hindi short summaries, 379 evidence-referenced FAQs, and 282 focused English retrieval chunks. The offline retrieval fixture has 42 questions, including 21 Hindi queries and six expected-unknown cases.

The backup created before this pass is outside the deliverable bundle at `work/backups/final-qa-2026-11-01/outputs/`. Structural/reference checks do not prove semantic accuracy; see `validation/validation-report.json` and the QA reports.
