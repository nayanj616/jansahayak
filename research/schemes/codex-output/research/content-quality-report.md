# Content quality report — final QA, 2026-11-01

## Generated content

- Schemes reviewed: 50; schemes added: 0; all 50 English short summaries were revised from the starting snapshot.
- English card summaries: 50/50.
- Hindi card summaries: 50/50.
- Hindi audience summaries: 50/50.
- FAQs: 379, compared with 250 at the start. **54 removed, 196 revised, 183 added** (differences measured by stable FAQ IDs and full record content).
- Generated factual statements: 1079; statements without evidence references: 0. Answered FAQs without evidence references: 0. These are reference-coverage checks, not semantic entailment proof. Generated unknown-information notes: 553. Hindi equivalents are present only where prepared: 50 answers; the remaining FAQ answers are English-only.
- RAG chunks: 282 focused English chunks (264 at start; net +18 after restructuring); exact repeated sentences across chunks for the same scheme: 0 after deduplication. The starting set had 44 chunks with internal sentence repeats and 66 cross-topic repeated-sentence groups. Seventy prior chunk IDs were retired/replaced, 88 focused chunk IDs were added, and 184 IDs were retained (text revised for 184). Topics are emitted only where supported content exists.
- Search terms retain `term_role=retrieval_only_not_eligibility_evidence`; keywords are not used as eligibility evidence.

Short summaries combine an evidence-linked description, broadly described audience, and established assistance when available. Detailed fields remain separate statements with `content_origin=generated_explanation_not_official`. Unknown-information notes are not converted to false, zero or ineligible values.

## Retrieval test set

- 42 realistic offline expected-answer cases: 20 Hindi in Devanagari, one Romanized Hindi, and 21 English cases.
- Expected supported responses: 36; expected unknown: 6.
- Covers eligibility, benefit amounts, documents, application routes, missing information, similar schemes, abbreviations/aliases, one deliberate common misspelling, informal wording and current application-period questions.
- Every expected supported answer carries scheme/field/source references. Unknown requests have an explicit expected unknown response or list of fields that remain unestablished.
- This file is a dataset test fixture; it was not run against a Gemini, search index or retrieval system and is not a measure of model performance.

## Manual sample

One scheme was reviewed from each of the nine catalogue categories: social_security_pensions: `atal_pension`; education_scholarships: `csss_cus`; agriculture_farmers: `kisan_credit_card`; employment_skill_development: `mgnrega`; women_child_welfare: `mp_ladli_behna`; financial_inclusion_livelihoods: `pm_jan_dhan`; other: `pm_surya_ghar`; housing_urban_development: `pmay_u2`; health_medical_assistance: `pm_jay`. The sample checked card usefulness, FAQ relevance/evidence linkage, chunk topic separation and source references. This is a representative content review, not semantic certification of all claims. Hindi copy was reviewed in this sample for broad meaning and absence of new eligibility promises; exhaustive sentence-by-sentence English/Hindi equivalence was not machine-verified.

## Limitations

- Evidence references and locators do not establish semantic entailment by themselves. Remaining source gaps and access limitations are documented in `unresolved-information.md`.
- Not all 463 remaining locator gaps or 115 remaining generic summaries could be resolved in this focused final pass. Inherited evidence remains distinguishable from sources directly inspected on 2026-11-01.
- Application windows and operational status are not inferred from old dates or generic scheme pages.
