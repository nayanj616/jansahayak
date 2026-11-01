# Citizen-friendly content report

Generated on 2026-11-01 from the current 50-record dataset. The additions are kept in `data/citizen-content.json`; they are marked `generated_explanation_not_official` and retain field-level evidence references. The original scheme facts and schema are unchanged.

## Coverage

- English short summaries: 44/50 schemes. Six records did not have an evidence-linked description/objective adequate for a card summary, so no short summary was manufactured for those records.
- Detailed descriptions: generated only from the existing description/objectives fields where those fields have evidence.
- English audience, benefit, eligibility, application, document and condition sections: assembled only when a relevant populated scheme field and field-level evidence are present; no inferred filter values are inserted.
- Hindi short summaries: 44/50; Hindi audience explanations: 50/50. Hindi summary translations were prepared only for source-linked records; beneficiary audience translations are explicitly framed as scheme-record descriptions rather than applicant eligibility decisions.
- FAQs: 250 (five question types per scheme); 191 answers have evidence references; 59 are unanswered with `answer_status=unknown`.
- Hindi FAQ answers: 50; remaining Hindi answers are marked `not_prepared`, not machine-translated or invented. Hindi question wording is available for every FAQ.
- Retrieval chunks: 264, grouped into focused scheme summary, benefit, eligibility, documents, application or conditions topics where supported. Each chunk includes scheme ID, source/evidence references and search terms.
- Search records: 50/50. Aliases and English/Hindi retrieval phrases are tagged as retrieval terms, not eligibility evidence.
- Unsupported generated factual statements or non-null FAQ answers detected by the automated evidence-reference checks: 0. That check tests reference presence and identifiers, not whether each cited text semantically proves the sentence.

## Representative category sample

- `social_security_pensions`: `atal_pension`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `education_scholarships`: `csss_cus`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `agriculture_farmers`: `kisan_credit_card`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `employment_skill_development`: `mgnrega`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `women_child_welfare`: `mp_ladli_behna`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `financial_inclusion_livelihoods`: `pm_jan_dhan`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `other`: `pm_surya_ghar`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `housing_urban_development`: `pmay_u2`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.
- `health_medical_assistance`: `pm_jay`; sampled generated summary, audience, benefit, eligibility, documents, application and conditions fields. Statements were checked to ensure they carry field/evidence references; empty sections remain omitted. This is a traceability and wording sample, not legal or scheme-by-scheme re-adjudication.

## Usage note

Generated text should be presented as a plain-language explanation and linked internally to the cited source. It must not appear as an official quotation. Unknown values should remain unknown in filters and assistant replies. A missing evidence-backed summary is preferable to an inferred claim.
- The source dataset itself still has 31 populated material fields without field-level evidence. The generator omits factual prose for fields lacking field-linked evidence; those source values are listed for follow-up in the validation report. Automated citation checks show zero unsupported generated statements, but cannot prove that referenced sources semantically support all prose.

## Final QA and retrieval update (2026-11-01)


All 50 records now have evidence-linked English and Hindi short summaries. FAQ content was reworked from 250 to 379 records (54 removed, 196 revised, 183 added); repetitive duplicate questions are absent. A final chunk pass reduced the chunk set to 282 English topic chunks and removed exact repeated sentences across chunks for the same scheme.

A set of 42 offline retrieval cases was added, including 21 Hindi cases and 6 expected-unknown cases. These are fixtures for future retrieval evaluation, not model-performance results. See `content-quality-report.md` and `retrieval-test-questions.json`.
